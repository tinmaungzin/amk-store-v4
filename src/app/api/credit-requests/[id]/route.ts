import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/credit-requests/[id]
 * Get individual credit request details including payment proof
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get credit request details
    const { data: creditRequest, error: requestError } = await supabase
      .from('credit_requests')
      .select(`
        id,
        amount,
        payment_method,
        notes,
        status,
        admin_notes,
        payment_proof_url,
        created_at,
        reviewed_at,
        reviewed_by,
        profiles!reviewed_by (
          full_name
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only access their own requests
      .single()

    if (requestError) {
      if (requestError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Credit request not found' }, { status: 404 })
      }
      console.error('Error fetching credit request:', requestError)
      return NextResponse.json({ error: 'Failed to fetch credit request' }, { status: 500 })
    }

    // Transform the response
    const reviewerProfile = Array.isArray(creditRequest.profiles) ? creditRequest.profiles[0] : creditRequest.profiles
    
    const response = {
      id: creditRequest.id,
      amount: creditRequest.amount,
      payment_method: creditRequest.payment_method,
      notes: creditRequest.notes,
      status: creditRequest.status,
      admin_notes: creditRequest.admin_notes,
      payment_proof_url: creditRequest.payment_proof_url,
      created_at: creditRequest.created_at,
      reviewed_at: creditRequest.reviewed_at,
      reviewed_by: creditRequest.reviewed_by,
      reviewer_name: reviewerProfile?.full_name || null
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get credit request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 