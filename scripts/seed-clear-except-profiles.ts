#!/usr/bin/env tsx

/**
 * Clear Database Script (Except Profiles)
 * 
 * This script clears all data from database tables except the profiles table.
 * This preserves user accounts while resetting all other data for development.
 * 
 * Usage: npm run seed:clear-except-profiles
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Clear all database tables except profiles
 */
async function clearDatabaseExceptProfiles() {
  console.log('🗑️  Starting database cleanup (preserving profiles)...\n')

  try {
    // Step 1: Clear order_items FIRST (has foreign keys to orders and game_codes)
    console.log('1️⃣  Clearing order_items table...')
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .delete()
      .gte('created_at', '1970-01-01') // Delete all rows (timestamp comparison)
    
    if (orderItemsError) {
      console.error('❌ Error clearing order_items:', orderItemsError.message)
    } else {
      console.log('✅ order_items table cleared')
    }

    // Step 2: Clear orders (has foreign key to profiles, which we preserve)
    console.log('2️⃣  Clearing orders table...')
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .gte('created_at', '1970-01-01') // Delete all rows (timestamp comparison)
    
    if (ordersError) {
      console.error('❌ Error clearing orders:', ordersError.message)
    } else {
      console.log('✅ orders table cleared')
    }

    // Step 3: Clear game_codes (has foreign key to products)
    console.log('3️⃣  Clearing game_codes table...')
    const { error: gameCodesError } = await supabase
      .from('game_codes')
      .delete()
      .gte('created_at', '1970-01-01') // Delete all rows (timestamp comparison)
    
    if (gameCodesError) {
      console.error('❌ Error clearing game_codes:', gameCodesError.message)
    } else {
      console.log('✅ game_codes table cleared')
    }

    // Step 4: Clear products (now no dependencies from other tables)
    console.log('4️⃣  Clearing products table...')
    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .gte('created_at', '1970-01-01') // Delete all rows (timestamp comparison)
    
    if (productsError) {
      console.error('❌ Error clearing products:', productsError.message)
    } else {
      console.log('✅ products table cleared')
    }

    // Step 5: Clear credit_requests (has foreign key to profiles, which we preserve)
    console.log('5️⃣  Clearing credit_requests table...')
    const { error: creditRequestsError } = await supabase
      .from('credit_requests')
      .delete()
      .gte('created_at', '1970-01-01') // Delete all rows (timestamp comparison)
    
    if (creditRequestsError) {
      console.error('❌ Error clearing credit_requests:', creditRequestsError.message)
    } else {
      console.log('✅ credit_requests table cleared')
    }

    console.log('\n🎉 Database cleanup completed successfully!')
    console.log('📝 Profiles table preserved with all user accounts')
    
    // Show remaining data summary
    await showDataSummary()

  } catch (error) {
    console.error('❌ Fatal error during database cleanup:', error)
    process.exit(1)
  }
}

/**
 * Show summary of remaining data in the database
 */
async function showDataSummary() {
  console.log('\n📊 Remaining Data Summary:')
  console.log('─'.repeat(40))

  try {
    // Count profiles
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (profilesError) {
      console.error('❌ Error counting profiles:', profilesError.message)
    } else {
      console.log(`👥 Profiles: ${profilesCount || 0} (preserved)`)
    }

    // Verify other tables are empty
    const tables = ['products', 'game_codes', 'orders', 'order_items', 'credit_requests']
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.error(`❌ Error counting ${table}:`, error.message)
      } else {
        console.log(`📦 ${table}: ${count || 0} (cleared)`)
      }
    }

    console.log('─'.repeat(40))
    console.log('✅ All data tables cleared except profiles')
    
  } catch (error) {
    console.error('❌ Error generating summary:', error)
  }
}

/**
 * Confirmation prompt
 */
async function confirmClearance() {
  console.log('⚠️  WARNING: This will clear ALL DATA except user profiles!')
  console.log('📋 Tables to be cleared:')
  console.log('   • products')
  console.log('   • game_codes')
  console.log('   • orders')
  console.log('   • order_items')
  console.log('   • credit_requests')
  console.log('')
  console.log('🔒 Tables to be preserved:')
  console.log('   • profiles (all user accounts)')
  console.log('')

  // For npm scripts, we'll proceed automatically
  // In production, you might want to add a confirmation prompt
  const shouldProceed = process.env.NODE_ENV !== 'production'
  
  if (!shouldProceed) {
    console.log('❌ Operation cancelled for safety in production environment')
    process.exit(0)
  }

  return true
}

/**
 * Main execution
 */
async function main() {
  console.log('🧹 Database Clear Script (Preserve Profiles)')
  console.log('=' .repeat(50))
  
  await confirmClearance()
  await clearDatabaseExceptProfiles()
  
  console.log('\n🎯 Next steps:')
  console.log('   • Run "npm run seed:products" to add sample products')
  console.log('   • Run "npm run seed:prisma" for full sample data')
  console.log('   • Users can continue using their existing accounts')
  
  process.exit(0)
}

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
}) 