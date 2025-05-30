/**
 * Database Status Page
 * 
 * This page helps test the database connection and shows the current
 * setup progress for development purposes.
 * RESTRICTED ACCESS: Admin and Super Admin only
 */

import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { db } from '@/lib/prisma'
import { AdminProtectedPage } from '@/components/auth/protected-page'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

/**
 * Get current user profile for role-based content
 */
async function getCurrentUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .single()
    
  return profile
}

/**
 * Get database connection status and counts
 */
async function getDatabaseStatus() {
  try {
    const [productCount, profileCount, gameCodeCount, orderCount, creditRequestCount] = await Promise.all([
      db.product.count().catch(() => 0),
      db.profile.count().catch(() => 0),
      db.gameCode.count().catch(() => 0),
      db.order.count().catch(() => 0),
      db.creditRequest.count().catch(() => 0),
    ])

    return {
      connected: true,
      counts: {
        products: productCount,
        profiles: profileCount,
        gameCodes: gameCodeCount,
        orders: orderCount,
        creditRequests: creditRequestCount
      }
    }
  } catch (error) {
    console.error('Database connection error:', error)
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      counts: {
        products: 0,
        profiles: 0,
        gameCodes: 0,
        orders: 0,
        creditRequests: 0
      }
    }
  }
}

/**
 * Database status component for admins
 */
async function DatabaseStatusCard() {
  const [status, userProfile] = await Promise.all([
    getDatabaseStatus(),
    getCurrentUserProfile()
  ])

  const isSuperAdmin = userProfile?.role === 'super_admin'

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Admin Access</CardTitle>
          <CardDescription className="text-blue-700">
            You are logged in as: <strong>{userProfile?.full_name}</strong> ({userProfile?.email})
            <Badge variant="default" className="ml-2">
              {userProfile?.role?.replace('_', ' ').toUpperCase()}
            </Badge>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Database Connection
            <Badge variant={status.connected ? 'default' : 'destructive'}>
              {status.connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {status.connected 
              ? 'Successfully connected to the database'
              : 'Unable to connect to the database'
            }
          </CardDescription>
        </CardHeader>
        {!status.connected && (
          <CardContent>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h4 className="font-semibold text-destructive mb-2">Connection Error</h4>
              <p className="text-sm text-destructive/80 mb-4">{status.error}</p>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>To fix this:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Check your DATABASE_URL in .env.local</li>
                  <li>Verify the connection string from your Supabase dashboard</li>
                  <li>Run <code>npm run prisma:generate</code></li>
                  {isSuperAdmin && <li>Run <code>npm run seed:prisma</code> to populate data</li>}
                </ol>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {status.connected && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.counts.products}</div>
              <p className="text-xs text-muted-foreground">Game codes and digital products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.counts.profiles}</div>
              <p className="text-xs text-muted-foreground">Customer and admin profiles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Game Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.counts.gameCodes}</div>
              <p className="text-xs text-muted-foreground">Available and sold codes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.counts.orders}</div>
              <p className="text-xs text-muted-foreground">Completed transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Credit Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.counts.creditRequests}</div>
              <p className="text-xs text-muted-foreground">Payment submissions</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Database Setup Status</CardTitle>
          <CardDescription>System setup progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={status.connected ? 'default' : 'secondary'}>1</Badge>
              <span className="text-sm">Database connection configured</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.counts.products > 0 ? 'default' : 'secondary'}>2</Badge>
              <span className="text-sm">Database populated with sample data</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.counts.profiles > 0 ? 'default' : 'secondary'}>3</Badge>
              <span className="text-sm">Test users and admins created</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button asChild size="sm">
              <Link href="/products">View Products</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">Admin Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Super Admin Only - Seeding Instructions */}
      {isSuperAdmin && status.connected && status.counts.products === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Super Admin: Database Seeding</CardTitle>
            <CardDescription className="text-amber-700">
              Database is connected but empty. Only Super Admins can run seeding commands.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono mb-3">
              npm run seed:prisma
            </div>
            <p className="text-sm text-amber-700 mb-3">
              This will create sample products, users, game codes, and test data for development.
            </p>
            <div className="bg-amber-100 border border-amber-300 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Super Admin Access:</strong> This command and database seeding capabilities 
                are only visible to Super Admin users for security reasons.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Users Information for Admins */}
      {status.connected && status.counts.profiles > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Test Users Available</CardTitle>
            <CardDescription className="text-green-700">
              Sample users have been created for testing different roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-green-800 mb-2">Admin Accounts:</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• <strong>Super Admin:</strong> superadmin@amkstore.com</li>
                  <li>• <strong>Admin:</strong> admin@amkstore.com</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-2">Test Customers:</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• customer1@test.com ($150 credit)</li>
                  <li>• customer2@test.com ($75.50 credit)</li>
                  <li>• customer3@test.com ($0 credit)</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>🔒 Note:</strong> These test credentials are for development only. 
                In production, use proper authentication flows.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Loading component
 */
function DatabaseStatusSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/**
 * Database Status Page - Admin Only
 */
export default function DatabaseStatusPage() {
  return (
    <AdminProtectedPage>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Database Status</h1>
          <p className="text-muted-foreground mt-2">
            Database connection status and system information (Admin Access Only)
          </p>
        </div>

        <Suspense fallback={<DatabaseStatusSkeleton />}>
          <DatabaseStatusCard />
        </Suspense>
      </div>
    </AdminProtectedPage>
  )
} 