import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Product update schema (all fields optional for PATCH)
const updateProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  platform: z.string().min(1, 'Platform is required').optional(),
  price: z.number().min(0.01, 'Price must be greater than 0').optional(),
  image_url: z.string().url('Must be a valid URL').nullable().optional(),
  is_active: z.boolean().optional(),
})

// Full product update schema for PUT
const replaceProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  platform: z.string().min(1, 'Platform is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  image_url: z.string().url('Must be a valid URL').nullable().optional(),
  is_active: z.boolean().default(true),
})

/**
 * Helper function to verify admin access
 */
async function verifyAdminAccess(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Forbidden: Admin access required', status: 403 }
  }

  return { user, profile }
}

/**
 * GET /api/admin/products/[id]
 * Get a specific product by ID (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify admin access
    const authResult = await verifyAdminAccess(supabase)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Get the product with game code count
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        game_codes(count)
      `)
      .eq('id', id)
      .single()

    if (productError) {
      if (productError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      console.error('Error fetching product:', productError)
      return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Admin product GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/products/[id]
 * Replace a product entirely (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify admin access
    const authResult = await verifyAdminAccess(supabase)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = replaceProductSchema.parse(body)

    // Update the product
    const { data: product, error: updateError } = await supabase
      .from('products')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      console.error('Error updating product:', updateError)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    return NextResponse.json({ 
      product,
      message: 'Product updated successfully' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Admin product PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/products/[id]
 * Partially update a product (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify admin access
    const authResult = await verifyAdminAccess(supabase)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)

    // Only update fields that are provided
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json({ error: 'No fields provided for update' }, { status: 400 })
    }

    // Update the product
    const { data: product, error: updateError } = await supabase
      .from('products')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      console.error('Error updating product:', updateError)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    return NextResponse.json({ 
      product,
      message: 'Product updated successfully' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Admin product PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Delete a product and all associated game codes (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify admin access
    const authResult = await verifyAdminAccess(supabase)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Check if product has any sold game codes (should not delete if there are orders)
    const { data: soldCodes, error: soldCodesError } = await supabase
      .from('game_codes')
      .select('id')
      .eq('product_id', id)
      .eq('is_sold', true)
      .limit(1)

    if (soldCodesError) {
      console.error('Error checking sold codes:', soldCodesError)
      return NextResponse.json({ error: 'Failed to check product status' }, { status: 500 })
    }

    if (soldCodes && soldCodes.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete product with sold game codes. This would break order history.' 
      }, { status: 400 })
    }

    // Delete all unsold game codes first
    const { error: deleteCodesError } = await supabase
      .from('game_codes')
      .delete()
      .eq('product_id', id)
      .eq('is_sold', false)

    if (deleteCodesError) {
      console.error('Error deleting game codes:', deleteCodesError)
      return NextResponse.json({ error: 'Failed to delete associated game codes' }, { status: 500 })
    }

    // Delete the product
    const { error: deleteProductError } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (deleteProductError) {
      if (deleteProductError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      console.error('Error deleting product:', deleteProductError)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Product deleted successfully' 
    })
  } catch (error) {
    console.error('Admin product DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 