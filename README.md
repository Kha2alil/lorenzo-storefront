# LORENZO — Customer Storefront

Frontend e-commerce storefront for **LORENZO Italian Menswear**. Built with vanilla HTML, CSS, and JavaScript — no framework required.

## Features

- Product catalog with category filters
- Product detail with color swatches and size selector
- Shopping cart drawer
- Order placement (3-step wizard: contact, delivery, confirm)
- Order tracking by order number or phone
- Live order ticker
- Multi-language support (English, French, Arabic)
- Light/dark theme toggle
- Fully responsive design
- WhatsApp / Instagram / TikTok integration

## Quick Start

Since this is a static site, you can serve it with any HTTP server:

```bash
# Using Python
python -m http.server 5500

# Using Node
npx serve .
```

Then open `http://localhost:5500`.

## Environment Variables

The storefront reads the API base URL from `window.API_BASE` set in `index.html`:

```html
<script>window.API_BASE = window.API_BASE || 'https://your-api.azurewebsites.net';</script>
```

To override it (e.g., for local development), set it before loading the page:

```js
localStorage.setItem('API_BASE', 'http://localhost:3001')
```

Or use browser dev tools: `window.API_BASE = 'http://localhost:3001'`

## API

This storefront communicates with the **LORENZO REST API** at the following endpoints:

| Endpoint | Description |
|---|---|
| `GET /api/products` | List products |
| `GET /api/products/:slug` | Product detail |
| `GET /api/products/categories` | List categories |
| `GET /api/products/top` | Top selling products |
| `GET /api/products/image/*` | Product image |
| `GET /api/wilayas` | Delivery regions and fees |
| `POST /api/orders` | Place an order |
| `GET /api/orders/:orderNumber` | Track an order |
| `GET /api/orders/by-phone` | Lookup orders by phone |
| `GET /api/orders/recent` | Recent orders (ticker) |
| `POST /api/contact` | Submit contact form |

## Deployment

### Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New → Project**
3. Import the GitHub repository
4. No build command needed (static HTML)
5. Click **Deploy**

### Deploy to Netlify

1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add New Site → Import from Git**
3. Publish directory: `.` (root)
4. No build command needed

## Structure

```
├── index.html              # Main SPA entry point
├── assets/
│   ├── css/
│   │   ├── base/           # Variables, reset, layout, animations
│   │   ├── components/     # Buttons, cart, contact, hero, nav, etc.
│   │   └── rtl.css         # Right-to-left (Arabic) styles
│   ├── js/
│   │   ├── i18n.js         # Multi-language (EN/FR/AR)
│   │   ├── main.js         # Entry point
│   │   ├── data/
│   │   │   └── products.js # Product loading and rendering
│   │   └── modules/        # Cart, shop, order, ticker, tracking, etc.
│   ├── images/             # Product and hero images
│   └── videos/             # Hero background video
```

## Tech Stack

- **HTML5** — Semantic markup
- **CSS3** — Custom properties, flexbox, grid, animations
- **Vanilla JavaScript** — No frameworks, no build tools
- **Fonts** — Cormorant Garamond, Jost, Playfair Display (Google Fonts)
