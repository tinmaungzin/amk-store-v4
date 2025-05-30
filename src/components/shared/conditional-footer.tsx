'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './footer'

/**
 * Footer wrapper component that conditionally renders the footer.
 * Only shows on customer/user pages, hidden on admin routes.
 */
export function ConditionalFooter() {
  const pathname = usePathname()
  
  // Don't show footer on admin routes or auth pages
  if (pathname.startsWith('/admin') || 
      pathname.startsWith('/login') || 
      pathname.startsWith('/register')) {
    return null
  }

  return <Footer />
} 