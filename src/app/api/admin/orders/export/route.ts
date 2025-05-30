import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/orders/export
 * Export orders to CSV format with filtering support
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
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const paymentMethod = searchParams.get('paymentMethod') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    // Build base query
    let query = supabase
      .from('orders')
      .select(`
        id,
        user_id,
        total_amount,
        payment_method,
        status,
        created_at,
        profiles!orders_user_id_fkey(
          full_name,
          email
        )
      `)

    // Apply filters
    if (search) {
      query = query.or(
        `id.ilike.%${search}%,profiles.full_name.ilike.%${search}%,profiles.email.ilike.%${search}%`
      )
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59.999Z')
    }

    // Execute query (no limit for export)
    const { data: orders, error: ordersError } = await query
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders for export:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Get order items count for each order
    const orderIds = orders?.map(order => order.id) || []
    const { data: orderItemsCount } = await supabase
      .from('order_items')
      .select('order_id, quantity')
      .in('order_id', orderIds)

    // Create CSV headers
    const csvHeaders = [
      'Order ID',
      'Customer Name',
      'Customer Email',
      'Items Count',
      'Total Amount',
      'Payment Method',
      'Status',
      'Order Date'
    ]

    // Create CSV rows
    const csvRows = orders?.map(order => {
      // Calculate items count from the separately fetched order items data
      const itemsCount = orderItemsCount?.filter(item => item.order_id === order.id)
        .reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
      const userProfile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles
      
      return [
        order.id,
        userProfile?.full_name || 'N/A',
        userProfile?.email || 'N/A',
        itemsCount.toString(),
        order.total_amount.toFixed(2),
        order.payment_method,
        order.status,
        new Date(order.created_at).toLocaleDateString()
      ]
    }) || []

    // Combine headers and rows
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n')

    // Create response with CSV content
    const response = new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

    return response

  } catch (error) {
    console.error('Orders export API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 