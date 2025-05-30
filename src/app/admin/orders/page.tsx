'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { 
  ShoppingCart,
  Eye,
  Download,
  Filter,
  DollarSign,
  Clock,
  CheckCircle,
  Search,
  RefreshCw,
  Calendar,
  User,
  Package,
  CreditCard,
  FileText,
  X,
  Loader2
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'

interface Order {
  id: string
  user_id: string
  total_amount: number
  payment_method: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  customer_name?: string
  customer_email?: string
  items: OrderItem[]
}

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  platform: string
  quantity: number
  unit_price: number
  game_codes: string[]
}

interface OrderStats {
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  totalRevenue: number
}

interface OrderFilters {
  search: string
  status: string
  paymentMethod: string
  dateFrom: string
  dateTo: string
}

/**
 * Admin Orders Management Page
 * Comprehensive order management with filtering, search, detail view, and export
 */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [loadingDetailOrderId, setLoadingDetailOrderId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: 'all',
    paymentMethod: 'all',
    dateFrom: '',
    dateTo: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  /**
   * Fetch orders with filtering and pagination
   */
  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        status: filters.status === 'all' ? '' : filters.status,
        paymentMethod: filters.paymentMethod === 'all' ? '' : filters.paymentMethod,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      })

      const response = await fetch(`/api/admin/orders?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      setOrders(data.orders)
      setOrderStats(data.stats)
      setPagination(data.pagination)

    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Fetch individual order details
   */
  const fetchOrderDetails = async (orderId: string) => {
    try {
      setIsLoadingDetails(true)
      setLoadingDetailOrderId(orderId)
      
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch order details')
      }

      const order = await response.json()
      setSelectedOrder(order)
      setIsDetailDialogOpen(true)

    } catch (error) {
      console.error('Error fetching order details:', error)
      toast.error('Failed to load order details')
    } finally {
      setIsLoadingDetails(false)
      setLoadingDetailOrderId(null)
    }
  }

  /**
   * Export orders to CSV
   */
  const exportOrders = async () => {
    try {
      setIsExporting(true)
      
      const params = new URLSearchParams({
        search: filters.search,
        status: filters.status === 'all' ? '' : filters.status,
        paymentMethod: filters.paymentMethod === 'all' ? '' : filters.paymentMethod,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        export: 'csv'
      })

      const response = await fetch(`/api/admin/orders/export?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to export orders')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `orders-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Orders exported successfully')

    } catch (error) {
      console.error('Error exporting orders:', error)
      toast.error('Failed to export orders')
    } finally {
      setIsExporting(false)
    }
  }

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      paymentMethod: 'all',
      dateFrom: '',
      dateTo: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { variant: 'default' as const, className: 'bg-green-100 text-green-800 border-green-200', text: 'Completed' }
      case 'pending':
        return { variant: 'secondary' as const, className: 'bg-orange-100 text-orange-800 border-orange-200', text: 'Pending' }
      case 'failed':
        return { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 border-red-200', text: 'Failed' }
      default:
        return { variant: 'outline' as const, className: 'bg-gray-100 text-gray-800 border-gray-200', text: status }
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [pagination.page, filters])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage customer orders
          </p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <Button 
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button 
            variant="outline"
            onClick={exportOrders}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button
            variant="outline"
            onClick={fetchOrders}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{orderStats.totalOrders}</div>
            <p className="text-xs text-gray-600 mt-1">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{orderStats.completedOrders}</div>
            <p className="text-xs text-gray-600 mt-1">Successfully fulfilled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{orderStats.pendingOrders}</div>
            <p className="text-xs text-gray-600 mt-1">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${orderStats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-600 mt-1">From completed orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filter Orders</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Order ID, customer..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Payment</label>
                <Select value={filters.paymentMethod} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">From Date</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">To Date</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({orderStats.totalOrders})</CardTitle>
          <CardDescription>
            Customer orders and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {filters.search || filters.status !== 'all' || filters.paymentMethod !== 'all' || filters.dateFrom || filters.dateTo
                  ? 'Try adjusting your filters'
                  : 'Orders will appear here when customers make purchases'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const statusBadge = getStatusBadge(order.status)
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          #{order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customer_name || 'Unknown'}</div>
                            <div className="text-sm text-gray-600">{order.customer_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{order.items?.length || 0} items</TableCell>
                        <TableCell className="font-medium">${order.total_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {order.payment_method === 'credit' ? 'Credit' : 'External'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant} className={statusBadge.className}>
                            {statusBadge.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => fetchOrderDetails(order.id)}
                            disabled={isLoadingDetails && loadingDetailOrderId === order.id}
                            className="gap-1"
                          >
                            {isLoadingDetails && loadingDetailOrderId === order.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                            {isLoadingDetails && loadingDetailOrderId === order.id ? 'Loading...' : 'View'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} orders
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Order Details</DialogTitle>
            <DialogDescription>
              Complete order information and items
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <p className="text-gray-600">Loading order details...</p>
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Order ID</label>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded">#{selectedOrder.id}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div>
                    <Badge variant={getStatusBadge(selectedOrder.status).variant} className={getStatusBadge(selectedOrder.status).className}>
                      {getStatusBadge(selectedOrder.status).text}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Order Date</label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(selectedOrder.created_at), 'PPP')} at {format(new Date(selectedOrder.created_at), 'p')}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customer_name || 'Not provided'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customer_email}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Payment Method</label>
                    <Badge variant="outline">
                      {selectedOrder.payment_method === 'credit' ? 'Account Credit' : 'External Payment'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Total Amount</label>
                    <p className="text-lg font-semibold text-green-600">${selectedOrder.total_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Items ({selectedOrder.items?.length || 0})
                </h3>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={item.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{item.product_name}</h4>
                              <Badge variant="secondary">{item.platform}</Badge>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Quantity: {item.quantity} × ${item.unit_price.toFixed(2)} = ${(item.quantity * item.unit_price).toFixed(2)}
                            </div>
                            {item.game_codes && item.game_codes.length > 0 && (
                              <div className="mt-3">
                                <label className="text-sm font-medium text-gray-700">Game Codes:</label>
                                <div className="mt-1 space-y-1">
                                  {item.game_codes.map((code, codeIndex) => (
                                    <div key={codeIndex} className="font-mono text-xs bg-gray-50 p-2 rounded border">
                                      {code}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No items found for this order</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No order selected</h3>
              <p className="text-gray-600">
                Select an order from the table to view its details
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 