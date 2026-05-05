# 👑 Balaji Jewellers

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?style=flat&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat&logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Backend-lightgrey?style=flat&logo=express)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue?style=flat&logo=mysql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)

A premium, luxury gold jewellery eCommerce web application designed to deliver an exquisite shopping experience. Built with a modern tech stack including **Next.js 14**, **Express.js**, and **MySQL**, the platform is crafted to reflect the elegant Balaji Jewellers brand.

---

## ✨ Key Features

### 🏪 Storefront & User Experience
- **Immersive Hero Section:** Animated hero banner welcoming users to the storefront.
- **Balaji Promise:** Trust badges and guarantees prominent on the home page.
- **Dynamic Browsing:** Category grid, new arrivals, featured products, and occasion-based shopping cards.
- **Purity Spotlight & Atelier:** Signature sections highlighting craftsmanship and gold purity.
- **Interactive Style Matchmaker:** A personalized concierge feature that recommends styles based on Occasion, Purity, and Budget using quick filter pills and smooth motion transitions.
- **Gold Budget Planner:** Real-time budget calculator using live gold rate data.
- **Customer Reviews:** Trust-building testimonials and ratings.

### 🛍️ Shopping Flow
- **Product Discovery:** Advanced product listing with search, filtering, and native `<img>` rendering for robust external URL image loading without artifacts.
- **Detailed Product Pages:** Comprehensive item details, live pricing, and direct purchase actions.
- **Cart & Wishlist:** Seamless "Add to Cart", "Buy Now", and Wishlist functionalities.
- **Checkout:** Streamlined checkout process with saved addresses, coupon validation, and invoice generation.
- **Order Management:** Secure order placement and user order history tracking.

### 🔐 Account & Administration
- **Authentication:** Secure login and registration using JWT and bcrypt, with session persistence.
- **Admin Dashboard:** Comprehensive control panel for catalogue management.
- **Data Management:** Control over products, categories, orders, coupons, and live gold rates.
- **Database Architecture:** Robust MySQL schema encompassing core entities: Users, Products, Orders, Categories, Coupons, and Payments.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express.js, JWT, bcrypt
- **Database:** MySQL 8+ (Relational Architecture)
- **Media Handling:** Cloudinary, native HTML5 `<img>` elements for seamless external image rendering.
- **State Management & Data Fetching:** React Context, Zustand, SWR, Axios

---

## 📂 Project Structure

```text
balaji-jewellers/
├── frontend/        # Next.js 14 App Router frontend application
├── backend/         # Express.js REST API server
├── database/        # MySQL schema, seed files, and ER diagrams
└── README.md        # Project documentation
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js** (v18 or newer)
- **MySQL** (v8.0 or newer)
- **Cloudinary** account (for media storage)

### 2. Database Initialization
Create the database and import the core schema:
```bash
mysql -u root -p < database/schema.sql
```

### 3. Backend Setup
Navigate to the backend directory, install dependencies, and start the development server.
```bash
cd backend
npm install
npm run dev
```
**Environment Variables (`backend/.env`):**
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

### 4. Frontend Setup
Navigate to the frontend directory, install dependencies, and start the Next.js server.
```bash
cd frontend
npm install
npm run dev
```
**Environment Variables (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210
```

---

## 🧭 Core Navigation Routes

- `/` - Storefront Home
- `/products` - Complete Catalogue
- `/product/[id]` - Product Details
- `/cart` - Shopping Cart
- `/checkout` - Secure Checkout
- `/auth` - Login & Registration
- `/orders` - User Order History
- `/wishlist` - Saved Items
- `/admin` - Administrator Dashboard

---

## 🎨 Brand Design System

The application strictly adheres to the Balaji Jewellers premium design language:
- 🥇 **Royal Gold:** `#C9A84C` (Primary accents, buttons, highlights)
- 🌑 **Deep Black:** `#0A0A0A` (Primary text, dark backgrounds)
- 🕊️ **Ivory:** `#FAF7F2` (Main background, cards)
- 🥂 **Champagne:** `#F5E6C8` (Secondary accents, subtle backgrounds)

*The UI utilizes vibrant colors, smooth transitions, and a clean layout to invoke a luxury, high-end feel.*

---

## 📝 Additional Notes

- **Image Optimization:** We utilize standard HTML `<img>` elements for product cards to ensure high reliability when loading images from varied external URLs, preventing common UI artifacts.
- **WhatsApp Integration:** The platform includes seamless WhatsApp redirect flows for personalized concierge support.
- **Production Deployment:** Ensure all environment variables (`FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, database credentials) are properly configured in your production environments (e.g., Vercel, AWS, Heroku).
