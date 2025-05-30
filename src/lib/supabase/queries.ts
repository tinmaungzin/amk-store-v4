import { createClient } from './server'
import { createClient as createBrowserClient } from './client'
import type { Database } from '@/types/database'

type Tables = Database['public']['Tables']
type Profile = Tables['profiles']['Row']
type Product = Tables['products']['Row']
type Order = Tables['orders']['Row']
type CreditRequest = Tables['credit_requests']['Row']

/**
 * Get user profile by ID
 * @param userId - User ID
 * @returns User profile or null
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

/**
 * Get all active products
 * @returns Array of active products
 */
export async function getActiveProducts(): Promise<Product[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data
}

/**
 * Get products by platform
 * @param platform - Platform name (PS5, Xbox, Roblox, etc.)
 * @returns Array of products for the platform
 */
export async function getProductsByPlatform(platform: string): Promise<Product[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('platform', platform)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products by platform:', error)
    return []
  }

  return data
}

/**
 * Get user orders
 * @param userId - User ID
 * @returns Array of user orders
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user orders:', error)
    return []
  }

  return data
}

/**
 * Get user credit requests
 * @param userId - User ID
 * @returns Array of user credit requests
 */
export async function getUserCreditRequests(userId: string): Promise<CreditRequest[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('credit_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching credit requests:', error)
    return []
  }

  return data
}

/**
 * Update user credit balance
 * @param userId - User ID
 * @param amount - Amount to add/subtract
 * @returns Success boolean
 */
export async function updateUserCreditBalance(
  userId: string, 
  amount: number
): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase.rpc('update_credit_balance', {
    user_id: userId,
    amount_change: amount
  })

  if (error) {
    console.error('Error updating credit balance:', error)
    return false
  }

  return true
}

/**
 * Check if user is admin
 * @param userId - User ID
 * @returns Boolean indicating admin status
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error checking admin status:', error)
    return false
  }

  return data?.role === 'admin' || data?.role === 'super_admin'
}

/**
 * Client-side helper to get current user
 * @returns Current user or null
 */
export function useSupabaseUser() {
  const supabase = createBrowserClient()
  return supabase.auth.getUser()
} 