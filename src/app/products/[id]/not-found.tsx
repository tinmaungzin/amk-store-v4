/**
 * Product Not Found Page
 * 
 * Displayed when a product with the given ID is not found.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Search } from 'lucide-react'

export default function ProductNotFound() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/products" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Products
        </Link>
      </div>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <CardTitle>Product Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              The product you're looking for doesn't exist or may have been removed.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/products" className="flex-1">
                <Button variant="outline" className="w-full">
                  Browse All Products
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button className="w-full">
                  Go Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 