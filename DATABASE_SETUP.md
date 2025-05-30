# Database Setup Guide - AMK Store v4

This guide walks you through setting up the database with Prisma ORM for the AMK Store v4 project.

## Prerequisites

- A Supabase project with database configured
- Node.js and npm installed
- Project dependencies installed (`npm install`)

## 1. Environment Configuration

### Add Database URL to `.env.local`

Create or update your `.env.local` file with your Supabase database connection:

```env
# Database connection for Prisma
DATABASE_URL="postgresql://postgres.[your-project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# For direct connections (optional)
DIRECT_URL="postgresql://postgres.[your-project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### How to get your connection string:

1. Go to your Supabase Dashboard
2. Navigate to Settings > Database
3. Find "Connection string" section
4. Use the "Connection pooling" string for `DATABASE_URL`
5. Use the "Direct connection" string for `DIRECT_URL` (if needed)

## 2. Database Schema

The project uses a comprehensive schema with the following tables:

- **profiles** - User profiles extending Supabase auth
- **products** - Game codes and digital products catalog
- **game_codes** - Encrypted game codes inventory
- **orders** - Purchase transactions
- **order_items** - Individual items in orders
- **credit_requests** - Payment proof submissions

All tables include proper foreign key relationships, indexes, and constraints.

## 3. Prisma Commands

### Generate Prisma Client
```bash
npm run prisma:generate
```

### Sync schema with existing database
```bash
npm run prisma:pull
```

### Push schema changes to database
```bash
npm run prisma:push
```

### Open Prisma Studio (database GUI)
```bash
npm run prisma:studio
```

## 4. Database Seeding

### Run Full Seed (Recommended)
```bash
npm run seed:prisma
```

This creates:
- 2 admin users (super_admin, admin)
- 9 sample products across platforms (PS5, Xbox, PC, Roblox)
- 2-6 game codes per product (randomly generated)
- 5 test customers with varying credit balances
- 5 credit requests (approved, pending, rejected)
- 2 sample completed orders

### Alternative Seeding Commands

```bash
# Clear all seed data
npm run seed:prisma:clear

# Reset and re-seed
npm run seed:prisma:reset

# Verify seed data
npm run seed:prisma:verify
```

## 5. Testing Database Connection

### Check Database Status
Visit: http://localhost:3000/database-status

This page will:
- Test database connection
- Show record counts for each table
- Provide setup instructions
- Guide you through next steps

### View Products
Visit: http://localhost:3000/products

This page will:
- Display all products from database
- Group by platform
- Show stock levels (available game codes)
- Display placeholder for empty database

## 6. Database Helper Functions

The project includes type-safe database helpers in `lib/prisma.ts`:

```typescript
import { db } from '@/lib/prisma'

// Get all active products
const products = await db.product.findActive()

// Get products with available codes
const inStock = await db.product.findWithAvailableCodes()

// Get user profile
const user = await db.profile.findByEmail('user@example.com')

// Create order with transaction safety
const order = await db.order.createWithItems({
  user_id: 'user-uuid',
  total_amount: 69.99,
  payment_method: 'credit',
  items: [{ product_id: 'product-uuid', quantity: 1, unit_price: 69.99 }]
})
```

## 7. Development Workflow

### Typical Development Setup:
1. Configure environment variables
2. Generate Prisma client: `npm run prisma:generate`
3. Seed database: `npm run seed:prisma`
4. Check status: Visit `/database-status`
5. Test products: Visit `/products`
6. Start development: `npm run dev`

### Schema Changes:
1. Update `prisma/schema.prisma`
2. Push changes: `npm run prisma:push`
3. Regenerate client: `npm run prisma:generate`
4. Update seed data if needed

## 8. Troubleshooting

### Connection Issues
- Verify DATABASE_URL is correctly formatted
- Check Supabase project is not paused
- Ensure network access to Supabase
- Try direct connection URL if pooling fails

### Seeding Issues
- Make sure tables exist before seeding
- Check for foreign key constraint errors
- Clear existing data with `npm run seed:prisma:clear`

### Type Issues
- Regenerate Prisma client: `npm run prisma:generate`
- Restart TypeScript server in VS Code
- Check import paths in your code

## 9. Production Considerations

- Use connection pooling for better performance
- Set appropriate connection limits
- Monitor database performance
- Implement proper error handling
- Use transactions for critical operations
- Regular database backups

## 10. Available Scripts

```bash
# Database operations
npm run seed:prisma              # Full database seeding
npm run seed:prisma:reset        # Clear and re-seed
npm run seed:prisma:clear        # Clear all seed data
npm run seed:prisma:verify       # Verify seed data

# Prisma operations  
npm run prisma:generate          # Generate Prisma client
npm run prisma:studio           # Open database GUI
npm run prisma:push             # Push schema to database
npm run prisma:pull             # Pull schema from database
npm run prisma:migrate          # Run migrations (if using)

# Legacy Supabase seeding (fallback)
npm run seed                    # Original seeding script
npm run seed:reset              # Original reset script
```

## Next Steps

After database setup:
1. ✅ Database connected and seeded
2. → Start building Product Catalog UI
3. → Implement Shopping Cart functionality
4. → Create Admin Dashboard
5. → Add Credit System features 