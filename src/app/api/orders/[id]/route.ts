/**
 * Individual Order API Route
 * 
 * Handles fetching specific order details by order ID.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * Get order details by ID
 * GET /api/orders/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params in Next.js 15
    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order details with items and game codes
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        user_id: user.id // Ensure user can only access their own orders
      },
      include: {
        order_items: {
          include: {
            product: true,
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
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Format response
    const itemsMap = new Map()
    
    order.order_items.forEach(orderItem => {
      const key = orderItem.product_id
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          productId: orderItem.product_id,
          productName: orderItem.product.name,
          platform: orderItem.product.platform,
          quantity: 0,
          unitPrice: Number(orderItem.unit_price),
          gameCodes: []
        })
      }
      
      const item = itemsMap.get(key)
      item.quantity += orderItem.quantity
      if (orderItem.game_code) {
        item.gameCodes.push(orderItem.game_code.encrypted_code)
      }
    })

    const formattedOrder = {
      orderId: order.id,
      totalAmount: Number(order.total_amount),
      paymentMethod: order.payment_method,
      status: order.status,
      createdAt: order.created_at.toISOString(),
      items: Array.from(itemsMap.values())
    }

    return NextResponse.json(formattedOrder)

  } catch (error) {
    console.error('Order fetch error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 