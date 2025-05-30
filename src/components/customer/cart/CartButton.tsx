/**
 * Cart Button Component
 * 
 * Displays the cart icon with item count and opens the cart when clicked.
 */

'use client'

import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/contexts/CartContext'

export function CartButton() {
  const { state, toggleCart } = useCart()

  return (
    <Button
      variant="outline"
      size="sm"
      className="relative"
      onClick={toggleCart}
      aria-label={`Shopping cart with ${state.totalItems} items`}
    >
      <ShoppingCart className="h-4 w-4" />
      {state.totalItems > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {state.totalItems > 99 ? '99+' : state.totalItems}
        </Badge>
      )}
      <span className="sr-only">Cart</span>
    </Button>
  )
} 