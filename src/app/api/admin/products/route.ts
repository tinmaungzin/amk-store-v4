import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Product creation schema
const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  platform: z.string().min(1, 'Platform is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  image_url: z.string().url('Must be a valid URL').nullable().optional(),
  is_active: z.boolean().default(true),
})

/**
 * GET /api/admin/products
 * Retrieve all products with game code counts (Admin only)
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check user authentication and role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Get products with game code counts
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        game_codes(count)
      `)
      .order('created_at', { ascending: false })

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Admin products GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/products
 * Create a new product (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check user authentication and role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    // Create the product
    const { data: product, error: createError } = await supabase
      .from('products')
      .insert([validatedData])
      .select()
      .single()

    if (createError) {
      console.error('Error creating product:', createError)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    return NextResponse.json({ 
      product,
      message: 'Product created successfully' 
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Admin products POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 