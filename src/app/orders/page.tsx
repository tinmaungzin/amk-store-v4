/**
 * Order History Page
 * 
 * Displays user's order history with pagination, filtering, and details.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, 
  Calendar, 
  CreditCard, 
  ShoppingCart, 
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Receipt,
  LogIn
} from 'lucide-react'
import Link from 'next/link'
import { useOrders } from '@/hooks/use-orders'

interface OrderItem {
  productId: string
  productName: string
  platform: string
  quantity: number
  unitPrice: number
  gameCodes: string[]
}

interface Order {
  orderId: string
  totalAmount: number
  paymentMethod: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
  items: OrderItem[]
}

interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function OrdersPage() {
  const { fetchOrders, isFetchingOrders, error } = useOrders()
  const [ordersData, setOrdersData] = useState<OrdersResponse | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()
  
  const ordersPerPage = 10

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        console.error('❌ Auth check error:', error)
        setIsAuthenticated(false)
      } finally {
        setAuthChecked(true)
      }
    }
    
    checkAuth()
  }, [])

  // Fetch orders when authenticated and page changes
  useEffect(() => {
    if (!authChecked) {
      return // Wait for auth check to complete
    }
    if (!isAuthenticated) {
      return // Don't fetch if not authenticated
    }
    
    const loadOrders = async () => {
      const data = await fetchOrders(currentPage, ordersPerPage)
      if (data) {
        setOrdersData(data)
      }
    }

    loadOrders()
  }, [currentPage, isAuthenticated, authChecked])

  // Show loading state while checking auth or fetching orders
  const isLoading = !authChecked || (isAuthenticated && isFetchingOrders)
  
  /**
   * Handle page navigation
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Get status badge variant
   */
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
            <p className="text-gray-600">View and manage your past orders and game codes</p>
          </div>

          {/* Error State */}
          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error === 'Unauthorized' ? 
                  'Please log in to view your orders.' : 
                  `Unable to load orders: ${error}`
                }
              </AlertDescription>
            </Alert>
          )}

          {/* API Error State (when API fails but user is authenticated) */}
          {authChecked && isAuthenticated && error && !isLoading && (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Orders</h3>
                <p className="text-gray-600 mb-6">
                  There was an issue loading your order history. This might be temporary.
                </p>
                <div className="space-y-2">
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                  <div>
                    <Button variant="outline" asChild>
                      <Link href="/products">Continue Shopping</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unauthorized State */}
          {authChecked && isAuthenticated === false && (
            <Card>
              <CardContent className="text-center py-12">
                <LogIn className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
                <p className="text-gray-600 mb-6">
                  You need to be logged in to view your order history.
                </p>
                <div className="space-y-2">
                  <Button asChild>
                    <Link href="/login">
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </Link>
                  </Button>
                  <div>
                    <Button variant="outline" asChild>
                      <Link href="/products">Continue Shopping</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {authChecked && !isLoading && isAuthenticated && !error && ordersData && ordersData.orders.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-6">
                  You haven't made any purchases yet. Start shopping to see your orders here.
                </p>
                <Button asChild>
                  <Link href="/products">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Start Shopping
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Orders List */}
          {authChecked && !isLoading && isAuthenticated && !error && ordersData && ordersData.orders.length > 0 && (
            <>
              <div className="space-y-6">
                {ordersData.orders.map((order) => (
                  <Card key={order.orderId} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Order #{order.orderId.slice(-8).toUpperCase()}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(order.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4" />
                              {order.paymentMethod === 'credit' ? 'Credit Balance' : 'External Payment'}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusVariant(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          <p className="text-lg font-bold mt-1">${order.totalAmount.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Order Items */}
                        <div>
                          <h4 className="font-medium mb-2">Items ({order.items.length})</h4>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <p className="font-medium">{item.productName}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {item.platform}
                                      </Badge>
                                      <span className="text-sm text-gray-600">
                                        Qty: {item.quantity}
                                      </span>
                                      {order.status === 'completed' && (
                                        <span className="text-xs text-green-600 font-medium">
                                          {item.gameCodes.length} code{item.gameCodes.length !== 1 ? 's' : ''} delivered
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                                  <p className="text-sm text-gray-600">${item.unitPrice.toFixed(2)} each</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-gray-600">
                            {order.status === 'completed' && (
                              <span className="text-green-600 font-medium">
                                ✓ Game codes available
                              </span>
                            )}
                            {order.status === 'pending' && (
                              <span className="text-yellow-600 font-medium">
                                ⏳ Processing order
                              </span>
                            )}
                            {order.status === 'failed' && (
                              <span className="text-red-600 font-medium">
                                ✗ Order failed
                              </span>
                            )}
                          </div>
                          <Button variant="outline" asChild>
                            <Link href={`/checkout/success?orderId=${order.orderId}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {ordersData.pagination.totalPages > 1 && (
                <Card className="mt-8">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {((ordersData.pagination.page - 1) * ordersData.pagination.limit) + 1} to{' '}
                        {Math.min(ordersData.pagination.page * ordersData.pagination.limit, ordersData.pagination.total)} of{' '}
                        {ordersData.pagination.total} orders
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Previous
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {[...Array(ordersData.pagination.totalPages)].map((_, index) => {
                            const page = index + 1
                            const isCurrentPage = page === currentPage
                            
                            // Show first page, last page, current page, and pages around current
                            if (
                              page === 1 ||
                              page === ordersData.pagination.totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <Button
                                  key={page}
                                  variant={isCurrentPage ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(page)}
                                  className="w-8 h-8 p-0"
                                >
                                  {page}
                                </Button>
                              )
                            } else if (
                              page === currentPage - 2 ||
                              page === currentPage + 2
                            ) {
                              return <span key={page} className="px-1">...</span>
                            }
                            return null
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === ordersData.pagination.totalPages}
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Quick Actions */}
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/products">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Continue Shopping
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/credits">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Add Credits
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/support">
                    Get Support
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 