/**
 * Orders API Route
 * 
 * Handles order creation, game code assignment, and order processing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'

// Validation schemas
const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().min(1).max(10),
  })),
  paymentMethod: z.enum(['credit', 'external']).default('credit'),
})

const orderResponseSchema = z.object({
  orderId: z.string().uuid(),
  totalAmount: z.number(),
  items: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    gameCodes: z.array(z.string()).optional(), // Only included if order is completed
  })),
  status: z.enum(['pending', 'completed', 'failed']),
  createdAt: z.date(),
})

/**
 * Create a new order
 * POST /api/orders
 */
export async function POST(request: NextRequest) {
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

    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { 
        id: true, 
        credit_balance: true,
        full_name: true,
        email: true 
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)

    // Start database transaction with extended timeout
    const result = await prisma.$transaction(async (tx) => {
      // 1. Calculate order total and validate stock
      let totalAmount = 0
      const orderItems = []

      for (const item of validatedData.items) {
        // Get product details
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            _count: {
              select: {
                game_codes: {
                  where: { is_sold: false }
                }
              }
            }
          }
        })

        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }

        if (!product.is_active) {
          throw new Error(`Product ${product.name} is not available`)
        }

        // Check stock availability
        const availableStock = product._count.game_codes
        if (availableStock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`)
        }

        const itemTotal = Number(product.price) * item.quantity
        totalAmount += itemTotal

        orderItems.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          itemTotal
        })
      }

      // 2. Check user credit balance if using credit payment
      if (validatedData.paymentMethod === 'credit') {
        if (Number(profile.credit_balance) < totalAmount) {
          throw new Error(`Insufficient credit balance. Required: $${totalAmount}, Available: $${profile.credit_balance}`)
        }
      }

      // 3. Create order record
      const order = await tx.order.create({
        data: {
          user_id: user.id,
          total_amount: totalAmount,
          payment_method: validatedData.paymentMethod,
          status: 'pending',
        }
      })

      // 4. Batch process order items and game codes for better performance
      const createdOrderItems = []
      
      for (const item of orderItems) {
        // Get available game codes for this product in one query
        const availableCodes = await tx.gameCode.findMany({
          where: {
            product_id: item.productId,
            is_sold: false
          },
          take: item.quantity,
          orderBy: { created_at: 'asc' } // First-in-first-out
        })

        if (availableCodes.length < item.quantity) {
          throw new Error(`Failed to allocate game codes for ${item.productName}`)
        }

        // Batch update game codes to sold status
        const codeIds = availableCodes.map(code => code.id)
        await tx.gameCode.updateMany({
          where: {
            id: { in: codeIds }
          },
          data: {
            is_sold: true,
            sold_at: new Date(),
            order_id: order.id
          }
        })

        // Create order items for each game code
        for (let i = 0; i < item.quantity; i++) {
          const gameCode = availableCodes[i]
          
          const orderItem = await tx.orderItem.create({
            data: {
              order_id: order.id,
              product_id: item.productId,
              game_code_id: gameCode.id,
              quantity: 1, // Always 1 since each item represents one game code
              unit_price: item.unitPrice,
            },
            include: {
              product: true,
              game_code: {
                select: {
                  id: true,
                  encrypted_code: true
                }
              }
            }
          })

          createdOrderItems.push(orderItem)
        }
      }

      // 5. Deduct credit balance if using credit payment
      if (validatedData.paymentMethod === 'credit') {
        await tx.profile.update({
          where: { id: user.id },
          data: {
            credit_balance: {
              decrement: totalAmount
            }
          }
        })
      }

      // 6. Update order status to completed
      const completedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: 'completed' }
      })

      return {
        order: completedOrder,
        orderItems: createdOrderItems
      }
    }, {
      maxWait: 10000, // Maximum time to wait for a transaction slot (10s)
      timeout: 15000, // Maximum time the transaction can run (15s)
    })

    // Format response - group order items by product
    const itemsMap = new Map()
    
    result.orderItems.forEach(orderItem => {
      const key = orderItem.product_id
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          productId: orderItem.product_id,
          productName: orderItem.product.name,
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

    const response = {
      orderId: result.order.id,
      totalAmount: Number(result.order.total_amount),
      items: Array.from(itemsMap.values()),
      status: result.order.status as 'completed',
      createdAt: result.order.created_at
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Order creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get user's orders
 * GET /api/orders
 */
export async function GET(request: NextRequest) {
  // Create fresh client to avoid prepared statement conflicts in development
  const freshPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + "?prepared_statements=false"
      }
    }
  })

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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const offset = (page - 1) * limit

    // Get total count first (safer for empty state)
    const totalCount = await freshPrisma.order.count({
      where: { user_id: user.id }
    })

    // If no orders exist, return empty response immediately
    if (totalCount === 0) {
      return NextResponse.json({
        orders: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0
        }
      })
    }

    // Get user's orders with items and game codes
    const orders = await freshPrisma.order.findMany({
      where: { user_id: user.id },
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
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit
    })

    // Format response
    const formattedOrders = orders.map(order => {
      // Group order items by product
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

      return {
        orderId: order.id,
        totalAmount: Number(order.total_amount),
        paymentMethod: order.payment_method,
        status: order.status,
        createdAt: order.created_at,
        items: Array.from(itemsMap.values())
      }
    })

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Orders fetch error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await freshPrisma.$disconnect()
  }
} 