/**
 * Quick script to check current user roles
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRoles() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .in('email', ['superadmin@amkstore.com', 'admin@amkstore.com'])

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Current roles:')
    profiles?.forEach(p => console.log(`${p.email}: ${p.role} (ID: ${p.id})`))
  }
}

checkRoles() 