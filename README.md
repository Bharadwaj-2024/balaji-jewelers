# 🪙 Balaji Jewellers — Full-Stack eCommerce

> **"Crafted with Devotion, Worn with Pride"**

A production-ready luxury gold jewellery eCommerce platform built with Next.js 14, Express.js, and MySQL.

---

## 🗂️ Project Structure

```
balaji-jewellers/
├── frontend/        # Next.js 14 App Router
├── backend/         # Express.js REST API
├── database/        # MySQL schema + seed data
└── README.md
```

---

## ✅ Features

| Feature | Status |
|---|---|
| Responsive luxury UI (Playfair Display + Jost) | ✅ |
| Hero carousel (3 slides, auto-rotate) | ✅ |
| Live gold rate ticker (22K, 18K, 14K) | ✅ |
| Category grid (Rings, Necklaces, Earrings, Bangles, Pendants, Chains) | ✅ |
| Product listing with filters + sort + pagination | ✅ |
| Product detail with image gallery, price breakdown | ✅ |
| Dynamic price = gold weight × live rate + making charges | ✅ |
| WhatsApp Order button (pre-filled message) | ✅ |
| Add to Cart / Buy Now / Wishlist | ✅ |
| Ring size selector | ✅ |
| Cart with quantity control | ✅ |
| Checkout with address management + coupon code | ✅ |
| Order tracking with stepper | ✅ |
| Wishlist (localStorage persistent) | ✅ |
| JWT auth (httpOnly cookie + localStorage) | ✅ |
| Admin dashboard: Overview, Products, Orders, Gold Rates, Users | ✅ |
| Live gold rate update (admin) with 1-hour cache | ✅ |
| Reviews system (rating + comment) | ✅ |
| BIS Hallmark trust badges section | ✅ |
| SEO metadata + OG tags | ✅ |
| Skeleton loaders | ✅ |
| Framer Motion page animations | ✅ |
| Coupon system | ✅ |
| bcrypt password hashing (salt 12) | ✅ |
| Rate limiting (express-rate-limit) | ✅ |
| MySQL prepared statements | ✅ |
| Cloudinary image upload | ✅ |

---

## 🚀 Setup — Step by Step

### 1. Prerequisites

- Node.js ≥ 18
- MySQL 8+
- Cloudinary account (free)

---

### 2. Database

```bash
# Create DB and run schema
mysql -u root -p < database/schema.sql
```

This creates all tables and inserts seed data including:
- 6 categories
- 12 sample products  
- Admin user: `admin@balajijewellers.com` / `Admin@123`
- 3 sample coupons: `BALAJI10`, `WELCOME500`, `WEDDING15`
- Initial gold rates (22K: ₹6820, 18K: ₹5580, 14K: ₹4300)

---

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

**Required `.env` values:**
```
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=balaji_jewellers
JWT_SECRET=your_32_char_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
```

API runs at: `http://localhost:5000`

---

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local
npm run dev
```

**Required `.env.local` values:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210
```

Frontend runs at: `http://localhost:3000`

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| POST | `/api/auth/logout` | — |
| GET | `/api/auth/me` | 🔒 |
| PUT | `/api/auth/update-profile` | 🔒 |
| PUT | `/api/auth/change-password` | 🔒 |

### Products
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/products?category=1&purity=22k&search=ring&sort=price&order=ASC&page=1&limit=12` | — |
| GET | `/api/products/:id` | — |
| POST | `/api/products` | 🔑 Admin |
| PUT | `/api/products/:id` | 🔑 Admin |
| DELETE | `/api/products/:id` | 🔑 Admin |
| POST | `/api/products/:id/images` | 🔑 Admin |

### Cart
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/cart` | 🔒 |
| POST | `/api/cart/add` | 🔒 |
| PUT | `/api/cart/update/:id` | 🔒 |
| DELETE | `/api/cart/remove/:id` | 🔒 |

### Orders
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/orders` | 🔒 |
| GET | `/api/orders` | 🔒 |
| GET | `/api/orders/:id` | 🔒 |
| PUT | `/api/orders/:id/status` | 🔑 Admin |
| GET | `/api/admin/orders` | 🔑 Admin |

### Gold Rates
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/gold-rates` | — |
| PUT | `/api/gold-rates` | 🔑 Admin |

---

## 🏗️ Production Deployment

### Backend (AWS EC2)
```bash
npm install -g pm2
pm2 start server.js --name balaji-api
pm2 save && pm2 startup
```

### Frontend (Vercel — recommended)
```bash
cd frontend
vercel deploy
```
Add your env vars in Vercel dashboard.

### Database (AWS RDS)
- Engine: MySQL 8.0
- Update `DB_HOST` in backend `.env` to RDS endpoint

### Images (Cloudinary — already integrated)
- Upload images through Admin dashboard → Products → Upload Images

---

## 🎨 Brand Colors

| Name | Hex |
|------|-----|
| Royal Gold | `#C9A84C` |
| Deep Black | `#0A0A0A` |
| Ivory White | `#FAF7F2` |
| Soft Champagne | `#F5E6C8` |

---

## 🔐 Security

- Passwords: bcrypt (12 salt rounds)
- JWT: httpOnly cookies + Authorization header
- Rate limiting: 200 req/15min general, 20 req/15min for auth
- Admin routes: role middleware protected
- SQL: prepared statements (mysql2)
- CORS: configured for specific origin

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| State | Zustand / React Context |
| Backend | Node.js, Express.js |
| Database | MySQL 8 (mysql2) |
| Auth | JWT (jsonwebtoken + bcrypt) |
| Images | Cloudinary |
| Deployment | Vercel (FE) + AWS EC2/RDS (BE) |

---

## 💚 WhatsApp Integration

The WhatsApp Order button generates a pre-filled message:
```
Hi, I'm interested in [Product Name] (SKU: BJ0001) 
priced at ₹35,480 from Balaji Jewellers.
```

Update your WhatsApp number in:
- Backend `.env`: `WHATSAPP_NUMBER=919876543210`
- Frontend `.env.local`: `NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210`

---

*Built with ❤️ for Balaji Jewellers*
