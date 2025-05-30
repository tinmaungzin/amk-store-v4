import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { UserNav } from './user-nav'
import { CartButton } from '@/components/customer/cart/CartButton'

/**
 * Main navigation component that adapts based on user authentication state.
 * Shows different navigation options for guests, customers, and admins.
 */
export async function Navigation() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                AMK Store
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
              >
                Home
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Products
              </Link>
              {user && (
                <>
                  <Link
                    href="/orders"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/credits"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Credits
                  </Link>
                </>
              )}
              {profile?.role === 'admin' || profile?.role === 'super_admin' ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Admin
                </Link>
              ) : null}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <CartButton />
            {user ? (
              <UserNav user={user} profile={profile} />
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/login">
                  <Button>Get Started</Button>
                </Link>
              </div>
            )}
          </div>
          {/* Mobile menu button */}
          <div className="flex items-center space-x-2 sm:hidden">
            <CartButton />
            {user ? (
              <UserNav user={user} profile={profile} />
            ) : (
              <Link href="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 