# Game Codes E-commerce Platform - Planning Document

## Project Vision
A secure e-commerce platform for selling digital game codes (PS5, Xbox, Roblox, etc.) with dual interfaces: customer-facing website and admin management panel. The platform will feature encrypted code storage, credit system, order management, and comprehensive analytics.

## Core Features

### Customer Website
- **Product Catalog**: Browse and search digital game codes by platform/game
- **Shopping Cart**: Add/remove items, view totals
- **User Authentication**: Registration, login, profile management
- **Credit System**: Submit credit requests with payment proof
- **Order History**: View purchased codes and transaction history
- **Secure Code Delivery**: Access purchased codes through account

### Admin Panel
- **Dashboard**: Analytics and key metrics overview
- **Product Management**: CRUD operations for game codes and inventory
- **Order Management**: View all transactions and order history
- **User Management**: Customer account oversight
- **Credit Management**: Review and approve/reject credit requests
- **Admin Management**: Add/remove admin users
- **Security Monitoring**: Track system security and access

## Technical Architecture

### Tech Stack
- **Frontend**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS + shadcn component library
- **UI Components**: shadcn (Radix UI primitives)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for payment proofs, product images)
- **Deployment**: Vercel (recommended for Next.js)

### Security Considerations
- **Code Encryption**: AES-256 encryption for game codes before database storage
- **Environment Variables**: Secure key management
- **Row Level Security**: Supabase RLS for data protection
- **Input Validation**: Comprehensive validation on all user inputs
- **Rate Limiting**: Prevent abuse and automated attacks
- **Audit Logging**: Track all admin actions and purchases

## Database Schema

### Core Tables
```sql
-- Users (handled by Supabase Auth + extended profile)
profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  credit_balance DECIMAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Products
products (
  id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  platform TEXT, -- PS5, Xbox, Roblox, etc.
  price DECIMAL,
  image_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Game Codes (encrypted)
game_codes (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  encrypted_code TEXT, -- AES encrypted
  is_sold BOOLEAN DEFAULT FALSE,
  sold_at TIMESTAMP,
  order_id UUID,
  created_at TIMESTAMP
)

-- Orders
orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  total_amount DECIMAL,
  payment_method TEXT, -- credit, external
  status TEXT, -- pending, completed, cancelled
  created_at TIMESTAMP
)

-- Order Items
order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  game_code_id UUID REFERENCES game_codes(id),
  quantity INTEGER,
  unit_price DECIMAL,
  created_at TIMESTAMP
)

-- Credit Requests
credit_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  amount DECIMAL,
  payment_proof_url TEXT,
  status TEXT, -- pending, approved, rejected
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Admin Users
admin_users (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  role TEXT, -- super_admin, admin
  permissions JSONB,
  created_at TIMESTAMP
)
```

## System Architecture

### Frontend Structure
```
/pages (or /app for App Router)
├── /customer
│   ├── / (homepage)
│   ├── /products
│   ├── /cart
│   ├── /profile
│   ├── /orders
│   └── /credits
└── /admin
    ├── /dashboard
    ├── /products
    ├── /orders
    ├── /users
    ├── /credits
    └── /settings

/components
├── /ui (shadcn components)
├── /customer (customer-specific components)
├── /admin (admin-specific components)
└── /shared (shared components)

/lib
├── /utils.ts (shadcn utilities)
├── /supabase
└── /validations
```

### API Structure
```
/api
├── /auth (authentication endpoints)
├── /products (product CRUD)
├── /orders (order management)
├── /credits (credit system)
├── /admin (admin-specific endpoints)
└── /encryption (code encryption/decryption)
```

## Security Implementation

### Code Encryption Strategy
- Use AES-256-GCM encryption for game codes
- Store encryption key in environment variables
- Implement key rotation capability
- Add integrity verification

### Access Control
- Role-based permissions (Customer, Admin, Super Admin)
- Supabase RLS policies for data isolation
- API route protection with middleware
- Session management and token validation

## Development Phases

### Phase 1: Foundation (Weeks 1-2)
- Project setup and basic architecture
- shadcn installation and configuration
- Database schema implementation
- Authentication system
- Basic UI components and design system

### Phase 2: Core Features (Weeks 3-4)
- Product catalog with shadcn components
- Shopping cart with elegant UI
- Order processing system
- Code encryption/decryption
- Basic admin panel with shadcn

### Phase 3: Advanced Features (Weeks 5-6)
- Credit system with form components
- Admin dashboard with data tables and charts
- Payment proof management with file upload
- User management with data grids

### Phase 4: Security & Polish (Weeks 7-8)
- Security audit and hardening
- Performance optimization
- UI/UX refinements with shadcn theming
- Testing and bug fixes

## Performance Considerations
- **Caching**: Implement Redis or similar for frequently accessed data
- **Image Optimization**: Use Next.js Image component for product images
- **Database Indexing**: Proper indexing for search and filtering
- **Pagination**: Implement for large datasets
- **Code Splitting**: Lazy load admin components

## Monitoring & Analytics
- **Error Tracking**: Implement Sentry or similar
- **Performance Monitoring**: Web Vitals tracking
- **Business Analytics**: Track sales, popular products, user behavior
- **Security Monitoring**: Failed login attempts, suspicious activity

## Deployment Strategy
- **Environment Setup**: Development, Staging, Production
- **CI/CD Pipeline**: Automated testing and deployment
- **Database Migrations**: Version-controlled schema changes
- **Backup Strategy**: Regular database backups
- **SSL/TLS**: Ensure all communications are encrypted

## Compliance & Legal
- **Data Protection**: GDPR compliance considerations
- **Terms of Service**: Clear terms for digital goods
- **Privacy Policy**: Data handling transparency
- **Age Verification**: For age-restricted content

## Scalability Considerations
- **Horizontal Scaling**: Design for multiple server instances
- **Database Optimization**: Query optimization and connection pooling
- **CDN Integration**: For static assets and images
- **Microservices**: Consider breaking into smaller services as needed

## Risk Mitigation
- **Code Security**: Multiple layers of protection for game codes
- **Fraud Prevention**: Monitor for suspicious purchasing patterns
- **Backup Systems**: Regular backups and disaster recovery
- **Legal Compliance**: Ensure platform complies with digital goods regulations