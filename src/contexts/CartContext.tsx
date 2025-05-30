/**
 * Shopping Cart Context
 * 
 * Provides global cart state management using React Context and useReducer.
 * Includes cart persistence and helper functions.
 */

'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { CartState, CartAction, CartContextType, CartItem } from '@/types/cart'

const CartContext = createContext<CartContextType | null>(null)
const CART_STORAGE_KEY = 'amk-store-cart'

/**
 * Initial cart state
 */
const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isOpen: false,
}

/**
 * Cart reducer function to handle state transitions
 */
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.productId === action.payload.productId)
      let newItems: CartItem[]

      if (existingItem) {
        // Don't exceed max stock
        const newQuantity = Math.min(existingItem.quantity + 1, existingItem.maxStock)
        if (newQuantity === existingItem.quantity) {
          return state // No change if at max stock
        }
        
        newItems = state.items.map(item =>
          item.productId === action.payload.productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }]
      }

      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        ...state,
        items: newItems,
        totalItems,
        totalPrice,
      }
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.productId !== action.payload.productId)
      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        ...state,
        items: newItems,
        totalItems,
        totalPrice,
      }
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { productId } })
      }

      const newItems = state.items.map(item => {
        if (item.productId === productId) {
          // Don't exceed max stock
          const newQuantity = Math.min(quantity, item.maxStock)
          return { ...item, quantity: newQuantity }
        }
        return item
      })

      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        ...state,
        items: newItems,
        totalItems,
        totalPrice,
      }
    }

    case 'CLEAR_CART': {
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0,
      }
    }

    case 'TOGGLE_CART': {
      return {
        ...state,
        isOpen: !state.isOpen,
      }
    }

    case 'OPEN_CART': {
      return {
        ...state,
        isOpen: true,
      }
    }

    case 'CLOSE_CART': {
      return {
        ...state,
        isOpen: false,
      }
    }

    case 'LOAD_CART': {
      const items = action.payload
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        ...state,
        items,
        totalItems,
        totalPrice,
      }
    }

    default:
      return state
  }
}

/**
 * Cart Provider component
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        const cartItems: CartItem[] = JSON.parse(savedCart)
        dispatch({ type: 'LOAD_CART', payload: cartItems })
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
    }
  }, [])

  // Save cart to localStorage whenever cart items change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  }, [state.items])

  // Helper functions
  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
  }, [])

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' })
  }, [])

  const toggleCart = useCallback(() => {
    dispatch({ type: 'TOGGLE_CART' })
  }, [])

  const openCart = useCallback(() => {
    dispatch({ type: 'OPEN_CART' })
  }, [])

  const closeCart = useCallback(() => {
    dispatch({ type: 'CLOSE_CART' })
  }, [])

  const contextValue: CartContextType = {
    state,
    dispatch,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
  }

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

/**
 * Hook to use cart context
 */
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
} 