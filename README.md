# Balaji Jewellers

Luxury gold jewellery eCommerce application built with Next.js 14, Express.js, and MySQL.

The website is designed around the Balaji Jewellers brand experience: a gold-themed storefront, product browsing, cart and checkout flows, customer authentication, wishlist support, and an admin area for managing products, orders, categories, coupons, and gold rates.

## What The Application Includes

### Storefront

- Animated hero banner on the home page
- Balaji Promise trust section
- Category browsing grid
- New arrivals and featured products
- Occasion-based shopping cards
- Signature atelier section
- Purity spotlight section
- Interactive Style Matchmaker concierge for personalized style discovery
- Gold budget planner using live rate data
- Customer reviews and trust badges

### Shopping Flow

- Product listing with filters and search
- Product detail page with pricing and purchase actions
- Add to cart, buy now, and wishlist support
- Cart quantity management
- Checkout with saved addresses and coupon validation
- Order placement and order history

### Account And Admin

- Login and registration
- User session persistence through local storage and auth APIs
- Admin dashboard for managing the catalogue and commerce data
- Gold rate management
- Coupon management

## Tech Stack

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS, Framer Motion
- Backend: Node.js, Express.js, MySQL, JWT, bcrypt
- Media: Cloudinary
- State and API: React Context, SWR, Axios, Zustand

## Project Structure

```text
balaji-jewellers/
├── frontend/        # Next.js app router frontend
├── backend/         # Express REST API
├── database/        # MySQL schema
└── README.md
```

## Local Setup

### 1. Prerequisites

- Node.js 18 or newer
- MySQL 8+
- Cloudinary account

### 2. Database

Import the schema into MySQL:

```bash
mysql -u root -p < database/schema.sql
```

### 3. Backend

```bash
cd backend
npm install
npm run dev
```

Create a `backend/.env` file with values like:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=balaji_jewellers
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Create a `frontend/.env.local` file with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210
```

## Main Routes

- `/` home page
- `/products` product catalogue
- `/product/[id]` product details
- `/cart` cart
- `/checkout` checkout
- `/auth` login and registration
- `/orders` order history
- `/wishlist` wishlist
- `/admin` admin dashboard

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Products

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Cart And Orders

- `GET /api/cart`
- `POST /api/cart/add`
- `PUT /api/cart/update/:id`
- `DELETE /api/cart/remove/:id`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`

### Supporting Data

- `GET /api/categories`
- `GET /api/gold-rates`
- `GET /api/coupons`

## Home Page Sections

The current home page is composed of these parts:

- Hero banner
- Balaji Promise section
- Category browser
- New arrivals
- Occasion cards
- Signature atelier
- Purity spotlight
- Style Matchmaker (occasion + purity + budget based recommendations)
- Budget planner
- Featured pieces
- Trust badges
- Customer reviews

## New Feature Highlight: Style Matchmaker

The home page now includes a high-engagement interactive concierge section called Style Matchmaker.

- Shoppers select Occasion, Purity, and Budget using quick filter pills
- The section reveals curated jewellery style directions with motion transitions
- Each match includes a direct call-to-action that links to pre-filtered product listings
- The feature is designed to improve discovery and keep visitors engaged longer on the home page

## Verification

The frontend builds successfully, and the backend starts successfully with the available MySQL configuration.

## Brand Palette

- Royal Gold: `#C9A84C`
- Deep Black: `#0A0A0A`
- Ivory: `#FAF7F2`
- Champagne: `#F5E6C8`

## Notes

- The site is optimized for a luxury jewellery shopping experience.
- WhatsApp and checkout flows rely on the configured API and environment variables.
- If you deploy to production, update `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, and your database credentials accordingly.
