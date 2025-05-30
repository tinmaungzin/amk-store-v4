'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Home,
  Menu,
  X
} from 'lucide-react'

/**
 * Admin sidebar navigation component
 * Provides navigation for all admin functions with active state indication
 * Responsive design with mobile sheet navigation
 */
export function AdminSidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      description: 'Overview and analytics'
    },
    {
      title: 'Products',
      href: '/admin/products',
      icon: Package,
      description: 'Manage products and inventory'
    },
    {
      title: 'Orders',
      href: '/admin/orders',
      icon: ShoppingCart,
      description: 'View and manage orders'
    },
    {
      title: 'Users',
      href: '/admin/users',
      icon: Users,
      description: 'Manage customer accounts'
    },
    {
      title: 'Credit Requests',
      href: '/admin/credits',
      icon: CreditCard,
      description: 'Review credit requests'
    }
  ]

  const quickActions = [
    {
      title: 'Customer Site',
      href: '/',
      icon: Home,
      description: 'View customer website'
    }
  ]

  const SidebarContent = () => (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AMK Admin</h2>
            <p className="text-xs text-gray-500">Management Panel</p>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors shrink-0",
                  isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.title}</div>
                  <div className={cn(
                    "text-xs transition-colors truncate",
                    isActive ? "text-blue-600" : "text-gray-500"
                  )}>
                    {item.description}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <Separator className="my-4" />

        {/* Quick Actions */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Quick Actions
          </p>
          {quickActions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
              target={item.href === '/' ? '_blank' : undefined}
            >
              <item.icon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>AMK Store Admin v1.0</p>
          <p className="mt-1">© 2024 AMK Store</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SidebarContent />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-lg"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
} 