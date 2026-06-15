/* assets/js/data/products.js */
const API_BASE = window.API_BASE || 'http://localhost:3001';
const PLACEHOLDER_IMG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect fill="#EDE7D9" width="400" height="500"/><text fill="#8A8478" font-family="Georgia" font-size="16" text-anchor="middle" x="200" y="260">LORENZO</text></svg>');

function attrEsc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

let products = {};
let productsList = [];

function imgUrl(storagePath) {
  if (!storagePath) return PLACEHOLDER_IMG;
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) return storagePath;
  return API_BASE + '/api/products/image/' + encodeURIComponent(storagePath);
}

async function loadProducts() {
  try {
    const res = await fetch(API_BASE + '/api/products');
    if (!res.ok) throw new Error('Failed to load products');
    const data = await res.json();

    products = {};
    productsList = data.map((p, i) => {
      const slug = p.slug || `product-${i}`;

      const catMap = { polo: 'Polo', pants: 'Pants', suits: 'Suits', chemise: 'Chemise', watches: 'Watches', vests: 'Vests', boots: 'Boots' };
      const categoryLabel = catMap[p.category] || p.category;
      const fabric = p.fabric || t('prod.italian');

      const mapped = {
        id: p.id,
        slug,
        name: p.name,
        displayName: p.name,
        category: `${categoryLabel} · ${fabric}`,
        price: p.price_dzd,
        promotion: p.promotion || null,
        unavailableSizes: p.unavailable_sizes || [],
        isActive: p.is_active !== false,
        get discountedPrice() {
          return this.promotion ? Math.round(this.price * (1 - this.promotion.discount_percent / 100)) : this.price;
        },
        img: imgUrl(p.primary_image),
        thumbs: [imgUrl(p.primary_image)],
        desc: p.description || '',
        badge: p.badge || null,
        categorySlug: p.category,
        sizes: p.sizes || [],
        colors: []
      };

      products[slug] = mapped;
      return mapped;
    });

    // Fetch top sellers
    try {
      const topRes = await fetch(API_BASE + '/api/products/top');
      if (topRes.ok) {
        const topSlugs = await topRes.json();
        topSlugs.forEach(s => { if (products[s]) products[s].isTopSeller = true; });
      }
    } catch (e) { /* ignore */ }

    renderAllProducts();
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

function renderAllProducts() {
  renderFeaturedCollection();
  renderBestSellers();
  renderShopGrid();
  renderCartItems();
}

function productCardHTML(p, isFeatured) {
  const badgeHtml = p.badge
    ? `<span class="product-tag ${p.badge === 'Bestseller' ? 'tag-gold' : 'tag-dark'}">${p.badge}</span>`
    : '';
  const priceHtml = p.promotion
    ? `<span class="product-price"><span class="price-original">${p.price.toLocaleString('fr-DZ')}</span> <span class="price-sale">${p.discountedPrice.toLocaleString('fr-DZ')} <span>DZD</span></span></span>`
    : `<span class="product-price">${p.price.toLocaleString('fr-DZ')} <span>DZD</span></span>`;
  const outOfStock = !p.isActive;
  return `
    <div class="product-card${isFeatured ? ' featured-main' : ''}${outOfStock ? ' out-of-stock' : ''} reveal${isFeatured ? '' : ' reveal-delay-1'}" data-category="${p.categorySlug}" onclick="openProduct('${attrEsc(p.slug)}')">
      <div class="product-img-wrap">
        <img class="product-photo" src="${p.img}" alt="${p.name}" loading="lazy" onload="this.classList.add('loaded')">
        ${badgeHtml}
        ${p.promotion ? '<span class="product-tag tag-sale">-' + p.promotion.discount_percent + '%</span>' : ''}
        ${outOfStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
        <div class="card-overlay"></div>
        ${outOfStock ? '' : '<div class="card-order-btn" onclick="event.stopPropagation();quickAdd(\'' + attrEsc(p.slug) + '\')">' + t('prod.addtocart') + '</div>'}
      </div>
      <div class="product-info">
        <p class="product-cat">${p.category}</p>
        <h3 class="product-name">${p.displayName}</h3>
        <div class="product-price-row">
          ${priceHtml}
        </div>
      </div>
    </div>
  `;
}

function renderFeaturedCollection() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const featured = productsList.filter(p => p.badge === 'New').slice(0, 3);
  grid.innerHTML = featured.map((p, i) => productCardHTML(p, i === 0)).join('');
  setTimeout(initReveal, 50);
}

function renderBestSellers() {
  const track = document.getElementById('bestSellersTrack');
  if (!track) return;
  const sellers = productsList.filter(p => p.badge === 'Bestseller' || p.isTopSeller);
  track.innerHTML = sellers.map(p => {
    const priceHtml = p.promotion
      ? `<span class="product-price"><span class="price-original">${p.price.toLocaleString('fr-DZ')}</span> <span class="price-sale">${p.discountedPrice.toLocaleString('fr-DZ')} <span>DZD</span></span></span>`
      : `<span class="product-price">${p.price.toLocaleString('fr-DZ')} <span>DZD</span></span>`;
    const outOfStock = !p.isActive;
    return `
    <div class="product-card${outOfStock ? ' out-of-stock' : ''}" onclick="openProduct('${attrEsc(p.slug)}')">
      <div class="product-img-wrap">
        <img class="product-photo" src="${p.img}" alt="${p.name}" loading="lazy" onload="this.classList.add('loaded')">
        ${p.badge ? `<span class="product-tag ${p.badge === 'Bestseller' ? 'tag-gold' : 'tag-dark'}">${p.badge}</span>` : ''}
        ${p.promotion ? '<span class="product-tag tag-sale">-' + p.promotion.discount_percent + '%</span>' : ''}
        ${outOfStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
        ${outOfStock ? '' : '<div class="card-order-btn" onclick="event.stopPropagation();quickAdd(\'' + attrEsc(p.slug) + '\')">' + t('prod.addtocart') + '</div>'}
      </div>
      <div class="product-info">
        <p class="product-cat">${p.category.split(' · ')[0]}</p>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-price-row">${priceHtml}</div>
      </div>
    </div>`;
  }).join('');
}

function renderShopGrid(filter) {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;
  const list = filter ? productsList.filter(p => p.categorySlug === filter) : productsList;
  grid.innerHTML = list.map((p, i) => {
    const priceHtml = p.promotion
      ? `<span class="product-price"><span class="price-original">${p.price.toLocaleString('fr-DZ')}</span> <span class="price-sale">${p.discountedPrice.toLocaleString('fr-DZ')} <span>DZD</span></span></span>`
      : `<span class="product-price">${p.price.toLocaleString('fr-DZ')} <span>DZD</span></span>`;
    const outOfStock = !p.isActive;
    return `
    <div class="product-card${outOfStock ? ' out-of-stock' : ''} reveal${i % 2 === 0 ? '' : ' reveal-delay-1'}" data-category="${p.categorySlug}" onclick="openProduct('${attrEsc(p.slug)}')">
      <div class="product-img-wrap">
        <img class="product-photo" src="${p.img}" alt="${p.name}" loading="lazy" onload="this.classList.add('loaded')">
        ${p.badge ? `<span class="product-tag ${p.badge === 'Bestseller' ? 'tag-gold' : 'tag-dark'}">${p.badge}</span>` : ''}
        ${p.promotion ? '<span class="product-tag tag-sale">-' + p.promotion.discount_percent + '%</span>' : ''}
        ${outOfStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
        <div class="card-overlay"></div>
        ${outOfStock ? '' : '<div class="card-order-btn" onclick="event.stopPropagation();quickAdd(\'' + attrEsc(p.slug) + '\')">' + t('prod.addtocart') + '</div>'}
      </div>
      <div class="product-info">
        <p class="product-cat">${p.category.split(' · ')[0]}</p>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-price-row">
          ${priceHtml}
          <span class="product-rating">★★★★★</span>
        </div>
      </div>
    </div>`;
  }).join('');
}


/* assets/js/modules/ticker.js */
let tickerOrders = [];
let tickerIndex = 0;

async function initTicker() {
  const inner = document.querySelector('.ticker-inner');
  if (!inner) return;
  const vals = t('ticker').split(' · '); const items = [...vals, ...vals]
    .map(v => `<div class="ticker-item">${v}<span class="ticker-dot"></span></div>`)
    .join('');
  inner.innerHTML = items;

  // Fetch recent orders
  try {
    const res = await fetch(API_BASE + '/api/orders/recent');
    if (res.ok) tickerOrders = await res.json();
  } catch (e) { /* ignore */ }
}

function cycleTicker() {
  const el = document.getElementById('ordersTickerText');
  if (!el) return;

  let d;
  if (tickerOrders.length > 0) {
    d = tickerOrders[tickerIndex % tickerOrders.length];
  } else {
    return;
  }

  el.style.opacity = '0';
  setTimeout(() => {
    const m = Number(d.mins);
    const mins = m < 60
      ? t('ticker.min').replace('{n}', m)
      : m < 120
        ? t('ticker.hour').replace('{n}', Math.floor(m / 60))
        : t('ticker.hours').replace('{n}', Math.floor(m / 60));
    el.innerHTML = t('ticker.order').replace('{name}', d.name).replace('{city}', d.city).replace('{product}', d.product).replace('{mins}', mins);
    el.style.opacity = '1';
  }, 300);
  tickerIndex++;
}


/* assets/js/modules/cart.js */
let cart = [];

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}
function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadges() {
  const count = getCartCount();
  const badge = document.getElementById('cartBadge');
  const navCount = document.getElementById('cartNavCount');
  if (count > 0) {
    badge.textContent = count; badge.classList.add('show');
    if (navCount) { navCount.textContent = count; navCount.classList.add('show'); }
  } else {
    badge.classList.remove('show');
    if (navCount) navCount.classList.remove('show');
  }
}

function addToCart(slug, size, color, colorHex) {
  const p = products[slug];
  if (!p) return;
  if (!p.isActive) {
    showCartToast(t('detail.unavailable'));
    return;
  }
  color = color || selectedColor || '';
  colorHex = colorHex || selectedColorHex || '';
  const galleryImg = document.getElementById('galleryMainImg');
  const currentImg = galleryImg && galleryImg.src && !galleryImg.src.includes('placeholder') ? galleryImg.src : p.img;
  const existing = cart.find(i => i.slug === slug && i.size === size && i.color === color);
  if (existing) { existing.qty++; }
  else { cart.push({ slug, id: p.id, name: p.name, price: p.promotion ? p.discountedPrice : p.price, img: currentImg, size: size || 'M', color: color || '', colorHex: colorHex || '', qty: 1 }); }
  updateCartBadges();
  renderCartItems();
  const badge = document.getElementById('cartBadge');
  badge.style.transform = 'scale(1.4)';
  setTimeout(() => badge.style.transform = '', 200);
  showCartToast(p.name);
}

function removeFromCart(slug, size) {
  cart = cart.filter(i => !(i.slug === slug && i.size === size));
  updateCartBadges();
  renderCartItems();
}

function changeQty(slug, size, delta) {
  const item = cart.find(i => i.slug === slug && i.size === size);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(slug, size);
  else { updateCartBadges(); renderCartItems(); }
}

function renderCartItems() {
  const list = document.getElementById('cartItemsList');
  const footer = document.getElementById('cartFooter');
  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <div class="cart-empty-title">${t('cart.empty')}</div>
        <div class="cart-empty-sub">${t('cart.emptysub')}</div>
        <button class="cart-empty-btn" onclick="closeCartDrawer();navigate('shop')">${t('cart.browse')}</button>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';
  list.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        <img src="${item.img}" alt="${item.name}" loading="lazy" onload="this.classList.add('loaded')">
      </div>
      <div class="cart-item-info">
        <div class="cart-item-cat">Lorenzo</div>
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-size">${t('cart.size')} ${item.size}${item.color ? '<span style="display:inline-flex;align-items:center;gap:3px;margin-left:4px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;border:1px solid var(--border);background:' + (item.colorHex || '#ccc') + '"></span>' + item.color + '</span>' : ''}</div>
        <div class="cart-item-qty-row">
          <button class="qty-btn" onclick="changeQty('${attrEsc(item.slug)}','${attrEsc(item.size)}',-1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${attrEsc(item.slug)}','${attrEsc(item.size)}',1)">+</button>
          <button class="cart-item-remove" onclick="removeFromCart('${attrEsc(item.slug)}','${attrEsc(item.size)}')">${t('cart.remove')}</button>
        </div>
      </div>
      <div class="cart-item-price">${(item.price * item.qty).toLocaleString('fr-DZ')} <span style="font-size:10px;color:var(--warm-gray)">DZD</span></div>
    </div>
  `).join('');
  const subtotalEl = document.getElementById('cartSubtotal');
  if (subtotalEl) subtotalEl.textContent = getCartTotal().toLocaleString('fr-DZ') + ' DZD';
}

function addToCartDetail() {
  if (currentProduct && currentProduct.colors && currentProduct.colors.length > 0 && !selectedColor) {
    showCartToast(t('prod.selectcolor'));
    return false;
  }
  addToCart(currentProductSlug, selectedSize, selectedColor, selectedColorHex);
  return true;
}

function orderNow() {
  if (currentProduct && currentProduct.colors && currentProduct.colors.length > 0 && !selectedColor) {
    showCartToast(t('prod.selectcolor'));
    return;
  }
  addToCart(currentProductSlug, selectedSize, selectedColor, selectedColorHex);
  setTimeout(openOrderDrawer, 200);
}

function quickAdd(slug) {
  if (!selectedSize) selectedSize = 'M';
  addToCart(slug, selectedSize, selectedColor, selectedColorHex);
  setTimeout(openCartDrawer, 80);
}

function openCartDrawer() {
  renderCartItems();
  document.getElementById('cartDrawerOverlay').classList.add('open');
  document.getElementById('cartDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCartDrawer() {
  document.getElementById('cartDrawerOverlay').classList.remove('open');
  document.getElementById('cartDrawer').classList.remove('open');
  document.body.style.overflow = '';
}
function cartCheckout() {
  if (cart.length === 0) return;
  closeCartDrawer();
  setTimeout(() => openOrderDrawer(), 350);
}

let toastTimer = null;
function showCartToast(name) {
  const toast = document.getElementById('cartToast');
  if (!toast) return;
  toast.querySelector('.toast-name').textContent = `${name} ${t('cart.added')}`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}


/* assets/js/modules/shop.js */
let currentFilter = 'all';

function filterShop(chip, category) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  currentFilter = category;
  renderShopGrid(category === 'all' ? null : category);
  setTimeout(initReveal, 50);
}

function initFilterArrows() {
  const leftBtn = document.getElementById('filterArrowLeft');
  const rightBtn = document.getElementById('filterArrowRight');
  const container = document.querySelector('.shop-filters');
  if (!leftBtn || !rightBtn || !container) return;

  if (window.innerWidth < 1024) {
    leftBtn.style.display = 'flex';
    rightBtn.style.display = 'flex';
  }

  const scrollBy = container.querySelector('.filter-chip')?.offsetWidth * 3.5 || 200;

  leftBtn.addEventListener('click', () => {
    container.scrollBy({ left: -scrollBy, behavior: 'smooth' });
  });

  rightBtn.addEventListener('click', () => {
    container.scrollBy({ left: scrollBy, behavior: 'smooth' });
  });

  container.addEventListener('scroll', updateArrowVisibility);
  updateArrowVisibility();

  function updateArrowVisibility() {
    if (window.innerWidth >= 1024) return;
    leftBtn.style.opacity = container.scrollLeft <= 4 ? '0.3' : '1';
    rightBtn.style.opacity = container.scrollLeft + container.clientWidth >= container.scrollWidth - 4 ? '0.3' : '1';
  }
}

document.addEventListener('DOMContentLoaded', initFilterArrows);


/* assets/js/modules/order.js */
function normalizePhone(val) {
  const digits = val.replace(/\D/g, '');
  if (digits.startsWith('213')) return '+' + digits;
  if (digits.startsWith('0')) return '+213' + digits.slice(1);
  return '+213' + digits;
}

let currentStep = 1;
const DELIVERY_HOME_FEE = 750;

function getDeliveryType() {
  return document.querySelector('input[name="deliveryType"]:checked')?.value || 'home';
}

function getDeliveryFee() {
  const type = getDeliveryType();
  if (type === 'home') return DELIVERY_HOME_FEE;
  const sel = document.getElementById('orderWilaya');
  const opt = sel.options[sel.selectedIndex];
  return opt?.dataset?.fee ? Number(opt.dataset.fee) : 0;
}

async function loadWilayas() {
  try {
    const res = await fetch(API_BASE + '/api/wilayas');
    if (!res.ok) return;
    const data = await res.json();
    const sel = document.getElementById('orderWilaya');
    sel.innerHTML = '<option value="">' + t('order.selectwilaya') + '</option>' +
      data.map(w => `<option value="${w.name_fr}" data-code="${w.code}" data-fee="${w.delivery_fee_dzd}" data-days-min="${w.estimated_days_min}" data-days-max="${w.estimated_days_max}">${w.code} - ${w.name_fr}</option>`).join('');
    document.getElementById('deliveryEstimate').style.display = 'none';
  } catch (err) { console.error('Failed to load wilayas:', err); }
}

function updateDeliveryEstimate() {
  const sel = document.getElementById('orderWilaya');
  const opt = sel.options[sel.selectedIndex];
  const estEl = document.getElementById('deliveryEstimate');
  const type = getDeliveryType();
  const feeEl = document.getElementById('dt-office-fee');

  if (opt?.value) {
    feeEl.textContent = Number(opt.dataset.fee).toLocaleString('fr-DZ') + ' DZD';
  } else {
    feeEl.textContent = '—';
  }

  if (type === 'home') {
    document.getElementById('estText').innerHTML = t('order.home') + ' · <strong id="estFee">' + DELIVERY_HOME_FEE.toLocaleString('fr-DZ') + '</strong> DZD. Pay on arrival.';
    estEl.style.display = 'flex';
    return;
  }

  if (!opt || !opt.value) {
    estEl.style.display = 'none';
    return;
  }
  const min = opt.dataset.daysMin;
  const max = opt.dataset.daysMax;
  const fee = Number(opt.dataset.fee);
  document.getElementById('estText').innerHTML = t('order.office') + ': <strong>' + min + '–' + max + ' business days</strong> · <strong>' + fee.toLocaleString('fr-DZ') + '</strong> DZD. Pay on arrival.';
  estEl.style.display = 'flex';
}

function openOrderDrawer() {
  loadWilayas();

  const itemsEl = document.getElementById('drawerOrderItems');
  if (itemsEl) {
    itemsEl.innerHTML = cart.map(item => {
      return `
        <div class="drawer-order-item">
          <div class="drawer-order-thumb"><img src="${item.img}" alt="${item.name}" loading="lazy" onload="this.classList.add('loaded')"></div>
          <div class="drawer-order-info">
            <div class="drawer-order-name">${item.name}</div>
            <div class="drawer-order-size">Size ${item.size}${item.color ? '<span style="display:inline-flex;align-items:center;gap:3px;margin-left:4px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;border:1px solid var(--border);background:' + (item.colorHex || '#ccc') + '"></span>' + item.color + '</span>' : ''} · Qty ${item.qty}</div>
          </div>
          <div class="drawer-order-price">${(item.price * item.qty).toLocaleString('fr-DZ')} <span>DZD</span></div>
        </div>
      `;
    }).join('');
  }
  el('drawerTotal').textContent = getCartTotal().toLocaleString('fr-DZ') + ' DZD';
  el('drawerOverlay').classList.add('open');
  el('orderDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
  goToStep(1);
}

function closeOrderDrawer() {
  el('drawerOverlay').classList.remove('open');
  el('orderDrawer').classList.remove('open');
  document.body.style.overflow = '';
}

function goToStep(n) {
  currentStep = n;
  ['formStep1','formStep2','formStep3'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.style.display = i+1===n ? 'block' : 'none';
  });
  ['step1','step2','step3'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active','done');
    if (i+1 === n) el.classList.add('active');
    else if (i+1 < n) el.classList.add('done');
  });
  ['stepLine1','stepLine2'].forEach((id,i) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('done', n > i+1);
  });
}

function nextStep() {
  if (currentStep === 1) {
    const name = el('orderName');
    const phone = el('orderPhone');
    let valid = true;
    if (!name.value.trim()) { name.style.borderColor = 'var(--error)'; valid = false; } else name.style.borderColor = '';
    if (!phone.value.trim() || phone.value.replace(/\D/g,'').length < 9) { phone.style.borderColor = 'var(--error)'; valid = false; } else phone.style.borderColor = '';
    if (!valid) return;
  }
  if (currentStep === 2) {
    const wilaya = el('orderWilaya');
    const commune = el('orderCommune');
    const address = el('orderAddress');
    const isHome = getDeliveryType() === 'home';
    let valid = true;
    if (!wilaya.value) { wilaya.style.borderColor = 'var(--error)'; valid = false; } else wilaya.style.borderColor = '';
    if (isHome && !commune.value.trim()) { commune.style.borderColor = 'var(--error)'; valid = false; } else commune.style.borderColor = '';
    if (isHome && !address.value.trim()) { address.style.borderColor = 'var(--error)'; valid = false; } else address.style.borderColor = '';
    if (!valid) return;
  }
  if (currentStep === 2) {
    const itemsEl = document.getElementById('orderSummaryItems');
    if (itemsEl) {
      itemsEl.innerHTML = cart.map(item => `
        <div class="order-summary-item">
          <span class="order-summary-item-name">${item.name}</span>
          <span class="order-summary-item-size">${item.size}${item.color ? '<span style="display:inline-flex;align-items:center;gap:3px;margin-left:4px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;border:1px solid var(--border);background:' + (item.colorHex || '#ccc') + '"></span>' + item.color + '</span>' : ''}</span>
          <span class="order-summary-item-qty">×${item.qty}</span>
          <span class="order-summary-item-price">${(item.price * item.qty).toLocaleString('fr-DZ')} <span>DZD</span></span>
        </div>
      `).join('');
    }
    const addrEl = document.getElementById('orderSummaryAddress');
    const communeVal = el('orderCommune').value.trim();
    if (addrEl) addrEl.textContent = communeVal ? `${communeVal}, ${el('orderWilaya').value}` : el('orderWilaya').value;
    const deliveryFee = getDeliveryFee();
    const feeEl = document.getElementById('orderSummaryFee');
    if (feeEl) feeEl.textContent = deliveryFee.toLocaleString('fr-DZ') + ' DZD';
    const subtotal = getCartTotal();
    const total = subtotal + deliveryFee;
    el('drawerTotal').textContent = total.toLocaleString('fr-DZ') + ' DZD';
  }
  if (currentStep < 3) goToStep(currentStep + 1);
}

async function submitOrder() {
  const name = el('orderName').value.trim();
  const phone = normalizePhone(el('orderPhone').value);
  const wilaya = el('orderWilaya').value;
  const commune = el('orderCommune').value.trim() || null;
  const address = el('orderAddress').value.trim() || null;
  const notes = el('orderNotes').value.trim();
  const wilayaSel = el('orderWilaya');
  const wilayaOpt = wilayaSel.options[wilayaSel.selectedIndex];
  const wilayaCode = wilayaOpt?.dataset?.code || null;
  const deliveryFee = getDeliveryFee();
  const deliveryType = getDeliveryType();

  const payload = {
    customer: { name, phone },
    delivery: { wilaya, wilaya_code: wilayaCode ? Number(wilayaCode) : null, commune, address, notes: notes || null, type: deliveryType, fee: deliveryFee },
    items: cart.map(item => ({
      slug: item.slug,
      product_id: item.id,
      name: item.name,
      size: item.size,
      color: item.color || null,
      color_hex: item.colorHex || null,
      qty: item.qty,
      price: item.price,
      image_url: item.img || null
    }))
  };

  let orderNumber;

  try {
    const res = await fetch(API_BASE + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Order submission failed');
    }

    const result = await res.json();
    orderNumber = result.order_number;

    closeOrderDrawer();
    document.body.style.overflow = '';
    el('confirmOrderNum').textContent = orderNumber;
    el('confirmationOverlay').classList.add('show');

    cart = [];
    updateCartBadges();
    renderCartItems();
  } catch (err) {
    alert(err.message);
  }
}

function closeConfirmation() {
  el('confirmationOverlay').classList.remove('show');
  navigate('home');
}

function openWhatsApp() {
  window.open('https://wa.me/213XXXXXXXXX?text=' + encodeURIComponent(t('order.wa')), '_blank');
}

function el(id) { return document.getElementById(id); }


/* assets/js/modules/tracking.js */
function normalizePhone(val) {
  const digits = val.replace(/\D/g, '');
  if (digits.startsWith('213')) return '+' + digits;
  if (digits.startsWith('0')) return '+213' + digits.slice(1);
  return '+213' + digits;
}

function renderOrderCard(order) {
  const statusMap = ['confirmed', 'shipped', 'delivered'];
  const statusLabels = [t('track.confirmed'), t('track.shipped'), t('track.delivered')];
  const currentIdx = statusMap.indexOf(order.status);
  const isDelivered = order.status === 'delivered';

  const itemsHtml = (order.items || []).map(item => {
    const p = Object.values(products).find(pr => pr.name === item.product_name);
    return '<div class="tracking-item">'
      + '<div class="tracking-item-thumb"><img src="' + (p ? p.img : 'assets/images/product-1-1.jpg') + '" alt="' + item.product_name + '" loading="lazy" onload="this.classList.add(\'loaded\')"></div>'
      + '<div class="tracking-item-info">'
      + '<div class="tracking-item-name">' + item.product_name + '</div>'
      + '<div class="tracking-item-detail">Size ' + item.size + (item.color ? '<span style="display:inline-flex;align-items:center;gap:3px;margin-left:4px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;border:1px solid var(--border);background:' + (item.color_hex || '#ccc') + '"></span>' + item.color + '</span>' : '') + ' &middot; Qty ' + item.quantity + '</div></div>'
      + '<div class="tracking-item-price">' + (item.unit_price_dzd * item.quantity).toLocaleString('fr-DZ') + ' <span>DZD</span></div>'
      + '</div>';
  }).join('');

  const timelineSteps = [
    { title: t('track.timeline1'), desc: t('track.timeline1d') },
    { title: t('track.timeline2'), desc: t('track.timeline2d') },
    { title: t('track.timeline3'), desc: t('track.timeline3d') }
  ];

  const timelineHtml = timelineSteps.map((step, i) => {
    const isDone = i < currentIdx || (i === currentIdx && isDelivered);
    const isCurrent = i === currentIdx && !isDelivered;
    var cls = isDone ? 'done' : isCurrent ? 'current' : 'pending';
    var icon = isDone
      ? '<polyline points="20 6 9 17 4 12"/>'
      : isCurrent
          ? '<path d="M5 12h14M12 5l7 7-7 7"/>'
          : '<circle cx="12" cy="12" r="10"/>';
    return '<div class="timeline-step ' + cls + '">'
      + '<div class="timeline-dot"><svg viewBox="0 0 24 24" fill="none" stroke-width="2">' + icon + '</svg></div>'
      + '<div><div class="timeline-step-title">' + step.title + '</div>'
      + '<div class="timeline-step-desc">' + (isDone || isCurrent ? step.desc : t('track.awaiting')) + '</div></div></div>';
  }).join('');

  return '<div class="tracking-order-card">'
    + '<div class="tracking-order-top">'
    + '<div class="tracking-order-num">' + order.order_number + '</div>'
    + '<div class="tracking-status-pill ' + order.status + '">' + (statusLabels[currentIdx] || order.status) + '</div></div>'
    + '<div class="tracking-items">' + itemsHtml + '</div>'
    + '<div class="tracking-total">' + t('track.total') + ' <strong>' + (order.total_dzd || 0).toLocaleString('fr-DZ') + ' DZD</strong></div>'
    + '<div class="tracking-delivery-to"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
    + (order.delivery_wilaya || '') + (order.delivery_commune ? ', ' + order.delivery_commune : '') + '</div>'
    + '<div class="tracking-timeline">' + timelineHtml + '</div></div>';
}

function showError(msg) {
  document.getElementById('trackingResult').innerHTML = '<div class="tracking-not-found"><div class="tracking-not-found-title">Error</div><div class="tracking-not-found-desc">' + msg + '</div></div>';
  document.getElementById('trackingResult').classList.add('show');
}

function showNotFound(title, msg) {
  document.getElementById('trackingResult').innerHTML = '<div class="tracking-not-found"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="8" y1="8" x2="14" y2="14"/><line x1="14" y1="8" x2="8" y2="14"/></svg><div class="tracking-not-found-title">' + title + '</div><div class="tracking-not-found-desc">' + msg + '</div></div>';
  document.getElementById('trackingResult').classList.add('show');
}

async function trackOrder() {
  var input = document.getElementById('trackingInput');
  var val = input.value.trim().toUpperCase();
  if (!val) { input.style.borderColor = 'var(--error)'; return; }
  input.style.borderColor = '';

  try {
    var res = await fetch(API_BASE + '/api/orders/' + encodeURIComponent(val));
    if (res.status === 404) { showNotFound(t('track.notfound'), t('track.notfound-d')); return; }
    if (!res.ok) throw new Error('Failed');
    var order = await res.json();
    document.getElementById('trackingResult').innerHTML = renderOrderCard(order);
    document.getElementById('trackingResult').classList.add('show');
  } catch (err) {
    showError(t('track.error-d'));
  }
}

async function trackByPhone() {
  var input = document.getElementById('trackingPhoneInput');
  var raw = input.value.trim();
  if (!raw || raw.replace(/\D/g,'').length < 9) { input.style.borderColor = 'var(--error)'; return; }
  input.style.borderColor = '';
  var phone = normalizePhone(raw);

  try {
    var res = await fetch(API_BASE + '/api/orders/by-phone?phone=' + encodeURIComponent(phone));
    if (res.status === 404) { showNotFound(t('track.nophones'), t('track.nophones-d')); return; }
    if (!res.ok) throw new Error('Failed');
    var orders = await res.json();
    if (!orders || orders.length === 0) { showNotFound(t('track.nophones'), t('track.nophones-d')); return; }
    document.getElementById('trackingResult').innerHTML = orders.map(function(o) { return renderOrderCard(o); }).join('');
    document.getElementById('trackingResult').classList.add('show');
  } catch (err) {
    showError(t('track.error-d'));
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var tabs = document.querySelectorAll('.tracking-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function() {
      var mode = this.getAttribute('data-tab');
      var allTabs = document.querySelectorAll('.tracking-tab');
      for (var j = 0; j < allTabs.length; j++) allTabs[j].classList.remove('active');
      this.classList.add('active');
      document.getElementById('tracking-input-order').style.display = mode === 'order' ? 'flex' : 'none';
      document.getElementById('tracking-input-phone').style.display = mode === 'phone' ? 'flex' : 'none';
      document.getElementById('trackingResult').classList.remove('show');
    });
  }

  var orderInput = document.getElementById('trackingInput');
  if (orderInput) {
    orderInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') trackOrder(); });
  }
  var phoneInput = document.getElementById('trackingPhoneInput');
  if (phoneInput) {
    phoneInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') trackByPhone(); });
  }

  var orderBtn = document.getElementById('track-btn-order');
  if (orderBtn) orderBtn.addEventListener('click', trackOrder);
  var phoneBtn = document.getElementById('track-btn-phone');
  if (phoneBtn) phoneBtn.addEventListener('click', trackByPhone);
});


/* assets/js/modules/navigation.js */
function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    document.querySelectorAll('.bottom-nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.getElementById('nav-' + page);
    if (navItem) navItem.classList.add('active');
    const stickyBar = document.getElementById('stickyBar');
    if (page === 'product') {
      setTimeout(() => stickyBar && stickyBar.classList.add('visible'), 700);
    } else {
      if (stickyBar) stickyBar.classList.remove('visible');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(initReveal, 60);
}

function initReveal() {
    const els = document.querySelectorAll('.page.active .reveal');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
}

window.addEventListener('scroll', () => {
    const nav = document.getElementById('topNav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 10);
});

function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? '' : 'dark');
    localStorage.setItem('lorenzo_theme', isDark ? 'light' : 'dark');
}

function initTheme() {
    const saved = localStorage.getItem('lorenzo_theme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

document.addEventListener('DOMContentLoaded', initTheme);


/* assets/js/modules/product.js */
let currentProduct = null;
let currentProductSlug = '';
let selectedSize = 'S';
let selectedColor = null;
let selectedColorHex = '';

function openProduct(slug) {
  currentProductSlug = slug;
  currentProduct = products[slug] || productsList[0];
  if (!currentProduct) return;

  document.getElementById('detailCategory').textContent = currentProduct.category;
  document.getElementById('detailName').innerHTML = currentProduct.displayName.replace(/(\S+)\s*$/, '<em>$1</em>');

  const unavailableEl = document.getElementById('detailUnavailable');
  const detailPriceEl = document.getElementById('detailPrice');
  const colorLabelRow = document.querySelector('#page-product .color-label-row');
  const colorSwatches = document.getElementById('colorSwatches');
  const sizeLabelRow = document.querySelector('#page-product .size-label-row');
  const sizeGrid = document.getElementById('sizeGrid');
  const addToCartBtn = document.querySelector('.detail-add-cart-btn');
  const stickySizeSelect = document.getElementById('stickySizeSelect');
  const stickyOrderBtn = document.getElementById('stickyOrderBtnDirect');

  if (!currentProduct.isActive) {
    unavailableEl.style.display = 'block';
    unavailableEl.textContent = t('detail.unavailable');
    detailPriceEl.innerHTML = '';
    document.getElementById('detailCartPrice').innerHTML = '';
    colorLabelRow.style.display = 'none';
    colorSwatches.style.display = 'none';
    sizeLabelRow.style.display = 'none';
    sizeGrid.style.display = 'none';
    addToCartBtn.style.display = 'none';
    stickySizeSelect.style.display = 'none';
    stickyOrderBtn.textContent = t('detail.unavailable');
    stickyOrderBtn.disabled = true;
  } else {
    unavailableEl.style.display = 'none';
    colorLabelRow.style.display = '';
    colorSwatches.style.display = '';
    sizeLabelRow.style.display = '';
    sizeGrid.style.display = '';
    addToCartBtn.style.display = '';
    stickySizeSelect.style.display = '';
    stickyOrderBtn.disabled = false;
    if (currentProduct.promotion) {
      const endDateStr = currentProduct.promotion.end_date
        ? '<span class="promo-end"> \u00b7 Sale ends ' + new Date(currentProduct.promotion.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '</span>'
        : '';
      detailPriceEl.innerHTML = '<span class="price-original">' + currentProduct.price.toLocaleString('fr-DZ') + '</span> <span class="price-sale">' + currentProduct.discountedPrice.toLocaleString('fr-DZ') + ' <span>DZD</span></span>' + endDateStr;
      document.getElementById('detailCartPrice').innerHTML = '<span class="price-original">' + currentProduct.price.toLocaleString('fr-DZ') + '</span> ' + currentProduct.discountedPrice.toLocaleString('fr-DZ') + ' DZD';
    } else {
      detailPriceEl.innerHTML = currentProduct.price.toLocaleString('fr-DZ') + ' <span>DZD</span>';
      document.getElementById('detailCartPrice').textContent = currentProduct.price.toLocaleString('fr-DZ') + ' DZD';
    }
    stickyOrderBtn.textContent = t('sticky.ordernow') + ' \u2014 ' + (currentProduct.promotion ? currentProduct.discountedPrice : currentProduct.price).toLocaleString('fr-DZ') + ' DZD';
  }
  document.getElementById('detailDesc').textContent = currentProduct.desc;

  const allImages = currentProduct.allImages || [currentProduct.img];

  const mainImg = document.getElementById('galleryMainImg');
  mainImg.style.opacity = '0';
  mainImg.src = allImages[0];
  mainImg.alt = currentProduct.name;

  const thumbsEl = document.getElementById('galleryThumbs');
  thumbsEl.innerHTML = allImages.map((url, i) => `
    <div class="gallery-thumb ${i===0?'active':''}" onclick="switchGalleryImg(this,'${attrEsc(url)}',${i+1})">
      <img src="${url}" alt="${currentProduct.name}" loading="lazy" onload="this.classList.add('loaded')">
    </div>`).join('');
  document.getElementById('galleryCounter').textContent = '1 / ' + allImages.length;

  renderSizeGrid();
  renderStickySizes();
  selectedColor = null;
  renderColorSwatches([]);

  fetch(API_BASE + '/api/products/' + slug).then(r => r.json()).then(detail => {
    if (currentProductSlug !== slug) return;
    if (detail) {
      if (detail.is_active !== undefined && detail.is_active !== currentProduct.isActive) {
        currentProduct.isActive = detail.is_active;
        if (!currentProduct.isActive) {
          unavailableEl.style.display = 'block';
          unavailableEl.textContent = t('detail.unavailable');
          detailPriceEl.innerHTML = '';
          document.getElementById('detailCartPrice').innerHTML = '';
          colorLabelRow.style.display = 'none';
          colorSwatches.style.display = 'none';
          sizeLabelRow.style.display = 'none';
          sizeGrid.style.display = 'none';
          addToCartBtn.style.display = 'none';
          stickySizeSelect.style.display = 'none';
          stickyOrderBtn.textContent = t('detail.unavailable');
          stickyOrderBtn.disabled = true;
          return;
        }
      }
      if (detail.is_active === false) return;
      if (detail.unavailable_sizes) currentProduct.unavailableSizes = detail.unavailable_sizes;
      if (detail.promotion) currentProduct.promotion = detail.promotion;
      renderSizeGrid();
      renderStickySizes();
      if (currentProduct.promotion) {
        const endDateStr = currentProduct.promotion.end_date
          ? '<span class="promo-end"> \u00b7 Sale ends ' + new Date(currentProduct.promotion.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '</span>'
          : '';
        document.getElementById('detailPrice').innerHTML = '<span class="price-original">' + currentProduct.price.toLocaleString('fr-DZ') + '</span> <span class="price-sale">' + currentProduct.discountedPrice.toLocaleString('fr-DZ') + ' <span>DZD</span></span>' + endDateStr;
        document.getElementById('detailCartPrice').innerHTML = '<span class="price-original">' + currentProduct.price.toLocaleString('fr-DZ') + '</span> ' + currentProduct.discountedPrice.toLocaleString('fr-DZ') + ' DZD';
        document.getElementById('stickyOrderBtnDirect').textContent = t('sticky.ordernow') + ' \u2014 ' + currentProduct.discountedPrice.toLocaleString('fr-DZ') + ' DZD';
      }
      if (detail.images && detail.images.length > 0) {
        const detailImages = detail.images.map(img => ({ url: imgUrl(img.storage_path), colorId: img.color_id || null }));
        currentProduct._rawImages = detail.images;
        currentProduct.allImages = detailImages.map(i => i.url);
        currentProduct.colors = (detail.colors || []).map(c => ({
          id: c.id || null,
          name: c.color_name || '',
          hex: c.color_hex || ''
        }));
        function renderGallery(images) {
          const thumbsEl2 = document.getElementById('galleryThumbs');
          thumbsEl2.innerHTML = images.map((img, i) => {
            const url = img.url || img;
            const cid = img.colorId || '';
            return `<div class="gallery-thumb ${i===0?'active':''}" onclick="switchGalleryImg(this,'${attrEsc(url)}',${i+1},'${attrEsc(cid)}')">
              <img src="${url}" alt="${currentProduct.name}" loading="lazy" onload="this.classList.add('loaded')">
            </div>`;
          }).join('');
          const mainImg2 = document.getElementById('galleryMainImg');
          mainImg2.src = (images[0]?.url || images[0]) || detailImages[0].url;
          document.getElementById('galleryCounter').textContent = '1 / ' + images.length;
        }
        renderGallery(detailImages);
        const hasColorImages = detailImages.some(i => i.colorId);
        currentProduct._colorImages = hasColorImages ? detailImages : null;
        renderColorSwatches(currentProduct.colors);
      }
    }
  }).catch(() => {});

  navigate('product');
}

function renderSizeGrid() {
  const available = currentProduct.sizes || [];
  const unavailableSizes = currentProduct.unavailableSizes || [];
  const allSizes = ['XS', 'S', 'M', 'L', 'XL'];
  const grid = document.getElementById('sizeGrid');
  grid.innerHTML = allSizes.map(s => {
    const isAvail = available.includes(s) && !unavailableSizes.includes(s);
    const isActive = s === 'S' && isAvail;
    const lowStock = isAvail && s === 'M';
    return `<button class="size-btn${isActive ? ' active' : ''}${!isAvail ? ' out-of-stock' : ''}" onclick="selectSize(this)"${!isAvail ? '' : ''}>${s}${lowStock ? ' <span class="size-low"></span>' : ''}</button>`;
  }).join('');
  selectedSize = available.includes('S') && !unavailableSizes.includes('S') ? 'S' : (available.filter(s => !unavailableSizes.includes(s))[0] || 'M');
}

function renderStickySizes() {
  const available = currentProduct.sizes || [];
  const unavailableSizes = currentProduct.unavailableSizes || [];
  const allSizes = ['XS', 'S', 'M', 'L', 'XL'];
  const select = document.getElementById('stickySizeSelect');
  select.innerHTML = allSizes.filter(s => available.includes(s) && !unavailableSizes.includes(s)).map(s =>
    `<option value="${s}"${s === selectedSize ? ' selected' : ''}>${s}</option>`
  ).join('');
  if (select.options.length === 0) {
    select.innerHTML = '<option value="N/A">N/A</option>';
  }
  select.value = selectedSize;
}

function switchGalleryImg(thumb, url, idx, colorId) {
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
  const mainImg = document.getElementById('galleryMainImg');
  mainImg.style.opacity = '0';
  setTimeout(() => { mainImg.src = url; mainImg.style.opacity = '1'; }, 200);
  const total = document.querySelectorAll('#galleryThumbs .gallery-thumb').length;
  document.getElementById('galleryCounter').textContent = idx + ' / ' + total;
  if (colorId && currentProduct && currentProduct.colors) {
    const match = currentProduct.colors.find(c => String(c.id) === String(colorId));
    if (match && match.name) {
      selectedColor = match.name;
      selectedColorHex = match.hex;
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      const swatch = Array.from(document.querySelectorAll('.color-swatch')).find(s => s.title === match.name);
      if (swatch) swatch.classList.add('active');
      const label = document.getElementById('colorSelected');
      if (label) label.textContent = match.name;
    }
  }
}

function selectSize(btn) {
  if (btn.classList.contains('out-of-stock')) return;
  document.querySelectorAll('#sizeGrid .size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedSize = btn.textContent.trim().replace(/\s+/g,'').slice(0,2);
  const stickySelect = document.getElementById('stickySizeSelect');
  if (stickySelect) stickySelect.value = selectedSize;
}

function toggleAccordion(header) {
  const item = header.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

function renderColorSwatches(colors) {
  const container = document.getElementById('colorSwatches');
  const selectedLabel = document.getElementById('colorSelected');
  if (!container) return;
  const withColor = colors.filter(c => c.name && c.hex);
  if (withColor.length === 0) {
    container.innerHTML = '';
    if (selectedLabel) selectedLabel.textContent = '';
    selectedColor = null;
    return;
  }
  selectedColor = null;
  selectedColorHex = '';
  container.innerHTML = withColor.map(c =>
    `<div class="color-swatch" style="background:${c.hex}" title="${c.name}" onclick="selectColor('${c.name.replace(/'/g, "\\'")}','${c.hex}','${c.id || ''}')"></div>`
  ).join('');
  if (selectedLabel) selectedLabel.textContent = t('prod.selectcolor');
}

function selectColor(name, hex, colorId) {
  selectedColor = name;
  selectedColorHex = hex;
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  event.target.classList.add('active');
  const label = document.getElementById('colorSelected');
  if (label) label.textContent = name;
  if (currentProduct && currentProduct._colorImages) {
    filterGalleryByColor(colorId || null);
  }
}

function filterGalleryByColor(colorId) {
  if (!currentProduct || !currentProduct._colorImages) return;
  const filtered = colorId
    ? currentProduct._colorImages.filter(i => String(i.colorId) === String(colorId))
    : currentProduct._colorImages;
  const images = filtered.length > 0 ? filtered : currentProduct._colorImages;
  const thumbsEl = document.getElementById('galleryThumbs');
  thumbsEl.innerHTML = images.map((img, i) => {
    const cid = img.colorId || '';
    return `<div class="gallery-thumb ${i===0?'active':''}" onclick="switchGalleryImg(this,'${attrEsc(img.url)}',${i+1},'${attrEsc(cid)}')">
      <img src="${img.url}" alt="${currentProduct.name}" loading="lazy" onload="this.classList.add('loaded')">
    </div>`;
  }).join('');
  const mainImg = document.getElementById('galleryMainImg');
  mainImg.src = images[0].url;
  mainImg.style.opacity = '1';
  document.getElementById('galleryCounter').textContent = '1 / ' + images.length;
}

function openSizeGuide() {
  document.getElementById('sizeGuideModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSizeGuide() {
  document.getElementById('sizeGuideModal').classList.remove('open');
  document.body.style.overflow = '';
}


/* assets/js/modules/sliders.js */
function initSliders() {
    const slider = document.getElementById('bestSellersSlider');
    const track = slider && slider.querySelector('.slider-track');

    if (slider && track) {
      let isDown = false, startX, scrollLeft;
      slider.addEventListener('mousedown', e => {
        isDown = true; slider.classList.add('grabbing');
        startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft;
      });
      slider.addEventListener('mouseleave', () => { isDown = false; slider.classList.remove('grabbing'); });
      slider.addEventListener('mouseup', () => { isDown = false; slider.classList.remove('grabbing'); });
      slider.addEventListener('mousemove', e => {
        if (!isDown) return; e.preventDefault();
        slider.scrollLeft = scrollLeft - (e.pageX - slider.offsetLeft - startX) * 1.5;
      });
      let touchStart = 0;
      slider.addEventListener('touchstart', e => { touchStart = e.touches[0].clientX; scrollLeft = slider.scrollLeft; }, { passive: true });
      slider.addEventListener('touchmove', e => {
        const diff = touchStart - e.touches[0].clientX;
        slider.scrollLeft = scrollLeft + diff;
      }, { passive: true });

      document.getElementById('sliderPrev').addEventListener('click', () => {
        const card = track.querySelector('.product-card');
        if (card) slider.scrollBy({ left: -card.offsetWidth - 12, behavior: 'smooth' });
      });
      document.getElementById('sliderNext').addEventListener('click', () => {
        const card = track.querySelector('.product-card');
        if (card) slider.scrollBy({ left: card.offsetWidth + 12, behavior: 'smooth' });
      });
    }
}


/* assets/js/modules/contact.js */
async function submitContact(e) {
  e.preventDefault();
  const name = document.getElementById('contactName').value.trim();
  const phone = document.getElementById('contactPhone').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const message = document.getElementById('contactMessage').value.trim();
  const status = document.getElementById('contactStatus');

  if (!name || !phone || !message) {
    status.textContent = t('contact.fill');
    status.style.color = 'var(--error)';
    return false;
  }

  try {
    const res = await fetch(API_BASE + '/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email: email || undefined, message })
    });

    if (!res.ok) throw new Error('Failed to send message');

    status.textContent = t('contact.sent');
    status.style.color = '#2E7D32';
    document.getElementById('contactForm').reset();
  } catch (err) {
    status.textContent = t('contact.error');
    status.style.color = 'var(--error)';
  }

  return false;
}


/* assets/js/main.js */
function el(id) { return document.getElementById(id); }

document.addEventListener('DOMContentLoaded', async () => {
  setLanguage(currentLang);
  initTicker();
  initReveal();

  await loadProducts();

  initSliders();

  renderCartItems();
  el('ordersTickerText') && setInterval(cycleTicker, 4000);

  initMobileVideo();

  // Update sticky bar text on language switch
  document.addEventListener('langchange', () => {
    const btn = document.getElementById('stickyOrderBtnDirect');
    if (btn && btn.textContent.includes('\u2014')) {
      // Extract price part and rebuild with translated prefix
      const parts = btn.textContent.split('\u2014');
      if (parts.length > 1) {
        btn.textContent = t('sticky.ordernow') + ' \u2014' + parts.slice(1).join('\u2014');
      }
    }
  });
});

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  if (!item) return;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

function initMobileVideo() {
  if (window.innerWidth > 768) return;
  const video = document.getElementById('heroBgVideo');
  const img = document.getElementById('heroBgImg');
  if (!video || !img) return;
  img.style.display = 'none';
  video.setAttribute('autoplay', '');
  const source = document.createElement('source');
  source.src = 'assets/videos/hero-bg.mp4';
  source.type = 'video/mp4';
  video.appendChild(source);
  video.load();
  video.play().catch(() => {});
}


