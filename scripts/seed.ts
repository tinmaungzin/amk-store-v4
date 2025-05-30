#!/usr/bin/env tsx

/**
 * Database Seeding Script for AMK Store v4
 * 
 * This script provides utilities for seeding the database with test data.
 * It can be run in different environments (development, staging) with
 * different data sets.
 * 
 * Usage:
 *   npm run seed              # Run full development seed
 *   npm run seed:reset        # Reset database and seed
 *   npm run seed:minimal      # Minimal seed for testing
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

// Environment configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set')
  console.error('Checking .env.local file...')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY)

/**
 * Execute SQL from seed file
 */
async function executeSeedFile() {
  try {
    console.log('📦 Reading seed file...')
    const seedPath = join(process.cwd(), 'supabase', 'seed.sql')
    const seedSQL = readFileSync(seedPath, 'utf-8')
    
    console.log('🌱 Executing seed data...')
    const { error } = await supabase.rpc('exec_sql', { sql: seedSQL })
    
    if (error) {
      console.error('❌ Error executing seed:', error)
      throw error
    }
    
    console.log('✅ Seed data executed successfully')
  } catch (err) {
    console.error('❌ Failed to execute seed file:', err)
    throw err
  }
}

/**
 * Execute SQL directly via multiple queries
 */
async function executeSeedQueries() {
  try {
    console.log('🌱 Seeding database with test data...')
    
    // Admin Users
    console.log('👤 Creating admin users...')
    await supabase.from('profiles').upsert([
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
    ])

    // Sample Products
    console.log('🎮 Creating sample products...')
    const { data: products } = await supabase.from('products').insert([
      // PS5 Games
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
    ]).select()

    // Test Customers
    console.log('👥 Creating test customers...')
    await supabase.from('profiles').upsert([
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
      }
    ])

    // Sample Game Codes (if products were created successfully)
    if (products && products.length > 0) {
      console.log('🎫 Creating sample game codes...')
      const gameCodes = []
      
      for (const product of products.slice(0, 4)) { // First 4 products
        for (let i = 1; i <= 3; i++) {
          gameCodes.push({
            product_id: product.id,
            encrypted_code: `ENC_${product.platform.toUpperCase()}_${product.name.replace(/\s/g, '').toUpperCase()}_${i.toString().padStart(3, '0')}`,
            is_sold: false
          })
        }
      }
      
      await supabase.from('game_codes').insert(gameCodes)
    }

    console.log('✅ Database seeded successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

/**
 * Verify seed data
 */
async function verifySeed() {
  try {
    console.log('🔍 Verifying seed data...')
    
    // Count records
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    const { count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    const { count: gameCodeCount } = await supabase
      .from('game_codes')
      .select('*', { count: 'exact', head: true })

    console.log('📊 Seed verification:')
    console.log(`   Products: ${productCount}`)
    console.log(`   Profiles: ${profileCount}`) 
    console.log(`   Game Codes: ${gameCodeCount}`)
    
    // Check for seed completion marker
    const { data: seedMarker } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'seed@amkstore.system')
      .single()
    
    if (seedMarker) {
      console.log('✅ Seed completion marker found')
    } else {
      console.log('⚠️  Seed completion marker not found')
    }
    
  } catch (error) {
    console.error('❌ Error verifying seed:', error)
  }
}

/**
 * Clear all seed data
 */
async function clearSeedData() {
  try {
    console.log('🧹 Clearing existing seed data...')
    
    // Delete in correct order due to foreign key constraints
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('credit_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('game_codes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Remove seed profiles (keep real auth users)
    await supabase.from('profiles').delete().in('email', [
      'admin@amkstore.dev',
      'manager@amkstore.dev',
      'customer1@test.dev',
      'customer2@test.dev',
      'customer3@test.dev',
      'customer4@test.dev',
      'customer5@test.dev',
      'seed@amkstore.system'
    ])
    
    console.log('✅ Seed data cleared')
    
  } catch (error) {
    console.error('❌ Error clearing seed data:', error)
    throw error
  }
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2] || 'seed'
  
  console.log('🌱 AMK Store v4 Database Seeding')
  console.log('================================')
  
  try {
    switch (command) {
      case 'seed':
        await executeSeedQueries()
        await verifySeed()
        break
        
      case 'reset':
        await clearSeedData()
        await executeSeedQueries()
        await verifySeed()
        break
        
      case 'clear':
        await clearSeedData()
        break
        
      case 'verify':
        await verifySeed()
        break
        
      case 'file':
        await executeSeedFile()
        await verifySeed()
        break
        
      default:
        console.log('Available commands:')
        console.log('  seed    - Seed database with test data')
        console.log('  reset   - Clear and re-seed database')
        console.log('  clear   - Clear all seed data')
        console.log('  verify  - Verify seed data')
        console.log('  file    - Execute seed.sql file')
        break
    }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Execute if called directly
if (require.main === module) {
  main()
} 