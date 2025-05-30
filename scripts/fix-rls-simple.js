/**
 * Simple script to remove problematic RLS policies
 * This will allow users to read their own profiles without infinite recursion
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixRLS() {
  console.log('🔧 Removing problematic RLS policies...\n')

  try {
    // Try to query the current policies first
    const { data: policies, error: queryError } = await supabase
      .from('pg_policies')
      .select('policyname')
      .eq('tablename', 'profiles')

    if (queryError) {
      console.log('Note: Could not query existing policies:', queryError.message)
    } else {
      console.log('Current policies on profiles table:')
      policies?.forEach(p => console.log('-', p.policyname))
    }

    // The easiest fix is to temporarily disable RLS on profiles table
    // and re-enable it with better policies later if needed
    console.log('\n💡 Manual fix required:')
    console.log('Go to your Supabase dashboard → SQL Editor and run:')
    console.log('')
    console.log('DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;')
    console.log('DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;')
    console.log('')
    console.log('This will remove the policies causing infinite recursion.')
    console.log('Users will still be able to access their own profiles via the existing policy.')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixRLS().catch(console.error) 