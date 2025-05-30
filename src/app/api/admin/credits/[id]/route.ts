import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Credit request processing validation schema
const processRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
  admin_notes: z.string().optional(),
})

/**
 * PATCH /api/admin/credits/[id]
 * Process a credit request (approve/reject) - Admin only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params
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

    // Parse request body
    const body = await request.json()
    const validation = processRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors,
      }, { status: 400 })
    }

    const { action, admin_notes } = validation.data

    // Get the credit request
    const { data: creditRequest, error: fetchError } = await supabase
      .from('credit_requests')
      .select('id, user_id, amount, status')
      .eq('id', requestId)
      .single()

    if (fetchError || !creditRequest) {
      return NextResponse.json({ error: 'Credit request not found' }, { status: 404 })
    }

    // Check if request is already processed
    if (creditRequest.status !== 'pending') {
      return NextResponse.json({ 
        error: `Credit request is already ${creditRequest.status}` 
      }, { status: 400 })
    }

    // Start transaction for credit request processing
    const { data: updatedRequest, error: updateError } = await supabase
      .from('credit_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        admin_notes: admin_notes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating credit request:', updateError)
      return NextResponse.json({ error: 'Failed to update credit request' }, { status: 500 })
    }

    // If approved, update user's credit balance
    if (action === 'approve') {
      const { error: balanceError } = await supabase.rpc('increment_credit_balance', {
        user_id: creditRequest.user_id,
        amount: creditRequest.amount
      })

      // If RPC doesn't exist, fall back to manual update
      if (balanceError) {
        console.log('RPC not found, using manual balance update')
        
        // Get current balance
        const { data: userProfile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('credit_balance')
          .eq('id', creditRequest.user_id)
          .single()

        if (profileFetchError) {
          console.error('Error fetching user profile:', profileFetchError)
          // Rollback the request status update
          await supabase
            .from('credit_requests')
            .update({ status: 'pending', admin_notes: null, reviewed_at: null, reviewed_by: null })
            .eq('id', requestId)
          
          return NextResponse.json({ error: 'Failed to update user balance' }, { status: 500 })
        }

        // Update balance manually
        const newBalance = (userProfile.credit_balance || 0) + creditRequest.amount
        const { error: balanceUpdateError } = await supabase
          .from('profiles')
          .update({ credit_balance: newBalance })
          .eq('id', creditRequest.user_id)

        if (balanceUpdateError) {
          console.error('Error updating credit balance:', balanceUpdateError)
          // Rollback the request status update
          await supabase
            .from('credit_requests')
            .update({ status: 'pending', admin_notes: null, reviewed_at: null, reviewed_by: null })
            .eq('id', requestId)
          
          return NextResponse.json({ error: 'Failed to update user balance' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({
      message: `Credit request ${action}d successfully`,
      request: updatedRequest
    })

  } catch (error) {
    console.error('Process credit request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/admin/credits/[id]
 * Get a specific credit request details - Admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params
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

    // Get the credit request with user details
    const { data: creditRequest, error: fetchError } = await supabase
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
        profiles!credit_requests_user_id_fkey(
          id,
          email,
          full_name,
          credit_balance
        )
      `)
      .eq('id', requestId)
      .single()

    if (fetchError || !creditRequest) {
      return NextResponse.json({ error: 'Credit request not found' }, { status: 404 })
    }

    // Transform response
    const userProfile = Array.isArray(creditRequest.profiles) ? creditRequest.profiles[0] : creditRequest.profiles
    
    const transformedRequest = {
      id: creditRequest.id,
      amount: creditRequest.amount,
      payment_method: creditRequest.payment_method,
      notes: creditRequest.notes,
      status: creditRequest.status,
      admin_notes: creditRequest.admin_notes,
      created_at: creditRequest.created_at,
      reviewed_at: creditRequest.reviewed_at,
      payment_proof_url: creditRequest.payment_proof_url,
      user: {
        id: userProfile?.id,
        email: userProfile?.email,
        full_name: userProfile?.full_name,
        credit_balance: userProfile?.credit_balance
      }
    }

    return NextResponse.json({ request: transformedRequest })

  } catch (error) {
    console.error('Get credit request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 