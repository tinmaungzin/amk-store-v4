'use client'

import { usePathname } from 'next/navigation'
import { CartProvider } from '@/contexts/CartContext'
import { CartSheet } from '@/components/customer/cart/CartSheet'

/**
 * Conditional cart provider that only applies cart functionality to non-admin routes.
 * Admin routes don't need cart functionality.
 */
export function ConditionalCartProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const pathname = usePathname()
  
  // Check if current route is an admin route
  const isAdminRoute = pathname.startsWith('/admin')
  
  if (isAdminRoute) {
    // Admin routes: no cart functionality needed
    return <>{children}</>
  }
  
  // Customer routes: include cart provider and cart sheet
  return (
    <CartProvider>
      {children}
      <CartSheet />
    </CartProvider>
  )
} 