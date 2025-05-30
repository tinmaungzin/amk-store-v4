/**
 * Script to fix admin roles using service role key to bypass RLS
 * Run this with: node scripts/fix-admin-roles.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Need service key to bypass RLS

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables (URL or Service Role Key)')
  console.log('Make sure you have SUPABASE_SERVICE_ROLE_KEY in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixAdminRoles() {
  console.log('🔧 Fixing admin roles using service role key...\n')

  try {
    // Update superadmin role
    const { error: superAdminError } = await supabase
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('email', 'superadmin@amkstore.com')

    if (superAdminError) {
      console.error('❌ Failed to update superadmin role:', superAdminError.message)
    } else {
      console.log('✅ Updated superadmin@amkstore.com to super_admin role')
    }

    // Update admin role
    const { error: adminError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', 'admin@amkstore.com')

    if (adminError) {
      console.error('❌ Failed to update admin role:', adminError.message)
    } else {
      console.log('✅ Updated admin@amkstore.com to admin role')
    }

    // Verify the updates
    console.log('\n🔍 Verifying role updates...')
    
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('email, role')
      .in('email', ['superadmin@amkstore.com', 'admin@amkstore.com'])

    if (fetchError) {
      console.error('❌ Failed to fetch profiles:', fetchError.message)
    } else {
      console.log('\n📋 Current roles:')
      profiles?.forEach(profile => {
        console.log(`- ${profile.email}: ${profile.role}`)
      })
    }

  } catch (error) {
    console.error('❌ Error fixing admin roles:', error)
  }

  console.log('\n🎉 Admin role fix completed!')
  console.log('\n🔗 Test login at: http://localhost:3000/login')
}

fixAdminRoles().catch(console.error) 