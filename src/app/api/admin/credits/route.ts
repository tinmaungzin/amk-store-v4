import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/credits
 * Get all credit requests with statistics (Admin only)
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
    const status = searchParams.get('status')
    const offset = (page - 1) * limit

    // Build query conditions
    let query = supabase
      .from('credit_requests')
      .select(`
        id,
        amount,
        payment_method,
        notes,
        status,
        admin_notes,
        created_at,
        reviewed_at,
        payment_proof_url,
        user_id,
        profiles!credit_requests_user_id_fkey(
          id,
          email,
          full_name,
          credit_balance
        )
      `)
      .order('created_at', { ascending: false })

    // Add status filter if provided
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status)
    }

    // Get paginated requests
    const { data: requests, error: requestsError } = await query
      .range(offset, offset + limit - 1)

    if (requestsError) {
      console.error('Error fetching credit requests:', requestsError)
      return NextResponse.json({ error: 'Failed to fetch credit requests' }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('credit_requests')
      .select('*', { count: 'exact', head: true })

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting credit requests:', countError)
      return NextResponse.json({ error: 'Failed to count credit requests' }, { status: 500 })
    }

    // Get statistics
    const { data: statsData, error: statsError } = await supabase
      .from('credit_requests')
      .select('amount, status')

    if (statsError) {
      console.error('Error fetching statistics:', statsError)
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
    }

    // Calculate statistics
    const stats = {
      totalRequests: statsData?.length || 0,
      pendingRequests: statsData?.filter(r => r.status === 'pending').length || 0,
      approvedRequests: statsData?.filter(r => r.status === 'approved').length || 0,
      rejectedRequests: statsData?.filter(r => r.status === 'rejected').length || 0,
      totalAmountRequested: statsData?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
      totalAmountApproved: statsData?.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
    }

    // Transform requests to include user data
    const transformedRequests = requests?.map(request => ({
      id: request.id,
      amount: request.amount,
      payment_method: request.payment_method,
      notes: request.notes,
      status: request.status,
      admin_notes: request.admin_notes,
      created_at: request.created_at,
      reviewed_at: request.reviewed_at,
      payment_proof_url: request.payment_proof_url,
      user: {
        id: request.profiles.id,
        email: request.profiles.email,
        full_name: request.profiles.full_name,
        credit_balance: request.profiles.credit_balance
      }
    })) || []

    return NextResponse.json({
      requests: transformedRequests,
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Admin credits API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 