/**
 * Database type definitions for Supabase
 * This matches the schema we just deployed to the fresh amk-store-v4 project
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          credit_balance: number
          role: 'customer' | 'admin' | 'super_admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          credit_balance?: number
          role?: 'customer' | 'admin' | 'super_admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          credit_balance?: number
          role?: 'customer' | 'admin' | 'super_admin'
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          platform: string
          price: number
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          platform: string
          price: number
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          platform?: string
          price?: number
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      game_codes: {
        Row: {
          id: string
          product_id: string
          encrypted_code: string
          is_sold: boolean
          sold_at: string | null
          order_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          encrypted_code: string
          is_sold?: boolean
          sold_at?: string | null
          order_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          encrypted_code?: string
          is_sold?: boolean
          sold_at?: string | null
          order_id?: string | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          payment_method: string
          status: 'pending' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          payment_method: string
          status?: 'pending' | 'completed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          payment_method?: string
          status?: 'pending' | 'completed' | 'cancelled'
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          game_code_id: string | null
          quantity: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          game_code_id?: string | null
          quantity: number
          unit_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          game_code_id?: string | null
          quantity?: number
          unit_price?: number
          created_at?: string
        }
      }
      credit_requests: {
        Row: {
          id: string
          user_id: string
          amount: number
          payment_proof_url: string | null
          status: 'pending' | 'approved' | 'rejected'
          admin_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          payment_proof_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          payment_proof_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 