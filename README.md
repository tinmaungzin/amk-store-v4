# 🎮 AMK Store - Digital Game Codes E-commerce Platform

A modern, secure e-commerce platform for selling digital game codes (PS5, Xbox, Roblox, PC) built with **Next.js 15**, **TypeScript**, **Supabase**, and **shadcn/ui**.

## ✨ Features

### 🛒 Customer Features
- **Product Catalog** - Browse and search digital game codes by platform/game
- **Shopping Cart** - Add/remove items with real-time inventory checking
- **User Authentication** - Secure email/password authentication with role-based access
- **Order Management** - View purchase history and access game codes
- **Credit System** - Submit credit requests with payment proof upload
- **Responsive Design** - Mobile-first design with elegant UI components

### 🔧 Admin Features  
- **Dashboard** - Analytics and key metrics overview
- **Product Management** - CRUD operations for game codes and inventory
- **Order Management** - View all transactions and order history
- **User Management** - Customer account oversight
- **Credit Management** - Review and approve/reject credit requests
- **Security Monitoring** - Track system security and access

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, React 19
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RLS
- **ORM**: Prisma (type-safe database operations)
- **State Management**: React Context + useReducer
- **Storage**: Supabase Storage (payment proofs, product images)
- **Deployment**: Vercel (recommended)

## 🚀 Current Progress

### ✅ **MILESTONE 1: Secure Foundation** (COMPLETED)
- [x] Complete database schema with Supabase + Prisma
- [x] Email/password authentication system
- [x] Role-based access control (Super Admin, Admin, Customer)
- [x] Protected routes and navigation
- [x] Database seeding with sample data
- [x] Type-safe operations with Prisma

### ✅ **MILESTONE 2: Product Management** (COMPLETED)
- [x] Enhanced product catalog with search/filtering
- [x] Product detail pages with purchase UI
- [x] Shopping cart system with Context + useReducer
- [x] localStorage cart persistence
- [x] Stock level monitoring and validation
- [x] Checkout flow with order summary
- [x] Add to cart components with feedback

### 🚧 **Next: Admin Panel & Order Processing**
- [ ] Admin dashboard with analytics
- [ ] Product CRUD interface
- [ ] Order processing and game code assignment
- [ ] Code encryption/decryption utilities
- [ ] Inventory management

## 📁 Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── products/          # Product catalog and details
│   │   ├── checkout/          # Checkout flow
│   │   ├── login/             # Authentication
│   │   └── database-status/   # Admin database monitoring
│   ├── components/
│   │   ├── ui/                # shadcn components
│   │   ├── customer/          # Customer-specific components
│   │   │   └── cart/          # Shopping cart components
│   │   ├── admin/             # Admin-specific components
│   │   └── shared/            # Shared components
│   ├── contexts/              # React Context providers
│   ├── types/                 # TypeScript type definitions
│   ├── lib/                   # Utilities and configurations
│   │   ├── supabase/          # Supabase client and utilities
│   │   └── prisma/            # Prisma schema and utilities
│   └── hooks/                 # Custom React hooks
├── prisma/                    # Database schema and migrations
├── PLANNING.md               # Detailed project planning
├── TASK.md                   # Task tracking and progress
└── DATABASE_SETUP.md         # Database setup guide
```

## 🏃‍♂️ Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/tinmaungzin/amk-store-v4.git
   cd amk-store-v4
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Add your Supabase keys and database URL
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # Seed database with sample data
   npm run seed:prisma
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - **Customer Site**: http://localhost:3000
   - **Admin Panel**: http://localhost:3000/database-status (Admin+ only)
   - **Test Login**: http://localhost:3000/test-login

## 🔐 Test Users

| Role | Email | Password | Access |
|------|-------|----------|---------|
| **Super Admin** | superadmin@amkstore.com | superadmin123 | Full access + seeding commands |
| **Admin** | admin@amkstore.com | admin123 | Admin access |
| **Customer** | customer1@test.com | customer123 | Customer access ($150 credit) |

## 🗄️ Database Schema

The platform uses a comprehensive PostgreSQL schema with the following core tables:

- **profiles** - Extended user profiles with roles and credit balances
- **products** - Game code products with platform information
- **game_codes** - Encrypted game codes with sales tracking
- **orders** - Purchase orders with payment information
- **order_items** - Individual items within orders
- **credit_requests** - Credit requests with approval workflow

## 🎨 UI Components

Built with **shadcn/ui** for consistent, accessible design:

- **Forms** - React Hook Form + Zod validation
- **Data Tables** - Sortable, filterable tables
- **Navigation** - Responsive navigation with role-based visibility
- **Shopping Cart** - Slide-out cart with item management
- **Buttons** - Various button variants with loading states
- **Cards** - Product cards with platform badges
- **Badges** - Platform and status indicators

## 🔒 Security Features

- **Encrypted Game Codes** - AES-256 encryption for sensitive data
- **Row Level Security** - Supabase RLS for data protection
- **Input Validation** - Comprehensive validation with Zod
- **Role-Based Access** - Granular permissions system
- **Protected Routes** - Middleware-based route protection
- **Audit Logging** - Track admin actions and purchases

## 📊 Development Status

### Recently Completed ✅
- Complete shopping cart system with persistence
- Product catalog with advanced filtering
- Checkout flow with order summary
- Cart state management with React Context
- Stock validation and quantity controls
- Add to cart components with feedback
- Responsive cart UI with slide-out design

### Current Features 🚀
- **9 Sample Products** across PS5, Xbox, Roblox, PC platforms
- **28 Available Game Codes** in inventory
- **Complete Authentication** with role-based access
- **Product Search & Filtering** by name, platform, price, stock
- **Shopping Cart** with localStorage persistence
- **Checkout Process** with order summary

### Next Sprint 🎯
- Admin dashboard with product management
- Order processing with game code assignment
- Code encryption/decryption system
- Email notifications for purchases
- Advanced analytics and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: Coming soon
- **Documentation**: See `PLANNING.md` for detailed architecture
- **Task Tracking**: See `TASK.md` for development progress
- **Database Setup**: See `DATABASE_SETUP.md` for detailed setup

---

**Built with ❤️ by [tinmaungzin](https://github.com/tinmaungzin)**

*A modern, secure platform for digital game code distribution*
