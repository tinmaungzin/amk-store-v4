import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
// TODO: Fix encryption implementation
// import { decryptGameCode } from '@/lib/encryption'

/**
 * GET /api/admin/orders/[id]
 * Get detailed order information for admin management
 * Optimized for performance with efficient single query
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
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

    // Get order details with all related data using optimized Prisma query
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            credit_balance: true
          }
        },
        order_items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                platform: true,
                description: true
              }
            },
            game_code: {
              select: {
                id: true,
                encrypted_code: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Transform order items efficiently
    const transformedItems = order.order_items.map((item) => {
      // Show encrypted codes for admin viewing
      // TODO: Implement proper decryption when encryption is ready
      const gameCodes = item.game_code ? [
        `[ENCRYPTED: ${item.game_code.encrypted_code.substring(0, 20)}...]`
      ] : []

      return {
        id: item.id,
        product_id: item.product_id,
        product_name: item.product.name,
        platform: item.product.platform,
        description: item.product.description || '',
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        game_codes: gameCodes
      }
    })

    // Build optimized response
    const orderDetails = {
      id: order.id,
      user_id: order.user_id,
      total_amount: Number(order.total_amount),
      payment_method: order.payment_method,
      status: order.status,
      created_at: order.created_at.toISOString(),
      updated_at: order.created_at.toISOString(),
      customer_name: order.user?.full_name || null,
      customer_email: order.user?.email || null,
      customer_credit_balance: order.user?.credit_balance ? Number(order.user.credit_balance) : 0,
      items: transformedItems
    }

    return NextResponse.json(orderDetails)

  } catch (error) {
    console.error('Admin order detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 