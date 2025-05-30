#!/usr/bin/env tsx

/**
 * Enhanced Database Seeding Script with Prisma ORM
 * 
 * This script provides utilities for seeding the database with test data
 * using Prisma for type-safe database operations and better performance.
 * 
 * Usage:
 *   npm run seed:prisma              # Run full development seed
 *   npm run seed:prisma reset        # Reset database and seed
 *   npm run seed:prisma verify       # Verify seed data
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const prisma = new PrismaClient()

/**
 * Admin users data
 */
const adminUsers = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@amkstore.dev',
    full_name: 'Super Admin',
    credit_balance: 0,
    role: 'super_admin'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'manager@amkstore.dev',
    full_name: 'Store Manager',
    credit_balance: 0,
    role: 'admin'
  }
]

/**
 * Sample products data
 */
const products = [
  // PlayStation 5 Games
  {
    name: 'Spider-Man 2 PS5',
    description: 'The latest Spider-Man adventure for PlayStation 5. Digital download code.',
    platform: 'PS5',
    price: 69.99,
    image_url: '/images/spiderman2-ps5.jpg',
    is_active: true
  },
  {
    name: 'God of War Ragnarök PS5',
    description: 'Epic Norse mythology adventure continues. Digital code for PS5.',
    platform: 'PS5',
    price: 59.99,
    image_url: '/images/god-of-war-ragnarok.jpg',
    is_active: true
  },
  {
    name: 'Horizon Forbidden West PS5',
    description: 'Explore a beautiful post-apocalyptic world. PS5 digital edition.',
    platform: 'PS5',
    price: 49.99,
    image_url: '/images/horizon-forbidden-west.jpg',
    is_active: true
  },
  // Xbox Games
  {
    name: 'Forza Horizon 5 Xbox',
    description: 'Open world racing in Mexico. Xbox digital download.',
    platform: 'Xbox',
    price: 59.99,
    image_url: '/images/forza-horizon-5.jpg',
    is_active: true
  },
  {
    name: 'Halo Infinite Xbox',
    description: 'Master Chief returns in this epic sci-fi shooter.',
    platform: 'Xbox',
    price: 49.99,
    image_url: '/images/halo-infinite.jpg',
    is_active: true
  },
  // Roblox Gift Cards
  {
    name: 'Roblox Gift Card $10',
    description: 'Add $10 worth of Robux to your Roblox account.',
    platform: 'Roblox',
    price: 10.00,
    image_url: '/images/roblox-10.jpg',
    is_active: true
  },
  {
    name: 'Roblox Gift Card $25',
    description: 'Add $25 worth of Robux to your Roblox account.',
    platform: 'Roblox',
    price: 25.00,
    image_url: '/images/roblox-25.jpg',
    is_active: true
  },
  // PC Games
  {
    name: 'Elden Ring PC',
    description: 'From Software\'s epic dark fantasy adventure.',
    platform: 'PC',
    price: 54.99,
    image_url: '/images/elden-ring.jpg',
    is_active: true
  },
  {
    name: 'Cyberpunk 2077 PC',
    description: 'Futuristic RPG in Night City. Steam download code.',
    platform: 'PC',
    price: 39.99,
    image_url: '/images/cyberpunk-2077.jpg',
    is_active: true
  }
]

/**
 * Test customer data
 */
const testCustomers = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    email: 'customer1@test.dev',
    full_name: 'John Gaming',
    credit_balance: 150.00,
    role: 'customer'
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    email: 'customer2@test.dev',
    full_name: 'Sarah Player',
    credit_balance: 75.50,
    role: 'customer'
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    email: 'customer3@test.dev',
    full_name: 'Mike Gamer',
    credit_balance: 0.00,
    role: 'customer'
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    email: 'customer4@test.dev',
    full_name: 'Lisa Console',
    credit_balance: 250.00,
    role: 'customer'
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    email: 'customer5@test.dev',
    full_name: 'Alex Streamer',
    credit_balance: 25.99,
    role: 'customer'
  }
]

/**
 * Seed admin users
 */
async function seedAdminUsers() {
  console.log('👤 Creating admin users...')
  
  for (const admin of adminUsers) {
    await prisma.profile.upsert({
      where: { id: admin.id },
      update: {
        role: admin.role,
        updated_at: new Date()
      },
      create: admin
    })
  }
  
  console.log(`✅ Created ${adminUsers.length} admin users`)
}

/**
 * Seed products
 */
async function seedProducts() {
  console.log('🎮 Creating sample products...')
  
  const createdProducts = []
  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { name: product.name },
      update: {
        ...product,
        updated_at: new Date()
      },
      create: product
    })
    createdProducts.push(created)
  }
  
  console.log(`✅ Created ${createdProducts.length} products`)
  return createdProducts
}

/**
 * Seed game codes for products
 */
async function seedGameCodes(products: any[]) {
  console.log('🎫 Creating sample game codes...')
  
  let totalCodes = 0
  for (const product of products) {
    const codesPerProduct = Math.floor(Math.random() * 5) + 2 // 2-6 codes per product
    
    for (let i = 1; i <= codesPerProduct; i++) {
      await prisma.gameCode.create({
        data: {
          product_id: product.id,
          encrypted_code: `ENC_${product.platform.toUpperCase()}_${product.name.replace(/\s/g, '').substring(0, 10).toUpperCase()}_${i.toString().padStart(3, '0')}`,
          is_sold: false
        }
      })
      totalCodes++
    }
  }
  
  console.log(`✅ Created ${totalCodes} game codes`)
}

/**
 * Seed test customers
 */
async function seedTestCustomers() {
  console.log('👥 Creating test customers...')
  
  for (const customer of testCustomers) {
    await prisma.profile.upsert({
      where: { id: customer.id },
      update: {
        credit_balance: customer.credit_balance,
        updated_at: new Date()
      },
      create: customer
    })
  }
  
  console.log(`✅ Created ${testCustomers.length} test customers`)
}

/**
 * Seed credit requests
 */
async function seedCreditRequests() {
  console.log('💳 Creating sample credit requests...')
  
  const creditRequests = [
    {
      user_id: '10000000-0000-0000-0000-000000000001',
      amount: 100.00,
      payment_proof_url: '/uploads/payment-proof-1.jpg',
      status: 'approved',
      admin_notes: 'Payment verified via bank transfer',
      reviewed_by: '00000000-0000-0000-0000-000000000001',
      reviewed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
      user_id: '10000000-0000-0000-0000-000000000002',
      amount: 50.00,
      payment_proof_url: '/uploads/payment-proof-2.jpg',
      status: 'approved',
      admin_notes: 'PayPal payment confirmed',
      reviewed_by: '00000000-0000-0000-0000-000000000002',
      reviewed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      user_id: '10000000-0000-0000-0000-000000000003',
      amount: 75.00,
      payment_proof_url: '/uploads/payment-proof-3.jpg',
      status: 'pending'
    },
    {
      user_id: '10000000-0000-0000-0000-000000000005',
      amount: 40.00,
      payment_proof_url: '/uploads/payment-proof-4.jpg',
      status: 'pending'
    },
    {
      user_id: '10000000-0000-0000-0000-000000000004',
      amount: 500.00,
      payment_proof_url: '/uploads/payment-proof-5.jpg',
      status: 'rejected',
      admin_notes: 'Payment proof unclear, please resubmit with clearer image',
      reviewed_by: '00000000-0000-0000-0000-000000000001',
      reviewed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    }
  ]
  
  for (const request of creditRequests) {
    await prisma.creditRequest.create({
      data: request
    })
  }
  
  console.log(`✅ Created ${creditRequests.length} credit requests`)
}

/**
 * Seed sample orders
 */
async function seedSampleOrders() {
  console.log('🛒 Creating sample orders...')
  
  // Get some products and available codes
  const spiderManProduct = await prisma.product.findFirst({
    where: { name: { contains: 'Spider-Man' } }
  })
  
  const robloxProduct = await prisma.product.findFirst({
    where: { name: { contains: 'Roblox $10' } }
  })
  
  if (!spiderManProduct || !robloxProduct) {
    console.log('⚠️  Products not found for orders')
    return
  }
  
  // Get available codes
  const spiderManCode = await prisma.gameCode.findFirst({
    where: { product_id: spiderManProduct.id, is_sold: false }
  })
  
  const robloxCode = await prisma.gameCode.findFirst({
    where: { product_id: robloxProduct.id, is_sold: false }
  })
  
  if (!spiderManCode || !robloxCode) {
    console.log('⚠️  No available codes for orders')
    return
  }
  
  // Create first order
  const order1 = await prisma.order.create({
    data: {
      user_id: '10000000-0000-0000-0000-000000000001',
      total_amount: spiderManProduct.price,
      payment_method: 'credit',
      status: 'completed',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    }
  })
  
  // Create order item and mark code as sold
  await prisma.orderItem.create({
    data: {
      order_id: order1.id,
      product_id: spiderManProduct.id,
      game_code_id: spiderManCode.id,
      quantity: 1,
      unit_price: spiderManProduct.price
    }
  })
  
  await prisma.gameCode.update({
    where: { id: spiderManCode.id },
    data: {
      is_sold: true,
      sold_at: order1.created_at,
      order_id: order1.id
    }
  })
  
  // Create second order
  const order2 = await prisma.order.create({
    data: {
      user_id: '10000000-0000-0000-0000-000000000002',
      total_amount: robloxProduct.price,
      payment_method: 'credit',
      status: 'completed',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    }
  })
  
  await prisma.orderItem.create({
    data: {
      order_id: order2.id,
      product_id: robloxProduct.id,
      game_code_id: robloxCode.id,
      quantity: 1,
      unit_price: robloxProduct.price
    }
  })
  
  await prisma.gameCode.update({
    where: { id: robloxCode.id },
    data: {
      is_sold: true,
      sold_at: order2.created_at,
      order_id: order2.id
    }
  })
  
  console.log('✅ Created 2 sample orders')
}

/**
 * Verify seed data
 */
async function verifySeed() {
  console.log('🔍 Verifying seed data...')
  
  const [productCount, profileCount, gameCodeCount, orderCount, creditRequestCount] = await Promise.all([
    prisma.product.count(),
    prisma.profile.count(),
    prisma.gameCode.count(),
    prisma.order.count(),
    prisma.creditRequest.count()
  ])
  
  console.log('📊 Seed verification:')
  console.log(`   Products: ${productCount}`)
  console.log(`   Profiles: ${profileCount}`)
  console.log(`   Game Codes: ${gameCodeCount}`)
  console.log(`   Orders: ${orderCount}`)
  console.log(`   Credit Requests: ${creditRequestCount}`)
  
  // Platform breakdown
  const platformStats = await prisma.product.groupBy({
    by: ['platform'],
    _count: { platform: true },
    _avg: { price: true }
  })
  
  console.log('\n🎮 Platform breakdown:')
  platformStats.forEach(stat => {
    console.log(`   ${stat.platform}: ${stat._count.platform} products (avg: $${stat._avg.price?.toFixed(2)})`)
  })
  
  // Check sold vs available codes
  const codeStats = await prisma.gameCode.groupBy({
    by: ['is_sold'],
    _count: { is_sold: true }
  })
  
  console.log('\n🎫 Game codes:')
  codeStats.forEach(stat => {
    console.log(`   ${stat.is_sold ? 'Sold' : 'Available'}: ${stat._count.is_sold} codes`)
  })
}

/**
 * Clear all seed data
 */
async function clearSeedData() {
  console.log('🧹 Clearing existing seed data...')
  
  // Delete in correct order due to foreign key constraints
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.creditRequest.deleteMany()
  await prisma.gameCode.deleteMany()
  await prisma.product.deleteMany()
  
  // Remove seed profiles (keep real auth users)
  await prisma.profile.deleteMany({
    where: {
      email: {
        in: [
          'admin@amkstore.dev',
          'manager@amkstore.dev',
          'customer1@test.dev',
          'customer2@test.dev',
          'customer3@test.dev',
          'customer4@test.dev',
          'customer5@test.dev'
        ]
      }
    }
  })
  
  console.log('✅ Seed data cleared')
}

/**
 * Full seed process
 */
async function fullSeed() {
  console.log('🌱 Starting full database seed...')
  
  await seedAdminUsers()
  const products = await seedProducts()
  await seedGameCodes(products)
  await seedTestCustomers()
  await seedCreditRequests()
  await seedSampleOrders()
  
  console.log('\n✅ Database seeded successfully!')
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2] || 'seed'
  
  console.log('🌱 AMK Store v4 Database Seeding (Prisma)')
  console.log('=========================================')
  
  try {
    switch (command) {
      case 'seed':
        await fullSeed()
        await verifySeed()
        break
        
      case 'reset':
        await clearSeedData()
        await fullSeed()
        await verifySeed()
        break
        
      case 'clear':
        await clearSeedData()
        break
        
      case 'verify':
        await verifySeed()
        break
        
      default:
        console.log('Available commands:')
        console.log('  seed    - Seed database with test data')
        console.log('  reset   - Clear and re-seed database')
        console.log('  clear   - Clear all seed data')
        console.log('  verify  - Verify seed data')
        break
    }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Execute if called directly
if (require.main === module) {
  main()
} 