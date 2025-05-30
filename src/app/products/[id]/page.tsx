/**
 * Product Detail Page
 * 
 * Displays detailed information about a specific product
 * with purchase options and stock information.
 */

import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShoppingCart, AlertTriangle, CheckCircle, Package } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { AddToCartButton } from '@/components/customer/cart/AddToCartButton'

/**
 * Fetch product details with game codes
 */
async function getProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        game_codes: {
          where: { is_sold: false },
          select: {
            id: true,
            created_at: true,
          }
        },
        _count: {
          select: {
            game_codes: {
              where: { is_sold: false }
            }
          }
        }
      }
    })

    return product
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

/**
 * Product detail page component
 */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  const availableCodes = product._count.game_codes
  const inStock = availableCodes > 0

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link 
          href="/products" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <Badge variant={
                  product.platform === 'PS5' ? 'default' :
                  product.platform === 'Xbox' ? 'secondary' :
                  product.platform === 'PC' ? 'outline' :
                  'destructive'
                } className="text-sm">
                  {product.platform}
                </Badge>
                <Badge variant={inStock ? 'default' : 'destructive'}>
                  {inStock ? `${availableCodes} Available` : 'Out of Stock'}
                </Badge>
              </div>
              
              <CardTitle className="text-3xl mb-2">{product.name}</CardTitle>
              
              <div className="text-3xl font-bold text-green-600 mb-4">
                ${product.price.toString()}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <CardDescription className="text-base leading-relaxed">
                    {product.description}
                  </CardDescription>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Product Information</h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Platform</dt>
                      <dd className="text-sm">{product.platform}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Availability</dt>
                      <dd className="text-sm">
                        {inStock ? `${availableCodes} codes available` : 'Currently out of stock'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Delivery</dt>
                      <dd className="text-sm">Instant digital delivery</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Product Type</dt>
                      <dd className="text-sm">Digital Game Code</dd>
                    </div>
                  </dl>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <h3 className="text-lg font-semibold mb-2">How it works</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Add the product to your cart and complete checkout</li>
                    <li>Receive your game code instantly via email and account</li>
                    <li>Redeem the code on your {product.platform} platform</li>
                    <li>Start downloading and playing immediately</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Section */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Purchase Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="text-lg font-semibold">${product.price.toString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stock</span>
                    <span className={`text-sm font-medium ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                      {inStock ? `${availableCodes} available` : 'Out of stock'}
                    </span>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <AddToCartButton
                  product={{
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    platform: product.platform,
                    image_url: product.image_url || undefined,
                  }}
                  availableStock={availableCodes}
                  size="lg"
                  className="w-full"
                />

                {inStock ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="flex">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm text-green-800">
                          Instant delivery! You'll receive your code immediately after purchase.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm text-red-800">
                          This product is currently out of stock. Please check back later.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  <p>• Secure payment processing</p>
                  <p>• 24/7 customer support</p>
                  <p>• Valid codes guaranteed</p>
                </div>
              </CardContent>
            </Card>

            {/* Stock Alert */}
            {inStock && availableCodes <= 5 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">
                      Low stock! Only {availableCodes} codes remaining.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Generate metadata for the product page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return {
    title: `${product.name} - ${product.platform} | AMK Store`,
    description: product.description,
  }
} 