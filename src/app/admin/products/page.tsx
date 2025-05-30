'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { ProductsDataTable, type Product } from '@/components/admin/products-data-table'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

/**
 * Admin Products Management Page
 * Provides comprehensive CRUD operations for products
 */
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalStock: 0,
  })

  /**
   * Fetch products and statistics
   */
  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/products', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        
        // Calculate statistics
        const totalProducts = data.products?.length || 0
        const activeProducts = data.products?.filter((p: Product) => p.is_active).length || 0
        const inactiveProducts = totalProducts - activeProducts
        const totalStock = data.products?.reduce((sum: number, p: Product) => 
          sum + (p.game_codes?.[0]?.count || 0), 0) || 0

        setStats({
          total: totalProducts,
          active: activeProducts,
          inactive: inactiveProducts,
          totalStock,
        })
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to fetch products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  // Load products on component mount
  useEffect(() => {
    fetchProducts()
  }, [])

  /**
   * Handle refresh action
   */
  const handleRefresh = () => {
    fetchProducts()
    toast.success('Products refreshed')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your product catalog and inventory with full CRUD operations
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-600 mt-1">All products in catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Products</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
            <p className="text-xs text-gray-600 mt-1">Currently available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Inactive Products</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.inactive}</div>
            <p className="text-xs text-gray-600 mt-1">Temporarily disabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalStock}</div>
            <p className="text-xs text-gray-600 mt-1">Available game codes</p>
          </CardContent>
        </Card>
      </div>

      {/* Products Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Catalog</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage all products with full CRUD operations
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading products...</p>
              </div>
            </div>
          ) : (
            <ProductsDataTable 
              products={products} 
              onProductUpdate={fetchProducts}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
} 