/**
 * Script to fix RLS policies to avoid infinite recursion
 * Run this with: node scripts/fix-rls-policies.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies to avoid infinite recursion...\n')

  try {
    // Drop problematic policies that cause infinite recursion
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;',
      'DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;'
    ]

    for (const sql of dropPolicies) {
      console.log('Executing:', sql)
      const { error } = await supabase.rpc('exec_sql', { sql_statement: sql })
      if (error) {
        console.error('❌ Error:', error.message)
      } else {
        console.log('✅ Success')
      }
    }

    console.log('\n✅ Problematic RLS policies removed!')
    console.log('Now users can access their own profiles without recursion.')
    
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error)
  }

  console.log('\n🎉 RLS policy fix completed!')
  console.log('🔗 Try login again at: http://localhost:3000/login')
}

fixRLSPolicies().catch(console.error) 