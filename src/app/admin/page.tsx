import { AdminProtectedPage } from '@/components/auth/protected-page'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminPage() {
  const supabase = await createClient()
  
  // Get some basic stats for the admin dashboard
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  const { count: pendingCreditRequests } = await supabase
    .from('credit_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <AdminProtectedPage>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userCount || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productCount || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderCount || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Credit Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCreditRequests || 0}</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Welcome to the admin dashboard! This is where you can manage products, users, orders, and credit requests.
                More features will be added as we develop the system.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminProtectedPage>
  )
} 