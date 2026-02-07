# SaaS Telegram Shop Platform 🛍️

A powerful, monolithic platform for creating and managing Telegram Shop Mini Apps (TMA). Built with **Next.js**, **Fastify**, and **Prisma**.

This solution allows anyone to deploy their own "Shopify for Telegram" — a platform where users can register, create shops, and manage their products, which are then instantly available via a Telegram Bot Web App.

---

## 🌟 How It Works (Ideal Flow)

The platform serves two main types of users: **Shop Owners** (Merchants) and **Customers** (Telegram Users).

### 1. For Shop Owners (Admin Panel) 👔
*The control center for managing the business.*

1.  **Registration & Onboarding**:
    - User visits the Admin Panel (web).
    - Registers an account and creates a new **Shop**.
    - The system generates a unique API Key and Webhook URL for the shop.
2.  **Bot Connection**:
    - Owner creates a bot via `@BotFather` in Telegram.
    - Pastes the **Bot Token** into the Admin Panel.
    - Our system automatically sets the Webhook, connecting the bot to the platform.
3.  **Catalog Management**:
    - **Categories**: Create nested categories (e.g., "Electronics > Phones").
    - **Products**: Add products with images (Cloudinary), prices, descriptions, and stock levels.
4.  **Order Processing**:
    - Receive real-time orders from the Telegram Bot.
    - View customer details, order items, and total status.
    - Update order status (New -> Processing -> Shipped -> Completed).

### 2. For Customers (Telegram Mini App) 🛒
*The shopping experience inside Telegram.*

1.  **Entry Point**:
    - Customer starts the bot (`/start`).
    - The bot welcomes them and provides a "Open Shop" button.
2.  **Immersive Shopping**:
    - The Mini App opens inside Telegram (no external browser).
    - **Browse**: Smooth scrolling through categories and products.
    - **Search & Filter**: Quickly find items.
    - **Product Details**: View high-quality images and descriptions.
3.  **Checkout**:
    - Add items to Cart.
    - Click "Checkout" to review the order.
    - Fill in delivery details (address, phone) or use saved Telegram info.
    - Pay (Integration with payment providers can be added).
4.  **Notifications**:
    - Receive status updates directly in the Telegram chat (e.g., "Your order #123 has been shipped!").

---

## 🚀 Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Backend**: [Fastify](https://fastify.dev/) (Custom Server), Node.js
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Neon](https://neon.tech/) or local), [Prisma ORM](https://www.prisma.io/)
- **State Management**: React Context, Local Storage
- **Image Storage**: [Cloudinary](https://cloudinary.com/)
- **Bot Framework**: [Telegraf](https://telegraf.js.org/) (Webhook mode)
- **Deployment**: Docker, [Koyeb](https://koyeb.com/)

---

## 🛠️ Prerequisites

- **Node.js** v18+ (LTS recommended)
- **PostgreSQL** Database (Local or Cloud like Neon/Supabase)
- **Cloudinary** Account (for image uploads)
- **Git**

---

## 📦 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd myserv
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory based on `.env.example`:
    ```env
    # Database
    DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

    # Authentication
    JWT_SECRET="super_secret_jwt_key_please_change"
    ENCRYPTION_KEY="32_char_long_key_for_encrypting!!" # Must be exactly 32 chars

    # Cloudinary (Images)
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
    CLOUDINARY_API_KEY="your_api_key"
    CLOUDINARY_API_SECRET="your_api_secret"

    # App Config
    NEXT_PUBLIC_APP_URL="http://localhost:3000" # Change for production
    NODE_ENV="development"
    ```

4.  **Database Setup:**
    Sync your Prisma schema with the database:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    - The app will start at `http://localhost:3000`
    - API routes are at `http://localhost:3000/api/*`

---

## 📂 Project Structure

```text
/
├── prisma/               # Database Schema (schema.prisma)
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router (Frontend Pages)
│   │   ├── admin/        # Shop Owner Dashboard
│   │   ├── (auth)/       # Authentication Pages
│   │   └── layout.tsx    # Root Layout
│   ├── components/       # UI Components (shadcn/ui)
│   ├── lib/              # Shared Utilities (Prisma Client, i18n, Cloudinary)
│   ├── server/           # Backend Logic (Fastify)
│   │   ├── index.ts      # Server Entry Point
│   │   ├── routes/       # API Routes (Auth, Products, Bot, Upload)
│   │   └── services/     # core/business logic
│   └── types/            # TypeScript Interfaces
├── next.config.mjs       # Next.js Configuration
├── tsconfig.server.json  # TypeScript Config for Backend
└── Dockerfile            # Production Build Instructions
```

---

## 🗄️ Database Management

We use **Prisma ORM**.

- **Update Schema**: Edit `prisma/schema.prisma`.
- **Sync DB**: Run `npx prisma db push`.
- **View Data**: Run `npx prisma studio` to open a GUI.
- **Generate Client**: Run `npx prisma generate` (automatically runs on postinstall).

---

## 🤖 Telegram Bot Integration

This platform acts as a manager for multiple Telegram bots.
1.  **Shop Owner** adds their Bot Token in the Admin Panel.
2.  **Backend** sets the Webhook for that bot to our server (`/api/webhook/[shopId]`).
3.  **Webhook Handler** receives updates and processes commands (e.g., `/start` opens the Mini App).

**Note:** For local development, you need an HTTPS tunnel (like **ngrok**) for Telegram Webhooks to work.
```bash
ngrok http 3000
```
Then update `NEXT_PUBLIC_APP_URL` in `.env` to the ngrok URL.

---

## 🚀 Deployment (Docker & Koyeb)

The project is configured for **Koyeb** (or any Docker-based hosting).

### Koyeb Setup
1.  Push code to GitHub.
2.  Create a new Web Service on Koyeb connected to the repo.
3.  **Environment Variables**: Add all variables from `.env` to Koyeb Settings.
4.  **Build Command**: Auto-detected from Dockerfile.
5.  **Run Command**: `npm start` (Runs the custom Fastify server).

### Docker Compilation & Memory Optimization
To save memory in production (crucial for free tier hosting), we perform a specific build process:
1.  **Standalone Output**: Next.js is configured to `output: "standalone"`, keeping the build size minimal.
2.  **Server Compilation**: `npm run build` compiles `src/server` (TypeScript) into `dist/` (JavaScript).
3.  **Runtime**: `npm start` runs the app using standard `node` (not `ts-node`), significantly reducing memory usage (heap size < 200MB).
4.  **Memory Limit**: We set `NODE_OPTIONS="--max-old-space-size=512"` in Dockerfile to prevent OOM crashes.

---

## 📜 Scripts

- `npm run dev`: Start development server (ts-node + nodemon).
- `npm run build`: Build for production (Next.js + Server TS -> JS).
- `npm start`: Start production server (Node.js).
- `npm run lint`: Run ESLint.

---

## 🐛 Troubleshooting

**Memory Issues (OOM):**
If the app crashes with `JavaScript heap out of memory`, ensure you are setting `NODE_OPTIONS="--max-old-space-size=..."` appropriate for your hosting plan (e.g., 512MB).
We also use `output: "standalone"` in `next.config.mjs` to minimize build size.

**Prisma Client Error:**
If you see errors about missing Prisma Client, run `npx prisma generate`.

**Database Sync:**
The `npm start` command includes `npx prisma db push` to automatically apply schema changes on deployment startup.
