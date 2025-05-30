/**
 * Unit tests for useOrders hook
 * 
 * Tests order creation, fetching, and error handling functionality.
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useOrders } from '../use-orders'
import { CartItem } from '@/types/cart'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch globally
global.fetch = jest.fn()

const mockRouter = {
  push: jest.fn(),
}

const mockCartItems: CartItem[] = [
  {
    id: '1',
    productId: 'product-1',
    name: 'Roblox Gift Card $10',
    price: 10.00,
    platform: 'Roblox',
    quantity: 2,
    maxStock: 5,
  },
  {
    id: '2',
    productId: 'product-2',
    name: 'PlayStation Store $25',
    price: 25.00,
    platform: 'PS5',
    quantity: 1,
    maxStock: 3,
  }
]

describe('useOrders Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(fetch as jest.Mock).mockClear()
  })

  describe('createOrder', () => {
    it('should create order successfully and redirect to success page', async () => {
      const mockOrderResponse = {
        orderId: 'order-123',
        totalAmount: 45.00,
        items: [
          {
            productId: 'product-1',
            productName: 'Roblox Gift Card $10',
            quantity: 2,
            unitPrice: 10.00,
            gameCodes: ['CODE1', 'CODE2']
          },
          {
            productId: 'product-2',
            productName: 'PlayStation Store $25',
            quantity: 1,
            unitPrice: 25.00,
            gameCodes: ['CODE3']
          }
        ],
        status: 'completed',
        createdAt: new Date().toISOString()
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrderResponse,
      })

      const { result } = renderHook(() => useOrders())

      let orderResult: any
      await act(async () => {
        orderResult = await result.current.createOrder(mockCartItems, 'credit')
      })

      expect(fetch).toHaveBeenCalledWith('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            { productId: 'product-1', quantity: 2 },
            { productId: 'product-2', quantity: 1 }
          ],
          paymentMethod: 'credit'
        }),
      })

      expect(orderResult).toEqual(mockOrderResponse)
      expect(mockRouter.push).toHaveBeenCalledWith('/checkout/success?orderId=order-123')
      expect(result.current.isCreatingOrder).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle order creation failure', async () => {
      const mockErrorResponse = {
        error: 'Insufficient credit balance'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      })

      const { result } = renderHook(() => useOrders())

      let orderResult: any
      await act(async () => {
        orderResult = await result.current.createOrder(mockCartItems, 'credit')
      })

      expect(orderResult).toBeNull()
      expect(result.current.error).toBe('Insufficient credit balance')
      expect(result.current.isCreatingOrder).toBe(false)
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('should handle network errors during order creation', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useOrders())

      let orderResult: any
      await act(async () => {
        orderResult = await result.current.createOrder(mockCartItems, 'credit')
      })

      expect(orderResult).toBeNull()
      expect(result.current.error).toBe('Network error')
      expect(result.current.isCreatingOrder).toBe(false)
    })

    it('should set loading state during order creation', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      ;(fetch as jest.Mock).mockReturnValueOnce(promise)

      const { result } = renderHook(() => useOrders())

      act(() => {
        result.current.createOrder(mockCartItems, 'credit')
      })

      expect(result.current.isCreatingOrder).toBe(true)

      act(() => {
        resolvePromise!({
          ok: true,
          json: async () => ({ orderId: 'test', totalAmount: 45, items: [], status: 'completed', createdAt: '' }),
        })
      })

      await waitFor(() => {
        expect(result.current.isCreatingOrder).toBe(false)
      })
    })
  })

  describe('fetchOrders', () => {
    it('should fetch orders successfully', async () => {
      const mockOrdersResponse = {
        orders: [
          {
            orderId: 'order-1',
            totalAmount: 45.00,
            paymentMethod: 'credit',
            status: 'completed',
            createdAt: new Date().toISOString(),
            items: []
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrdersResponse,
      })

      const { result } = renderHook(() => useOrders())

      let ordersResult: any
      await act(async () => {
        ordersResult = await result.current.fetchOrders(1, 10)
      })

      expect(fetch).toHaveBeenCalledWith('/api/orders?page=1&limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(ordersResult).toEqual(mockOrdersResponse)
      expect(result.current.isFetchingOrders).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch orders failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      })

      const { result } = renderHook(() => useOrders())

      let ordersResult: any
      await act(async () => {
        ordersResult = await result.current.fetchOrders(1, 10)
      })

      expect(ordersResult).toBeNull()
      expect(result.current.error).toBe('Unauthorized')
      expect(result.current.isFetchingOrders).toBe(false)
    })

    it('should use default pagination parameters', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ orders: [], pagination: {} }),
      })

      const { result } = renderHook(() => useOrders())

      await act(async () => {
        await result.current.fetchOrders()
      })

      expect(fetch).toHaveBeenCalledWith('/api/orders?page=1&limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })
  })

  describe('calculateTotal', () => {
    it('should calculate total correctly', () => {
      const { result } = renderHook(() => useOrders())

      const total = result.current.calculateTotal(mockCartItems)
      
      // (10.00 * 2) + (25.00 * 1) = 45.00
      expect(total).toBe(45.00)
    })

    it('should return 0 for empty cart', () => {
      const { result } = renderHook(() => useOrders())

      const total = result.current.calculateTotal([])
      
      expect(total).toBe(0)
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error' }),
      })

      const { result } = renderHook(() => useOrders())

      // Create an error
      await act(async () => {
        await result.current.createOrder(mockCartItems)
      })

      expect(result.current.error).toBe('Test error')

      // Clear the error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce('Unexpected error')

      const { result } = renderHook(() => useOrders())

      await act(async () => {
        await result.current.createOrder(mockCartItems)
      })

      expect(result.current.error).toBe('An unexpected error occurred')
    })
  })
}) 