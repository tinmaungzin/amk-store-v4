import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Users, 
  Package, 
  ShoppingCart, 
  CreditCard,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

/**
 * Admin Dashboard Page
 * Provides overview statistics and quick actions for admin users
 */
export default async function AdminPage() {
  const supabase = await createClient()
  
  // Get basic stats for the admin dashboard
  const [
    { count: userCount },
    { count: productCount },
    { count: orderCount },
    { count: pendingCreditRequests },
    { count: gameCodes },
    { count: soldCodes }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('credit_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('game_codes').select('*', { count: 'exact', head: true }),
    supabase.from('game_codes').select('*', { count: 'exact', head: true }).eq('is_sold', true)
  ])

  const availableCodes = (gameCodes || 0) - (soldCodes || 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to the AMK Store admin panel. Here you can manage products, view orders, and monitor your store&apos;s performance.
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{userCount || 0}</div>
            <p className="text-xs text-gray-600 mt-1">Registered customers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{productCount || 0}</div>
            <p className="text-xs text-gray-600 mt-1">Available products</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{orderCount || 0}</div>
            <p className="text-xs text-gray-600 mt-1">Completed orders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{pendingCreditRequests || 0}</div>
            <p className="text-xs text-gray-600 mt-1">Require review</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Game Code Inventory</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Codes</span>
                <span className="text-lg font-semibold">{gameCodes || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sold</span>
                <span className="text-lg font-semibold text-red-600">{soldCodes || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available</span>
                <span className="text-lg font-semibold text-green-600">{availableCodes}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Authentication</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment System</span>
                <span className="text-sm font-medium text-green-600">Ready</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <p className="text-sm text-gray-600">
            Common administrative tasks to get you started.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 px-6">
              <Link href="/admin/products" className="flex flex-col items-center space-y-2">
                <Package className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Manage Products</div>
                  <div className="text-xs opacity-80">Add, edit, or remove products</div>
                </div>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto py-4 px-6">
              <Link href="/admin/orders" className="flex flex-col items-center space-y-2">
                <ShoppingCart className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">View Orders</div>
                  <div className="text-xs opacity-80">Monitor recent orders</div>
                </div>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto py-4 px-6">
              <Link href="/admin/credits" className="flex flex-col items-center space-y-2">
                <CreditCard className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Credit Requests</div>
                  <div className="text-xs opacity-80">Review pending requests</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 