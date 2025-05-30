import { createClient } from '@/lib/supabase/server'
import { UserNav } from '@/components/shared/user-nav'

/**
 * Minimal admin header component that only shows user profile/logout functionality.
 * No customer navigation items (Home, Products, Cart, etc.)
 */
export async function AdminHeader() {
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
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Admin branding */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              AMK Admin Panel
            </h1>
          </div>
          
          {/* User profile dropdown */}
          <div className="flex items-center">
            {user && profile ? (
              <UserNav user={user} profile={profile} />
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
} 