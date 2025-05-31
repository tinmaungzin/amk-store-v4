#!/usr/bin/env tsx

/**
 * Profile Seeding Script
 * 
 * Seeds user profiles from a template JSON file.
 * Reads from scripts/templates/profiles-template.json
 * 
 * Note: This script creates profiles with auto-generated UUIDs to avoid
 * foreign key constraint issues with Supabase Auth.
 * 
 * Usage:
 *   npm run seed:profiles
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

// Load environment variables
config({ path: '.env.local' })

const prisma = new PrismaClient()

interface ProfileTemplate {
  id: string
  email: string
  full_name?: string
  credit_balance: number
  role: 'customer' | 'admin' | 'super_admin'
}

interface TemplateData {
  profiles: ProfileTemplate[]
  _instructions?: any // This should be removed before seeding
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

    // Warn if instructions are still present
    if (data._instructions) {
      console.log('⚠️  Warning: Template still contains _instructions object. You may want to remove it for cleaner data.')
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
 * Seed profiles from template
 */
async function seedProfiles(): Promise<void> {
  console.log('👤 Loading profiles from template...')
  
  const profiles = loadProfilesTemplate()
  console.log(`📁 Found ${profiles.length} profiles in template`)

  // Validate all profiles first
  console.log('🔍 Validating profile data...')
  profiles.forEach((profile, index) => validateProfile(profile, index))
  console.log('✅ All profiles validated successfully')

  // Seed profiles
  console.log('💾 Seeding profiles to database...')
  console.log('🔄 Note: Using auto-generated UUIDs to avoid foreign key constraint issues')
  
  let createdCount = 0
  let updatedCount = 0

  for (const [index, profileTemplate] of profiles.entries()) {
    try {
      // Check if profile exists by email (since we can't use template ID)
      const existingProfile = await prisma.profile.findUnique({
        where: { email: profileTemplate.email }
      })

      if (existingProfile) {
        // Update existing profile
        await prisma.profile.update({
          where: { email: profileTemplate.email },
          data: {
            full_name: profileTemplate.full_name || null,
            credit_balance: profileTemplate.credit_balance,
            role: profileTemplate.role,
            updated_at: new Date()
          }
        })
        updatedCount++
        console.log(`  ✏️  Updated: ${profileTemplate.email} (${profileTemplate.role})`)
      } else {
        // Create new profile with auto-generated UUID
        const newId = randomUUID()
        await prisma.profile.create({
          data: {
            id: newId,
            email: profileTemplate.email,
            full_name: profileTemplate.full_name || null,
            credit_balance: profileTemplate.credit_balance,
            role: profileTemplate.role
          }
        })
        createdCount++
        console.log(`  ✨ Created: ${profileTemplate.email} (${profileTemplate.role}) - ID: ${newId}`)
      }

    } catch (error) {
      console.error(`❌ Failed to seed profile #${index + 1} (${profileTemplate.email}):`)
      
      // Provide helpful error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('Foreign key constraint')) {
          console.error('   🔗 Foreign key constraint violation detected.')
          console.error('   💡 This likely means the profiles table has a foreign key to auth.users.')
          console.error('   💡 Consider creating users in Supabase Auth first, or removing the FK constraint temporarily.')
        } else if (error.message.includes('Unique constraint')) {
          console.error('   📧 Email address already exists in database.')
        } else {
          console.error('   📋 Error details:', error.message)
        }
      }
      throw error
    }
  }

  console.log('\n🎉 Profile seeding completed!')
  console.log(`   📈 Created: ${createdCount} profiles`)
  console.log(`   📝 Updated: ${updatedCount} profiles`)
  console.log(`   📊 Total: ${profiles.length} profiles processed`)
  
  if (createdCount > 0) {
    console.log('\n💡 Note: New profiles were created with auto-generated UUIDs.')
    console.log('   If you need specific UUIDs, you may need to create users in Supabase Auth first.')
  }
}

/**
 * Verify seeded profiles
 */
async function verifyProfiles(): Promise<void> {
  console.log('\n🔍 Verifying seeded profiles...')
  
  const profiles = await prisma.profile.findMany({
    orderBy: { role: 'asc' }
  })

  const roleCount = profiles.reduce((acc, profile) => {
    acc[profile.role] = (acc[profile.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log(`📊 Profile Statistics:`)
  Object.entries(roleCount).forEach(([role, count]) => {
    console.log(`   ${role}: ${count}`)
  })

  console.log('\n👥 All Profiles:')
  profiles.forEach(profile => {
    console.log(`   ${profile.email} (${profile.role}) - $${profile.credit_balance} - ID: ${profile.id}`)
  })
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    await seedProfiles()
    await verifyProfiles()
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