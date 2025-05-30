/**
 * Cart Context Tests
 * 
 * Tests for the shopping cart state management functionality.
 */

import { renderHook, act } from '@testing-library/react'
import { CartProvider, useCart } from '../../../contexts/CartContext'
import { CartItem } from '../../../types/cart'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
)

const mockCartItem: Omit<CartItem, 'quantity'> = {
  id: 'test-item-1',
  productId: 'product-1',
  name: 'Test Game',
  price: 29.99,
  platform: 'PS5',
  maxStock: 5,
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
  })

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    
    expect(result.current.state.items).toEqual([])
    expect(result.current.state.totalItems).toBe(0)
    expect(result.current.state.totalPrice).toBe(0)
    expect(result.current.state.isOpen).toBe(false)
  })

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    
    act(() => {
      result.current.addItem(mockCartItem)
    })
    
    expect(result.current.state.items).toHaveLength(1)
    expect(result.current.state.items[0]).toMatchObject({
      ...mockCartItem,
      quantity: 1,
    })
    expect(result.current.state.totalItems).toBe(1)
    expect(result.current.state.totalPrice).toBe(29.99)
  })

  it('should increase quantity when adding existing item', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    
    act(() => {
      result.current.addItem(mockCartItem)
      result.current.addItem(mockCartItem)
    })
    
    expect(result.current.state.items).toHaveLength(1)
    expect(result.current.state.items[0].quantity).toBe(2)
    expect(result.current.state.totalItems).toBe(2)
    expect(result.current.state.totalPrice).toBe(59.98)
  })

  it('should not exceed max stock', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    
    act(() => {
      // Add 5 items (max stock)
      for (let i = 0; i < 6; i++) {
        result.current.addItem(mockCartItem)
      }
    })
    
    expect(result.current.state.items[0].quantity).toBe(5) // Should not exceed maxStock
    expect(result.current.state.totalItems).toBe(5)
  })

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    
    act(() => {
      result.current.addItem(mockCartItem)
      result.current.removeItem(mockCartItem.productId)
    })
    
    expect(result.current.state.items).toHaveLength(0)
    expect(result.current.state.totalItems).toBe(0)
    expect(result.current.state.totalPrice).toBe(0)
  })

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    
    act(() => {
      result.current.addItem(mockCartItem)
      result.current.updateQuantity(mockCartItem.productId, 3)
    })
    
    expect(result.current.state.items[0].quantity).toBe(3)
    expect(result.current.state.totalItems).toBe(3)
    expect(result.current.state.totalPrice).toBe(89.97)
  })

  it('should remove item when quantity is set to 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    
    act(() => {
      result.current.addItem(mockCartItem)
      result.current.updateQuantity(mockCartItem.productId, 0)
    })
    
    expect(result.current.state.items).toHaveLength(0)
  })

  it('should clear cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    
    act(() => {
      result.current.addItem(mockCartItem)
      result.current.clearCart()
    })
    
    expect(result.current.state.items).toHaveLength(0)
    expect(result.current.state.totalItems).toBe(0)
    expect(result.current.state.totalPrice).toBe(0)
  })

  it('should toggle cart open/close', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    
    act(() => {
      result.current.toggleCart()
    })
    
    expect(result.current.state.isOpen).toBe(true)
    
    act(() => {
      result.current.toggleCart()
    })
    
    expect(result.current.state.isOpen).toBe(false)
  })
}) 