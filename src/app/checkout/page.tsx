/**
 * Checkout Page
 * 
 * Handles order processing with real API integration,
 * credit validation, and order confirmation.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { useOrders } from '@/hooks/use-orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ShoppingCart, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPage() {
  const router = useRouter()
  const { state: cartState, clearCart } = useCart()
  const { createOrder, isCreatingOrder, error, clearError } = useOrders()
  const [userProfile, setUserProfile] = useState<{ credit_balance: number; full_name: string } | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  const { items } = cartState

  // Calculate totals from cart items
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.0875 // 8.75% tax rate
  const total = subtotal + tax

  const totals = {
    subtotal,
    tax,
    total
  }

  // Fetch user profile to check credit balance
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const profile = await response.json()
          setUserProfile(profile)
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchUserProfile()
  }, [])

  // Redirect if cart is empty (but not during order processing)
  useEffect(() => {
    // Only redirect if cart is empty AND we're not currently processing an order
    // Check if we have items or if profile is still loading
    if (items.length === 0 && !isLoadingProfile) {
      // Add a small delay to prevent race condition with cart clearing
      const timeoutId = setTimeout(() => {
        router.push('/products')
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [items.length, isLoadingProfile, router])

  /**
   * Handle order submission
   */
  const handlePlaceOrder = async () => {
    clearError()
    
    try {
      const orderData = await createOrder(items, 'credit')
      
      if (orderData) {
        // Navigation is handled by the useOrders hook
        // Cart will be cleared after successful navigation
        // Don't clear cart here to prevent race condition with redirect useEffect
      }
    } catch (error) {
      console.error('Order placement failed:', error)
    }
  }

  // Show loading if cart is empty or profile is loading
  if (items.length === 0 || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading checkout...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const hasInsufficientCredit = userProfile && userProfile.credit_balance < totals.total

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
            <p className="text-gray-600">Review your order and complete your purchase</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Order Summary ({items.length} item{items.length !== 1 ? 's' : ''})
                  </CardTitle>
                  <CardDescription>
                    Review the items in your order
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.platform}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Credit Balance Info */}
              {userProfile && (
                <Card className={hasInsufficientCredit ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Credit Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">Available Credit:</span>
                      <span className="text-lg font-bold">${userProfile.credit_balance.toFixed(2)}</span>
                    </div>
                    {hasInsufficientCredit && (
                      <Alert className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Insufficient credit balance. You need ${(totals.total - userProfile.credit_balance).toFixed(2)} more to complete this order.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Payment Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${totals.tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${totals.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Payment Method: Credit Balance
                    </p>
                    
                    {/* Error Display */}
                    {error && (
                      <Alert className="mb-4" variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      onClick={handlePlaceOrder}
                      // @ts-expect-error - isCreatingOrder can be null from useOrders hook
                      disabled={Boolean(isCreatingOrder) || hasInsufficientCredit}
                      className="w-full"
                      size="lg"
                    >
                      {isCreatingOrder ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing Order...
                        </>
                      ) : hasInsufficientCredit ? (
                        'Insufficient Credit'
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Place Order - ${totals.total.toFixed(2)}
                        </>
                      )}
                    </Button>

                    {hasInsufficientCredit && (
                      <div className="mt-4 space-y-2">
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/credits">Add Credits</Link>
                        </Button>
                        <p className="text-xs text-center text-gray-500">
                          You can add credits to your account and return to complete your order
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/products">Continue Shopping</Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              {/* Security Notice */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 mx-auto mb-2 text-green-600" />
                    <p className="font-medium mb-1">Secure Checkout</p>
                    <p>Your game codes will be delivered instantly after payment confirmation.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 