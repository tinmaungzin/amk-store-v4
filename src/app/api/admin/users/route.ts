import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// User creation validation schema
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required').max(100),
  role: z.enum(['customer', 'admin', 'super_admin']),
  credit_balance: z.number().min(0, 'Credit balance must be non-negative').default(0),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

/**
 * GET /api/admin/users
 * Get all users with statistics and filtering (Admin+ only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const offset = (page - 1) * limit

    // Build base query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        credit_balance,
        role,
        is_banned,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    // Add search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    // Add role filter based on current user's permissions
    if (profile.role === 'admin') {
      // Admins can ONLY see customers (restricted access)
      query = query.eq('role', 'customer')
    } else if (profile.role === 'super_admin') {
      // Super Admins can see ALL users by default
      // But if a specific role filter is selected, apply that filter
      if (role && ['customer', 'admin', 'super_admin'].includes(role)) {
        query = query.eq('role', role)
      }
      // If no role filter specified, show ALL users (no additional filter)
    }

    // Add status filter
    if (status === 'active') {
      query = query.eq('is_banned', false)
    } else if (status === 'banned') {
      query = query.eq('is_banned', true)
    }

    // Get paginated users
    const { data: users, error: usersError } = await query
      .range(offset, offset + limit - 1)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get user counts for each user (orders and credit requests)
    const usersWithCounts = await Promise.all(
      (users || []).map(async (user) => {
        const [ordersResult, creditRequestsResult] = await Promise.all([
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('credit_requests')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
        ])

        return {
          ...user,
          _count: {
            orders: ordersResult.count || 0,
            credit_requests: creditRequestsResult.count || 0
          }
        }
      })
    )

    // Get total count for pagination
    let countQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    if (profile.role === 'admin') {
      countQuery = countQuery.eq('role', 'customer')
    } else if (profile.role === 'super_admin') {
      // Super Admins can see ALL users by default
      // But if a specific role filter is selected, apply that filter
      if (role && ['customer', 'admin', 'super_admin'].includes(role)) {
        countQuery = countQuery.eq('role', role)
      }
      // If no role filter specified, count ALL users (no additional filter)
    }

    if (status === 'active') {
      countQuery = countQuery.eq('is_banned', false)
    } else if (status === 'banned') {
      countQuery = countQuery.eq('is_banned', true)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting users:', countError)
      return NextResponse.json({ error: 'Failed to count users' }, { status: 500 })
    }

    // Get statistics (only what the current user can see)
    let statsQuery = supabase
      .from('profiles')
      .select('role, is_banned, credit_balance')

    if (profile.role === 'admin') {
      // Admins can only see customers
      statsQuery = statsQuery.eq('role', 'customer')
    }

    const { data: statsData, error: statsError } = await statsQuery

    if (statsError) {
      console.error('Error fetching statistics:', statsError)
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
    }

    // Calculate statistics
    const stats = {
      totalUsers: statsData?.length || 0,
      customers: statsData?.filter(u => u.role === 'customer').length || 0,
      admins: profile.role === 'super_admin' ? (statsData?.filter(u => u.role === 'admin').length || 0) : 0,
      superAdmins: profile.role === 'super_admin' ? (statsData?.filter(u => u.role === 'super_admin').length || 0) : 0,
      bannedUsers: statsData?.filter(u => u.is_banned).length || 0,
      totalCreditBalance: statsData?.reduce((sum, u) => sum + (u.credit_balance || 0), 0) || 0,
    }

    return NextResponse.json({
      users: usersWithCounts,
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/users
 * Create a new user (Admin+ only with role restrictions)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = createUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors,
      }, { status: 400 })
    }

    const { email, full_name, role, credit_balance, password } = validation.data

    // Check role permissions
    if (profile.role === 'admin' && role !== 'customer') {
      return NextResponse.json({
        error: 'Admins can only create customer accounts'
      }, { status: 403 })
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({
        error: 'A user with this email already exists'
      }, { status: 400 })
    }

    // Create user in Supabase Auth
    const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (authCreateError || !authData.user) {
      console.error('Error creating auth user:', authCreateError)
      return NextResponse.json({
        error: 'Failed to create user account'
      }, { status: 500 })
    }

    // Create/update profile
    const { data: newProfile, error: profileCreateError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name,
        role,
        credit_balance,
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileCreateError) {
      console.error('Error creating profile:', profileCreateError)
      
      // Cleanup: delete the auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json({
        error: 'Failed to create user profile'
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: newProfile.id,
        email: newProfile.email,
        full_name: newProfile.full_name,
        role: newProfile.role,
        credit_balance: newProfile.credit_balance,
        is_banned: newProfile.is_banned,
        created_at: newProfile.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 