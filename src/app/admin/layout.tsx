import { AdminProtectedPage } from '@/components/auth/protected-page'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { UserProvider } from '@/hooks/use-user'

/**
 * Admin layout component
 * Provides a consistent layout for all admin pages with sidebar navigation and admin header
 * Responsive design that adapts to desktop and mobile viewports
 * Completely separate from customer interface - no cart, customer navigation, etc.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminProtectedPage>
      <UserProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="flex h-screen">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <AdminHeader />
              <main className="flex-1 overflow-y-auto">
                <div className="p-4 lg:p-6">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </div>
      </UserProvider>
    </AdminProtectedPage>
  )
} 