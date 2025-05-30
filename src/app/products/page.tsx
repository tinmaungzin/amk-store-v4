/**
 * Enhanced Products Page
 * 
 * This page displays all available products with search, filtering, and sorting capabilities
 * using Prisma for type-safe database operations and shadcn components for UI.
 */

'use client'

import { Suspense, useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Search, Filter, SortAsc, SortDesc, ShoppingCart, Eye } from 'lucide-react'
import Link from 'next/link'
import { type ProductWithCodes } from '@/lib/prisma'
import { AddToCartButton } from '@/components/customer/cart/AddToCartButton'

// Custom hook for fetching products - will replace with actual API call
const useProductsData = () => {
  const [products, setProducts] = useState<ProductWithCodes[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        const data = await response.json()
        setProducts(data)
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return { products, isLoading }
}

/**
 * Enhanced Product card component with actions
 */
function ProductCard({ product }: { product: ProductWithCodes }) {
  const availableCodes = product._count?.game_codes || 0
  const inStock = availableCodes > 0

  return (
    <Card className={`h-full transition-all duration-200 hover:shadow-lg ${!inStock ? 'opacity-75' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <Badge variant={
            product.platform === 'PS5' ? 'default' :
            product.platform === 'Xbox' ? 'secondary' :
            product.platform === 'PC' ? 'outline' :
            'destructive'
          }>
            {product.platform}
          </Badge>
          <Badge variant={inStock ? 'default' : 'destructive'} className="ml-2">
            {inStock ? `${availableCodes} in stock` : 'Out of stock'}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2">{product.name}</CardTitle>
        <CardDescription className="line-clamp-3">
          {product.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="text-2xl font-bold text-green-600">
          ${product.price.toString()}
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <AddToCartButton
          product={{
            id: product.id,
            name: product.name,
            price: Number(product.price),
            platform: product.platform,
            image_url: product.image_url || undefined,
          }}
          availableStock={availableCodes}
          className="flex-1"
          variant={inStock ? 'default' : 'secondary'}
        />
        <Link href={`/products/${product.id}`}>
          <Button variant="outline" size="icon">
            <Eye className="w-4 h-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

/**
 * Search and Filter Controls
 */
function ProductFilters({
  searchTerm,
  setSearchTerm,
  selectedPlatform,
  setSelectedPlatform,
  sortBy,
  setSortBy,
  platforms
}: {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedPlatform: string
  setSelectedPlatform: (platform: string) => void
  sortBy: string
  setSortBy: (sort: string) => void
  platforms: string[]
}) {
  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-500" />
        <h3 className="text-lg font-semibold">Filters & Search</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Products</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="search"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Platform Filter */}
        <div className="space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger>
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {platforms.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <Label htmlFor="sort">Sort By</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
              <SelectItem value="price-desc">Price (High to Low)</SelectItem>
              <SelectItem value="stock-desc">Stock (High to Low)</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

/**
 * Products grid with enhanced filtering
 */
function ProductsGrid() {
  const { products, isLoading } = useProductsData()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [sortBy, setSortBy] = useState('name-asc')

  // Get unique platforms
  const platforms = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return []
    }
    return Array.from(new Set(products.map(p => p.platform))).sort()
  }, [products])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return []
    }
    
    let filtered = products

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Platform filter
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(product => product.platform === selectedPlatform)
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'price-asc':
          return parseFloat(a.price.toString()) - parseFloat(b.price.toString())
        case 'price-desc':
          return parseFloat(b.price.toString()) - parseFloat(a.price.toString())
        case 'stock-desc':
          return (b._count?.game_codes || 0) - (a._count?.game_codes || 0)
        case 'platform':
          return a.platform.localeCompare(b.platform)
        default:
          return 0
      }
    })

    return sorted
  }, [products, searchTerm, selectedPlatform, sortBy])

  // Group products by platform for display
  const productsByPlatform = useMemo(() => {
    return filteredAndSortedProducts.reduce((acc, product) => {
      if (!acc[product.platform]) {
        acc[product.platform] = []
      }
      acc[product.platform].push(product)
      return acc
    }, {} as Record<string, ProductWithCodes[]>)
  }, [filteredAndSortedProducts])

  if (isLoading) {
    return <ProductsLoadingSkeleton />
  }

  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No products found</h3>
        <p className="text-muted-foreground mb-4">
          The database appears to be empty. Try seeding the database with sample data.
        </p>
        <Badge variant="outline">
          Run: npm run seed:prisma
        </Badge>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProductFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedPlatform={selectedPlatform}
        setSelectedPlatform={setSelectedPlatform}
        sortBy={sortBy}
        setSortBy={setSortBy}
        platforms={platforms}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedProducts.length} of {Array.isArray(products) ? products.length : 0} products
          {searchTerm && ` for "${searchTerm}"`}
          {selectedPlatform !== 'all' && ` in ${selectedPlatform}`}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SortAsc className="w-4 h-4" />
          Sorted by: {sortBy.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </div>
      </div>

      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No products match your filters</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search term or filters to find what you're looking for.
          </p>
          <Button variant="outline" onClick={() => {
            setSearchTerm('')
            setSelectedPlatform('all')
            setSortBy('name-asc')
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(productsByPlatform).map(([platform, platformProducts]) => (
            <div key={platform}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                {platform}
                <Badge variant="secondary">
                  {platformProducts.length} {platformProducts.length === 1 ? 'product' : 'products'}
                </Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {platformProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Loading skeleton for products
 */
function ProductsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters skeleton */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      {/* Products skeleton */}
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="h-80">
                <CardHeader>
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Enhanced Products page
 */
export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Game Codes & Digital Products</h1>
        <p className="text-muted-foreground text-lg">
          Browse our collection of digital game codes for PlayStation, Xbox, PC, and more.
        </p>
      </div>
      
      <Suspense fallback={<ProductsLoadingSkeleton />}>
        <ProductsGrid />
      </Suspense>
    </div>
  )
} 