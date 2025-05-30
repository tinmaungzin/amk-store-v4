/**
 * Custom hook for order management
 * 
 * Provides functions to create orders and fetch order history
 * with proper error handling and loading states.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CartItem } from '@/types/cart'

interface CreateOrderRequest {
  items: Array<{
    productId: string
    quantity: number
  }>
  paymentMethod?: 'credit' | 'external'
}

interface OrderItem {
  productId: string
  productName: string
  platform: string
  quantity: number
  unitPrice: number
  gameCodes: string[]
}

interface Order {
  orderId: string
  totalAmount: number
  paymentMethod: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
  items: OrderItem[]
}

interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface CreateOrderResponse {
  orderId: string
  totalAmount: number
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    gameCodes: string[]
  }>
  status: 'completed'
  createdAt: string
}

export const useOrders = () => {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [isFetchingOrders, setIsFetchingOrders] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  /**
   * Create a new order from cart items
   * @param cartItems - Items from the shopping cart
   * @param paymentMethod - Payment method to use
   * @returns Created order data
   */
  const createOrder = async (
    cartItems: CartItem[],
    paymentMethod: 'credit' | 'external' = 'credit'
  ): Promise<CreateOrderResponse | null> => {
    setIsCreatingOrder(true)
    setError(null)

    try {
      // Transform cart items to API format
      const orderRequest: CreateOrderRequest = {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        paymentMethod
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderRequest),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const orderData: CreateOrderResponse = await response.json()
      
      // Redirect to order confirmation page
      router.push(`/checkout/success?orderId=${orderData.orderId}`)
      
      return orderData

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Order creation error:', err)
      return null
    } finally {
      setIsCreatingOrder(false)
    }
  }

  /**
   * Fetch user's order history
   * @param page - Page number for pagination
   * @param limit - Number of orders per page
   * @returns Order history data
   */
  const fetchOrders = async (
    page: number = 1,
    limit: number = 10
  ): Promise<OrdersResponse | null> => {
    setIsFetchingOrders(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      const response = await fetch(`/api/orders?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch orders')
      }

      const ordersData: OrdersResponse = await response.json()
      return ordersData

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Orders fetch error:', err)
      return null
    } finally {
      setIsFetchingOrders(false)
    }
  }

  /**
   * Calculate total from cart items
   * @param cartItems - Cart items to calculate total for
   * @returns Total amount
   */
  const calculateTotal = (cartItems: CartItem[]): number => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  /**
   * Clear any existing errors
   */
  const clearError = () => {
    setError(null)
  }

  return {
    // State
    isCreatingOrder,
    isFetchingOrders,
    error,

    // Functions
    createOrder,
    fetchOrders,
    calculateTotal,
    clearError,
  }
} 