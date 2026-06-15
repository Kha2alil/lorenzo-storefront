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
    const hours = Math.floor(m / 60);
    const days = Math.floor(hours / 24);
    const mins = m < 60
      ? t('ticker.min').replace('{n}', m)
      : m < 120
        ? t('ticker.hour').replace('{n}', hours)
        : days < 1
          ? t('ticker.hours').replace('{n}', hours)
          : days < 2
            ? t('ticker.day').replace('{n}', days)
            : t('ticker.days').replace('{n}', days);
    el.innerHTML = t('ticker.order').replace('{name}', d.name).replace('{city}', d.city).replace('{product}', d.product).replace('{mins}', mins);
    el.style.opacity = '1';
  }, 300);
  tickerIndex++;
}
