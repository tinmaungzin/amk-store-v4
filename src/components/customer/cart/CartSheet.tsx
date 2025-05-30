/**
 * Cart Sheet Component
 * 
 * Displays the shopping cart contents in a slide-out sheet/modal.
 */

'use client'

import { useEffect } from 'react'
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCart } from '@/contexts/CartContext'
import Link from 'next/link'

export function CartSheet() {
  const { state, closeCart, removeItem, updateQuantity, clearCart } = useCart()

  // Close cart on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeCart()
      }
    }

    if (state.isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [state.isOpen, closeCart])

  if (!state.isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50" 
        onClick={closeCart}
        aria-hidden="true"
      />
      
      {/* Cart Sheet */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="text-lg font-semibold">
              Shopping Cart ({state.totalItems})
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={closeCart}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close cart</span>
          </Button>
        </div>

        {/* Cart Contents */}
        <div className="flex-1 overflow-y-auto p-4">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-4">
                Add some products to get started!
              </p>
              <Button onClick={closeCart} variant="outline">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cart Items */}
              {state.items.map((item) => (
                <Card key={item.productId}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Product Info */}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{item.name}</h4>
                        <Badge variant="secondary" className="text-xs mb-2">
                          {item.platform}
                        </Badge>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-green-600">
                            ${item.price.toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.productId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove item</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.maxStock - item.quantity > 0 ? (
                          `${item.maxStock - item.quantity} more available`
                        ) : (
                          'Max quantity reached'
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Clear Cart Button */}
              {state.items.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-green-600">${state.totalPrice.toFixed(2)}</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Link href="/checkout" className="block">
                <Button className="w-full" size="lg" onClick={closeCart}>
                  Proceed to Checkout
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={closeCart}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
} 