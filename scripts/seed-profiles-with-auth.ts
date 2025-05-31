#!/usr/bin/env tsx

/**
 * Profile Seeding Script with Supabase Auth Integration
 * 
 * Seeds user profiles from a template JSON file by:
 * 1. Creating users in Supabase Auth (auth.users table)
 * 2. Creating corresponding profiles in the profiles table
 * 
 * This approach properly handles the foreign key constraint between
 * profiles.id and auth.users.id.
 * 
 * Reads from scripts/templates/profiles-template.json
 * 
 * Usage:
 *   npm run seed:profiles:auth
 */

import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Load environment variables
config({ path: '.env.local' })

const prisma = new PrismaClient()

// Initialize Supabase client for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface ProfileTemplate {
  id: string
  email: string
  full_name?: string
  credit_balance: number
  role: 'customer' | 'admin' | 'super_admin'
  password?: string // Optional password for auth user creation
}

interface TemplateData {
  profiles: ProfileTemplate[]
  _instructions?: any
}

const TEMPLATE_PATH = join(process.cwd(), 'scripts/templates/profiles-template.json')

/**
 * Load profiles from template file
 */
function loadProfilesTemplate(): ProfileTemplate[] {
  if (!existsSync(TEMPLATE_PATH)) {
    throw new Error(`Template file not found: ${TEMPLATE_PATH}`)
  }

  try {
    const rawData = readFileSync(TEMPLATE_PATH, 'utf-8')
    const data: TemplateData = JSON.parse(rawData)

    if (data._instructions) {
      console.log('⚠️  Warning: Template still contains _instructions object.')
    }

    if (!data.profiles || !Array.isArray(data.profiles)) {
      throw new Error('Template file must contain a "profiles" array')
    }

    return data.profiles
  } catch (error) {
    throw new Error(`Failed to parse template file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate profile data
 */
function validateProfile(profile: ProfileTemplate, index: number): void {
  const errors: string[] = []

  if (!profile.email || typeof profile.email !== 'string') {
    errors.push('email is required and must be a string')
  }

  if (typeof profile.credit_balance !== 'number' || profile.credit_balance < 0) {
    errors.push('credit_balance must be a non-negative number')
  }

  if (!['customer', 'admin', 'super_admin'].includes(profile.role)) {
    errors.push('role must be one of: customer, admin, super_admin')
  }

  if (errors.length > 0) {
    throw new Error(`Profile #${index + 1} validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`)
  }
}

/**
 * Create or get existing auth user
 */
async function createOrGetAuthUser(profileTemplate: ProfileTemplate): Promise<string> {
  const { email, id: templateId } = profileTemplate
  const password = profileTemplate.password || 'temp123456' // Default password
  
  try {
    // Check if user already exists in auth.users
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      throw new Error(`Failed to list existing users: ${listError.message}`)
    }

    const existingUser = existingUsers.users.find(user => user.email === email)
    
    if (existingUser) {
      console.log(`    👤 Auth user already exists: ${email} (ID: ${existingUser.id})`)
      return existingUser.id
    }

    // Create new auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: profileTemplate.full_name || null,
        role: profileTemplate.role
      }
    })

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('Auth user creation returned no user data')
    }

    console.log(`    ✨ Created auth user: ${email} (ID: ${authData.user.id})`)
    return authData.user.id

  } catch (error) {
    console.error(`    ❌ Failed to create/get auth user for ${email}:`, error)
    throw error
  }
}

/**
 * Create or update profile
 */
async function createOrUpdateProfile(profileTemplate: ProfileTemplate, authUserId: string): Promise<void> {
  const { email, full_name, credit_balance, role } = profileTemplate

  try {
    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { id: authUserId }
    })

    if (existingProfile) {
      // Update existing profile
      await prisma.profile.update({
        where: { id: authUserId },
        data: {
          email,
          full_name: full_name || null,
          credit_balance,
          role,
          updated_at: new Date()
        }
      })
      console.log(`    ✏️  Updated profile: ${email}`)
    } else {
      // Create new profile
      await prisma.profile.create({
        data: {
          id: authUserId,
          email,
          full_name: full_name || null,
          credit_balance,
          role
        }
      })
      console.log(`    ✨ Created profile: ${email}`)
    }

  } catch (error) {
    console.error(`    ❌ Failed to create/update profile for ${email}:`, error)
    throw error
  }
}

/**
 * Seed profiles with auth integration
 */
async function seedProfilesWithAuth(): Promise<void> {
  console.log('👤 Loading profiles from template...')
  
  const profiles = loadProfilesTemplate()
  console.log(`📁 Found ${profiles.length} profiles in template`)

  // Validate all profiles first
  console.log('🔍 Validating profile data...')
  profiles.forEach((profile, index) => validateProfile(profile, index))
  console.log('✅ All profiles validated successfully')

  console.log('💾 Creating auth users and profiles...')
  console.log('🔑 Note: This will create users in Supabase Auth and corresponding profiles')
  
  let authUsersCreated = 0
  let profilesCreated = 0
  let profilesUpdated = 0

  for (const [index, profileTemplate] of profiles.entries()) {
    try {
      console.log(`\n📦 Processing: ${profileTemplate.email} (${profileTemplate.role})`)

      // Step 1: Create or get auth user
      const authUserId = await createOrGetAuthUser(profileTemplate)
      
      // Step 2: Create or update profile
      const existingProfile = await prisma.profile.findUnique({
        where: { id: authUserId }
      })

      if (existingProfile) {
        await createOrUpdateProfile(profileTemplate, authUserId)
        profilesUpdated++
      } else {
        await createOrUpdateProfile(profileTemplate, authUserId)
        profilesCreated++
      }

    } catch (error) {
      console.error(`❌ Failed to process profile #${index + 1} (${profileTemplate.email}):`, error)
      throw error
    }
  }

  console.log('\n🎉 Profile seeding with auth completed!')
  console.log(`   👤 Auth users processed: ${profiles.length}`)
  console.log(`   📈 Profiles created: ${profilesCreated}`)
  console.log(`   📝 Profiles updated: ${profilesUpdated}`)
  
  console.log('\n🔐 Note: Default password "temp123456" was used for any new auth users.')
  console.log('   Users should change their passwords after first login.')
}

/**
 * Verify seeded profiles and auth users
 */
async function verifyProfilesWithAuth(): Promise<void> {
  console.log('\n🔍 Verifying seeded profiles and auth users...')
  
  const profiles = await prisma.profile.findMany({
    orderBy: { role: 'asc' }
  })

  const { data: authUsers, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('❌ Failed to fetch auth users:', error.message)
    return
  }

  const roleCount = profiles.reduce((acc, profile) => {
    acc[profile.role] = (acc[profile.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log(`📊 Profile Statistics:`)
  Object.entries(roleCount).forEach(([role, count]) => {
    console.log(`   ${role}: ${count}`)
  })

  console.log(`\n👤 Auth Users: ${authUsers.users.length}`)
  console.log(`👥 Profiles: ${profiles.length}`)

  console.log('\n📋 All Profiles with Auth Status:')
  profiles.forEach(profile => {
    const authUser = authUsers.users.find(user => user.id === profile.id)
    const authStatus = authUser ? '✅ Has Auth' : '❌ No Auth'
    console.log(`   ${profile.email} (${profile.role}) - $${profile.credit_balance} - ${authStatus}`)
  })
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    await seedProfilesWithAuth()
    await verifyProfilesWithAuth()
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
} 