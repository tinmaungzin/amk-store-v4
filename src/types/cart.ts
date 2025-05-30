/**
 * Shopping Cart Types
 * 
 * TypeScript definitions for the cart state and actions.
 */

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  platform: string
  image_url?: string
  quantity: number
  maxStock: number
}

export interface CartState {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  isOpen: boolean
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

export interface CartContextType {
  state: CartState
  dispatch: React.Dispatch<CartAction>
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
} 