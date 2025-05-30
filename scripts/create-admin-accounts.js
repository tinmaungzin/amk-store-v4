/**
 * Script to create admin test accounts
 * Run this with: node scripts/create-admin-accounts.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const testAccounts = [
  {
    email: 'superadmin@amkstore.com',
    password: 'superadmin123',
    full_name: 'Super Administrator',
    role: 'super_admin',
    credit_balance: 1000.00
  },
  {
    email: 'admin@amkstore.com',
    password: 'admin123',
    full_name: 'Store Administrator',
    role: 'admin',
    credit_balance: 500.00
  },
  {
    email: 'customer1@test.com',
    password: 'customer123',
    full_name: 'John Doe',
    role: 'customer',
    credit_balance: 150.00
  },
  {
    email: 'customer2@test.com',
    password: 'customer123',
    full_name: 'Jane Smith',
    role: 'customer',
    credit_balance: 75.50
  },
  {
    email: 'customer3@test.com',
    password: 'customer123',
    full_name: 'Mike Johnson',
    role: 'customer',
    credit_balance: 0.00
  }
]

async function createTestAccounts() {
  console.log('🚀 Creating test accounts...\n')

  for (const account of testAccounts) {
    try {
      console.log(`Creating account for ${account.email}...`)
      
      // Create the auth user
      const { data, error } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            full_name: account.full_name,
          },
        },
      })

      if (error) {
        console.error(`❌ Failed to create ${account.email}: ${error.message}`)
        continue
      }

      if (data.user) {
        console.log(`✅ Created auth user for ${account.email}`)
        
        // Update the profile with correct role and credit balance
        // Note: The trigger should have created the profile, now we update it
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for trigger
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role: account.role,
            credit_balance: account.credit_balance
          })
          .eq('email', account.email)

        if (updateError) {
          console.error(`⚠️  Profile update failed for ${account.email}: ${updateError.message}`)
        } else {
          console.log(`✅ Updated profile for ${account.email} with role: ${account.role}`)
        }
      }
      
    } catch (err) {
      console.error(`❌ Error creating ${account.email}:`, err)
    }
    
    console.log('') // Empty line for readability
  }

  console.log('🎉 Test account creation completed!')
  console.log('\n📋 Test Credentials:')
  console.log('Super Admin: superadmin@amkstore.com / superadmin123')
  console.log('Admin: admin@amkstore.com / admin123')
  console.log('Customer 1: customer1@test.com / customer123')
  console.log('Customer 2: customer2@test.com / customer123')
  console.log('Customer 3: customer3@test.com / customer123')
  console.log('\n🔗 Login at: http://localhost:3000/login')
}

createTestAccounts().catch(console.error) 