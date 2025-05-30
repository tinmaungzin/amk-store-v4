/**
 * Checkout Success Page
 * 
 * Displays confirmation after successful purchase.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Download, Mail, Home } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            Purchase Successful!
          </h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your game codes are ready!
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 text-left">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Email Confirmation</h4>
                <p className="text-sm text-muted-foreground">
                  You'll receive an email with your game codes and purchase details within a few minutes.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 text-left">
              <Download className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Access Your Codes</h4>
                <p className="text-sm text-muted-foreground">
                  Your game codes are also available in your account under "My Orders".
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 text-left">
              <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Redeem & Play</h4>
                <p className="text-sm text-muted-foreground">
                  Follow the instructions in your email to redeem your codes on the respective platforms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/orders" className="block">
            <Button className="w-full" size="lg">
              <Download className="w-4 h-4 mr-2" />
              View My Orders
            </Button>
          </Link>
          
          <Link href="/products" className="block">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
          
          <Link href="/" className="block">
            <Button variant="ghost" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@amkstore.com" className="text-blue-600 hover:underline">
              support@amkstore.com
            </a>
            {' '}or visit our help center.
          </p>
        </div>
      </div>
    </div>
  )
} 