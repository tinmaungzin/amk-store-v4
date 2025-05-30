/**
 * Order Success Page
 * 
 * Displays order confirmation with game codes and purchase details.
 * Fetches real order data from the API based on order ID.
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle2, 
  Download, 
  Copy, 
  ShoppingCart, 
  User, 
  Loader2,
  AlertCircle,
  ExternalLink 
} from 'lucide-react'
import Link from 'next/link'

interface GameCode {
  id: string
  encrypted_code: string
}

interface OrderItem {
  productId: string
  productName: string
  platform: string
  quantity: number
  unitPrice: number
  gameCodes: string[]
}

interface OrderDetails {
  orderId: string
  totalAmount: number
  paymentMethod: string
  status: string
  createdAt: string
  items: OrderItem[]
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const { clearCart } = useCart()
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedCodes, setCopiedCodes] = useState<Set<string>>(new Set())

  // Clear cart immediately when success page loads
  useEffect(() => {
    clearCart()
  }, [clearCart])

  // Fetch order details on component mount
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError('No order ID provided')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/orders/${orderId}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch order details')
        }

        const order: OrderDetails = await response.json()
        setOrderDetails(order)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load order details'
        setError(errorMessage)
        console.error('Order fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId])

  /**
   * Copy game code to clipboard
   */
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCodes(prev => new Set([...prev, code]))
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedCodes(prev => {
          const newSet = new Set(prev)
          newSet.delete(code)
          return newSet
        })
      }, 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading your order details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  Order Error
                </CardTitle>
                <CardDescription>There was a problem loading your order details.</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="mt-6 space-y-2">
                  <Button asChild>
                    <Link href="/products">Continue Shopping</Link>
                  </Button>
                  <Button variant="outline" asChild className="ml-2">
                    <Link href="/orders">View Order History</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // No order data
  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Order Not Found</CardTitle>
                <CardDescription>The requested order could not be found.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Success Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Successful!</h1>
            <p className="text-gray-600 text-lg">
              Your order has been processed and your game codes are ready
            </p>
          </div>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Summary
              </CardTitle>
              <CardDescription>
                Order #{orderDetails.orderId.slice(-8).toUpperCase()} • {new Date(orderDetails.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-bold text-lg">${orderDetails.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium">{orderDetails.paymentMethod === 'credit' ? 'Credit Balance' : 'External Payment'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={orderDetails.status === 'completed' ? 'default' : 'secondary'}>
                    {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Codes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Your Game Codes
              </CardTitle>
              <CardDescription>
                Click on any code to copy it to your clipboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {orderDetails.items.map((item, itemIndex) => (
                <div key={itemIndex} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{item.productName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{item.platform}</Badge>
                        <span className="text-sm text-gray-600">{item.quantity} code{item.quantity !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">${item.unitPrice.toFixed(2)} each</p>
                    </div>
                  </div>
                  
                  <Separator className="mb-4" />
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Game Codes:</p>
                    {item.gameCodes.map((code, codeIndex) => (
                      <div key={codeIndex} className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                        <code className="flex-1 font-mono text-sm bg-white px-2 py-1 rounded border">
                          {code}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(code)}
                          className="px-3"
                        >
                          {copiedCodes.has(code) ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>Here's what you can do with your game codes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Redeem Your Codes</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Visit the platform's official store</li>
                    <li>• Go to "Redeem Code" or "Add Funds"</li>
                    <li>• Enter your game code exactly as shown</li>
                    <li>• Follow the on-screen instructions</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Need Help?</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Codes are valid and guaranteed to work</li>
                    <li>• Save codes in a secure location</li>
                    <li>• Contact support if you have issues</li>
                    <li>• View your order history anytime</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/products">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/orders">
                <User className="w-4 h-4 mr-2" />
                View Order History
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/support">
                <ExternalLink className="w-4 h-4 mr-2" />
                Get Support
              </Link>
            </Button>
          </div>

          {/* Important Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Please save your game codes in a secure location. 
              Once you leave this page, you can access your codes again through your order history.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}

function CheckoutSuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your order details...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessLoading />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
} 