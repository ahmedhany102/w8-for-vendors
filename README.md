<p align="center">
  <img src="public/logo.png" alt="Sarraly Logo" width="120" />
</p>

<h1 align="center">🛍️ Sarraly - سرعلي</h1>

<p align="center">
  <strong>Multi-Vendor E-Commerce Mall Platform</strong><br/>
  <em>Launch your online store in 30 seconds</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</p>

---

## 📖 Overview

**Sarraly** (سرعلي) is a production-ready, multi-vendor e-commerce platform that enables vendors to create their own specialized storefronts within a unified marketplace. Think of it as a digital shopping mall where each vendor has their own customizable store with unique branding, shipping rates, and product catalogs.

### 🎯 Key Value Propositions

- **For Vendors:** Zero-code store setup, real-time analytics, and full control over pricing & shipping
- **For Customers:** Unified shopping experience across multiple vendors with a single cart
- **For Admins:** Complete platform oversight with user management and content moderation

---

## ✨ Features

### 🏬 Main Mall (Marketplace)

| Feature | Description |
|---------|-------------|
| **Global Search** | Search products across all vendor stores |
| **Category Sections** | Dynamic homepage sections (Best Sellers, New Arrivals, Hot Deals) |
| **Vendor Directory** | Browse and discover all active vendors |
| **SEO Optimized** | Meta tags, Open Graph, sitemap, and robots.txt pre-configured |

### 🏪 Vendor Stores

| Feature | Description |
|---------|-------------|
| **Custom Storefronts** | Unique URL (`/store/{vendor-slug}`), logo, banner, and branding |
| **Shipping Zones** | Define custom shipping rates per city/region |
| **Store Analytics** | Real-time dashboard with sales, orders, and visitor metrics |
| **Order Management** | Track and update order status (Pending → Shipped → Delivered) |

### 📦 Product Management

| Product Type | Description |
|--------------|-------------|
| **Simple Products** | Basic products with name, price, stock, and images |
| **Variable Products** | Products with color/size variants, each with unique pricing and inventory |
| **Image Galleries** | Multiple images per product with thumbnail navigation |
| **Discount System** | Percentage-based discounts with original price display |

### 🚚 Logistics Engine

- **Zone-Based Shipping:** Calculate shipping costs based on vendor location and customer city
- **Free Shipping:** Vendors can offer free shipping on specific products
- **Fast Shipping:** Flag products for expedited delivery
- **Real-Time Inventory:** Stock deduction on order placement

### 🎨 User Experience

- **Interactive Color Swatches:** Click to preview product colors before purchasing
- **Responsive Design:** Optimized for mobile, tablet, and desktop
- **Dark/Light Mode:** Theme toggle with system preference detection
- **RTL Support:** Full Arabic language support with right-to-left layout
- **Favorites & Cart:** Persistent wishlist and shopping cart

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | Component-based UI with type safety |
| **Build Tool** | Vite | Lightning-fast HMR and optimized builds |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS with accessible components |
| **Icons** | Lucide React | Beautiful, consistent iconography |
| **Backend** | Supabase | PostgreSQL database, Auth, and Realtime subscriptions |
| **State** | React Context + Hooks | Centralized auth and cart state management |
| **Routing** | React Router v6 | Client-side routing with nested layouts |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── admin/          # Super Admin dashboard components
│   ├── vendor/         # Vendor dashboard components
│   ├── sections/       # Dynamic homepage sections (carousels, grids)
│   └── ui/             # Reusable UI primitives (Button, Input, Dialog)
├── contexts/           # React Context providers (Auth, Theme)
├── hooks/              # Custom hooks for data fetching and logic
│   ├── useSupabaseProducts.ts
│   ├── useVendorOrders.ts
│   ├── useShippingRates.ts
│   └── ...
├── integrations/       # Supabase client configuration
├── models/             # Data models and local storage handlers
├── pages/              # Route-level page components
│   ├── Home.tsx
│   ├── ProductDetails.tsx
│   ├── StorePage.tsx
│   └── ...
├── services/           # API service layers
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and helpers
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **bun** package manager
- **Supabase** project (for database and authentication)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ahmedhany102/sarraly.git
   cd sarraly
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   
   # Admin Credentials (REQUIRED - Never commit real values!)
   VITE_ADMIN_EMAIL=admin@yourdomain.com
   VITE_ADMIN_PASSWORD=YourSecurePassword123!
   VITE_ADMIN_NAME=Admin
   ```

   > ⚠️ **Security Note:** The `.env` file is git-ignored. Never commit sensitive credentials to version control.

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open your browser:**
   ```
   http://localhost:8080
   ```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## 🗄️ Database Schema

The platform uses Supabase (PostgreSQL) with the following core tables:

| Table | Purpose |
|-------|---------|
| `products` | Product catalog with variants support |
| `product_color_variants` | Color/size variants with individual pricing |
| `orders` | Customer orders with status tracking |
| `order_items` | Line items linking orders to products |
| `vendors` | Vendor store information and settings |
| `vendor_profiles` | Vendor user profiles and approval status |
| `shipping_rates` | Zone-based shipping configurations |
| `categories` | Hierarchical product categories |

---

## 🔐 Security

- **Environment Variables:** All sensitive credentials stored in `.env` (git-ignored)
- **Row-Level Security (RLS):** Supabase policies enforce data access control
- **Authentication:** Supabase Auth with email/password and OAuth support
- **Input Validation:** Client and server-side validation

---

## 🌐 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

### Manual Build

```bash
npm run build
# Output in /dist folder - serve with any static hosting
```

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👨‍💻 Author

**Ahmed Hany**  
📧 Contact: [ahmedhanyseifeldien@gmail.com](mailto:ahmedhanyseifeldien@gmail.com)

---

<p align="center">
  <strong>Built with ❤️ for the Arabic e-commerce ecosystem</strong>
</p>
