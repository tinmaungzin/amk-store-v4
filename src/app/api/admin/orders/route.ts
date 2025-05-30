import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/orders
 * Get orders with filtering, search, and pagination for admin management
 * Optimized with single Prisma query for better performance
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

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

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const paymentMethod = searchParams.get('paymentMethod') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const offset = (page - 1) * limit

    // Build filter conditions for Prisma
    const whereConditions: any = {}
    
    if (status) {
      whereConditions.status = status
    }
    
    if (paymentMethod) {
      whereConditions.payment_method = paymentMethod
    }
    
    if (dateFrom || dateTo) {
      whereConditions.created_at = {}
      if (dateFrom) {
        whereConditions.created_at.gte = new Date(dateFrom)
      }
      if (dateTo) {
        whereConditions.created_at.lte = new Date(dateTo + 'T23:59:59.999Z')
      }
    }
    
    if (search) {
      whereConditions.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { full_name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Single optimized query to get orders with related data
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              full_name: true,
              email: true
            }
          },
          order_items: {
            include: {
              product: {
                select: {
                  name: true,
                  platform: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.order.count({ where: whereConditions })
    ])

    // Get statistics in parallel
    const [completedCount, pendingCount, revenueSum] = await Promise.all([
      prisma.order.count({ where: { status: 'completed' } }),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.aggregate({
        where: { status: 'completed' },
        _sum: { total_amount: true }
      })
    ])

    // Transform the data efficiently
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      user_id: order.user_id,
      total_amount: Number(order.total_amount),
      payment_method: order.payment_method,
      status: order.status,
      created_at: order.created_at.toISOString(),
      customer_name: order.user?.full_name || null,
      customer_email: order.user?.email || null,
      items: order.order_items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product?.name || 'Unknown Product',
        platform: item.product?.platform || 'Unknown',
        quantity: item.quantity,
        unit_price: Number(item.unit_price)
      }))
    }))

    const stats = {
      totalOrders: totalCount,
      completedOrders: completedCount,
      pendingOrders: pendingCount,
      totalRevenue: Number(revenueSum._sum.total_amount || 0)
    }

    const totalPages = Math.ceil(totalCount / limit)
    const pagination = {
      page,
      limit,
      total: totalCount,
      totalPages
    }

    return NextResponse.json({
      orders: transformedOrders,
      stats,
      pagination
    })

  } catch (error) {
    console.error('Admin orders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 