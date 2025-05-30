import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Ban action validation schema
const banActionSchema = z.object({
  action: z.enum(['ban', 'unban'])
})

/**
 * PATCH /api/admin/users/[id]/ban
 * Ban or unban a user (Admin+ only with role restrictions)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params
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
    const validation = banActionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid action',
        details: validation.error.errors,
      }, { status: 400 })
    }

    const { action } = validation.data

    // Get target user details
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_banned')
      .eq('id', targetUserId)
      .single()

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permissions: 
    // - Admins can only ban/unban customers
    // - Super admins can ban/unban anyone except themselves for critical actions
    // - No one can ban/unban themselves
    if (targetUser.id === user.id) {
      return NextResponse.json({
        error: 'You cannot ban/unban yourself'
      }, { status: 403 })
    }

    if (profile.role === 'admin' && targetUser.role !== 'customer') {
      return NextResponse.json({
        error: 'Admins can only ban/unban customer accounts'
      }, { status: 403 })
    }

    // Check current ban status
    const newBanStatus = action === 'ban'
    if (targetUser.is_banned === newBanStatus) {
      return NextResponse.json({
        error: `User is already ${newBanStatus ? 'banned' : 'active'}`
      }, { status: 400 })
    }

    // Update user ban status
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update({
        is_banned: newBanStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)
      .select('id, email, full_name, role, is_banned, updated_at')
      .single()

    if (updateError) {
      console.error('Error updating user ban status:', updateError)
      return NextResponse.json({
        error: 'Failed to update user status'
      }, { status: 500 })
    }

    // Log the action (you could extend this to create an audit trail)
    console.log(`User ${action}ned:`, {
      adminId: user.id,
      adminEmail: user.email,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      action,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      message: `User ${action}ned successfully`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        role: updatedUser.role,
        is_banned: updatedUser.is_banned,
        updated_at: updatedUser.updated_at
      }
    })

  } catch (error) {
    console.error('Ban/unban user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 