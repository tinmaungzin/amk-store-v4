/**
 * User Profile API Route
 * 
 * Handles fetching and updating user profile information.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFreshPrismaClient } from '@/lib/prisma'

/**
 * Get user profile information
 * GET /api/user/profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get fresh Prisma client
    const prisma = getFreshPrismaClient()
    
    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        credit_balance: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    })

    // Clean up the connection
    await prisma.$disconnect()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Format response
    const response = {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      credit_balance: Number(profile.credit_balance),
      role: profile.role,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Profile fetch error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 