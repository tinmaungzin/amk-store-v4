'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserNav } from './user-nav'
import { CartButton } from '@/components/customer/cart/CartButton'
import { Menu, X } from 'lucide-react'
import { useUser } from '@/hooks/use-user'

/**
 * Main navigation component that adapts based on user authentication state.
 * Shows different navigation options for guests, customers, and admins.
 * Automatically hides on admin routes. Includes mobile hamburger menu with smooth drawer.
 */
export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, profile } = useUser()
  
  // Don't show customer navigation on admin routes
  if (pathname.startsWith('/admin')) {
    return null
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isMobileMenuOpen && !target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const navigationItems = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    ...(user ? [
      { href: '/orders', label: 'My Orders' },
      { href: '/credits', label: 'Credits' },
    ] : []),
    ...(profile?.role === 'admin' || profile?.role === 'super_admin' ? [
      { href: '/admin', label: 'Admin' }
    ] : [])
  ]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      <nav className="border-b bg-white relative z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/" className="text-xl font-bold text-gray-900">
                  AMK Store
                </Link>
              </div>
              {/* Desktop Navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'text-gray-900 border-b-2 border-blue-500'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop Actions */}
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

            {/* Mobile Actions - Reordered with hamburger on the right */}
            <div className="flex items-center space-x-2 sm:hidden">
              <CartButton />
              
              {/* Mobile User Actions */}
              {user ? (
                <UserNav user={user} profile={profile} />
              ) : (
                <Link href="/login">
                  <Button size="sm">Sign In</Button>
                </Link>
              )}

              {/* Mobile Menu Button - Rightmost */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2 cursor-pointer transition-all duration-200 hover:bg-gray-100"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer Overlay with transparent blur */}
      <div
        className={`fixed inset-0 backdrop-blur-sm bg-black/20 z-50 transition-all duration-300 ease-in-out sm:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {/* Mobile Menu Drawer */}
        <div
          className={`mobile-menu-container fixed right-0 top-0 h-full w-80 max-w-[80vw] bg-white/95 backdrop-blur-md shadow-2xl transform transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50/80 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 cursor-pointer transition-all duration-200 hover:bg-gray-200/50"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Drawer Content */}
          <div className="flex flex-col h-full">
            {/* Navigation Items */}
            <div className="flex-1 py-6">
              <div className="space-y-1 px-4">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 shadow-sm'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Drawer Footer - Guest Actions */}
            {!user && (
              <div className="border-t p-4 bg-gray-50/80 backdrop-blur-sm">
                <div className="space-y-3">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:scale-[1.02]">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full cursor-pointer transition-all duration-200 hover:bg-blue-700 hover:scale-[1.02]">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 