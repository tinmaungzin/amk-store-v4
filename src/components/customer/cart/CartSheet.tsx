/**
 * Cart Sheet Component
 * 
 * Displays the shopping cart contents in a slide-out sheet/modal with smooth animations.
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

  // Close cart on escape key and handle body scroll
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeCart()
      }
    }

    // Close cart when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (state.isOpen && !target.closest('.cart-sheet-container')) {
        closeCart()
      }
    }

    if (state.isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      // Prevent body scroll when cart is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [state.isOpen, closeCart])

  return (
    <>
      {/* Backdrop with transparent blur overlay */}
      <div 
        className={`fixed inset-0 backdrop-blur-sm bg-black/20 z-50 transition-all duration-300 ease-in-out ${
          state.isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />
      
      {/* Cart Sheet with smooth slide - Always rendered but positioned off-screen when closed */}
      <div 
        className={`cart-sheet-container fixed right-0 top-0 h-full w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl z-50 flex flex-col transform transition-all duration-300 ease-in-out ${
          state.isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">
              Shopping Cart ({state.totalItems})
            </h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={closeCart}
            className="cursor-pointer transition-all duration-200 hover:bg-gray-200/50"
          >
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
              <Button onClick={closeCart} variant="outline" className="cursor-pointer transition-all duration-200 hover:bg-gray-50">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cart Items */}
              {state.items.map((item) => (
                <Card key={item.productId} className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
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
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer transition-all duration-200 hover:scale-110"
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
                          className="cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:scale-105"
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
                          className="cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:scale-105"
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
                  className="w-full cursor-pointer transition-all duration-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 hover:scale-[1.02]"
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
          <div className="border-t p-4 space-y-4 bg-gray-50/80 backdrop-blur-sm">
            {/* Total */}
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-green-600">${state.totalPrice.toFixed(2)}</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Link href="/checkout" className="block">
                <Button 
                  className="w-full cursor-pointer transition-all duration-200 hover:bg-blue-700 hover:scale-[1.02]" 
                  size="lg" 
                  onClick={closeCart}
                >
                  Proceed to Checkout
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:scale-[1.02]"
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