/**
 * Checkout Page
 * 
 * Displays cart items and allows users to complete their purchase.
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingBag, CreditCard, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const { state, clearCart } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  // Redirect if cart is empty
  if (state.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Add some products to your cart before proceeding to checkout.
          </p>
          <Link href="/products">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleCheckout = async () => {
    setIsProcessing(true)
    
    // Simulate checkout process
    try {
      // Here you would typically:
      // 1. Validate cart items and stock
      // 2. Process payment
      // 3. Create order in database
      // 4. Assign game codes
      // 5. Send confirmation email
      
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      // Clear cart and redirect to success page
      clearCart()
      router.push('/checkout/success')
    } catch (error) {
      console.error('Checkout error:', error)
      // Handle error (show toast, etc.)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/products" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Continue Shopping
          </Link>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">
            Review your order and complete your purchase
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Order Summary ({state.totalItems} items)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {item.platform}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)} each
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${state.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-green-600">${state.totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Complete Purchase
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    By completing your purchase, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>✓ Instant digital delivery</p>
                    <p>✓ Valid game codes guaranteed</p>
                    <p>✓ 24/7 customer support</p>
                    <p>✓ Secure payment processing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 