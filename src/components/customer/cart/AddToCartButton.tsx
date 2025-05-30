/**
 * Add to Cart Button Component
 * 
 * Button for adding products to the shopping cart with stock validation.
 */

'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'
import { CartItem } from '@/types/cart'

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    price: number
    platform: string
    image_url?: string
  }
  availableStock: number
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function AddToCartButton({
  product,
  availableStock,
  disabled = false,
  variant = 'default',
  size = 'default',
  className,
}: AddToCartButtonProps) {
  const { addItem, state, openCart } = useCart()
  const [isAdded, setIsAdded] = useState(false)

  // Check if item is already in cart
  const cartItem = state.items.find(item => item.productId === product.id)
  const currentQuantity = cartItem?.quantity || 0
  const canAddMore = currentQuantity < availableStock
  const isOutOfStock = availableStock === 0

  const handleAddToCart = () => {
    if (isOutOfStock || !canAddMore) return

    const cartItemData: Omit<CartItem, 'quantity'> = {
      id: `cart-${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      platform: product.platform,
      image_url: product.image_url,
      maxStock: availableStock,
    }

    addItem(cartItemData)
    
    // Show success feedback
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)

    // Auto-open cart after adding item
    setTimeout(() => openCart(), 300)
  }

  // Button text logic
  let buttonText = 'Add to Cart'
  let IconComponent = ShoppingCart

  if (isOutOfStock) {
    buttonText = 'Out of Stock'
  } else if (!canAddMore) {
    buttonText = 'Max Quantity in Cart'
  } else if (isAdded) {
    buttonText = 'Added!'
    IconComponent = Check
  } else if (currentQuantity > 0) {
    buttonText = `Add Another (${currentQuantity} in cart)`
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleAddToCart}
      disabled={disabled || isOutOfStock || !canAddMore}
    >
      <IconComponent className="w-4 h-4 mr-2" />
      {buttonText}
    </Button>
  )
} 