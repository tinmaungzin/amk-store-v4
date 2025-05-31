import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptGameCode } from '@/lib/encryption'

/**
 * Verify admin access for the request
 */
async function verifyAdminAccess(supabase: any) {
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
 * GET /api/admin/products/[id]/codes
 * Get all game codes for a specific product (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = await createClient()

    // Verify admin access
    const authResult = await verifyAdminAccess(supabase)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // First, verify the product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get all game codes for this product
    const { data: gameCodes, error: codesError } = await supabase
      .from('game_codes')
      .select(`
        id,
        encrypted_code,
        is_sold,
        sold_at,
        created_at,
        order_id
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (codesError) {
      console.error('Error fetching game codes:', codesError)
      return NextResponse.json({ error: 'Failed to fetch game codes' }, { status: 500 })
    }

    // Decrypt codes for admin viewing
    const decryptedCodes = (gameCodes || []).map(code => {
      let decryptedCode = 'DECRYPTION_ERROR'
      try {
        decryptedCode = decryptGameCode(code.encrypted_code)
      } catch (error) {
        console.error('Error decrypting game code:', error)
      }

      return {
        id: code.id,
        code: decryptedCode,
        is_sold: code.is_sold,
        sold_at: code.sold_at,
        created_at: code.created_at,
        order_id: code.order_id,
      }
    })

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
      },
      codes: decryptedCodes,
      total: decryptedCodes.length,
      available: decryptedCodes.filter(code => !code.is_sold).length,
      sold: decryptedCodes.filter(code => code.is_sold).length,
    })
  } catch (error) {
    console.error('Admin product codes GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/products/[id]/codes
 * Delete a specific game code (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = await createClient()

    // Verify admin access
    const authResult = await verifyAdminAccess(supabase)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Get code ID from query params
    const url = new URL(request.url)
    const codeId = url.searchParams.get('codeId')

    if (!codeId) {
      return NextResponse.json({ error: 'Code ID is required' }, { status: 400 })
    }

    // Check if the code exists and belongs to this product
    const { data: gameCode, error: codeError } = await supabase
      .from('game_codes')
      .select('id, is_sold, product_id')
      .eq('id', codeId)
      .eq('product_id', productId)
      .single()

    if (codeError || !gameCode) {
      return NextResponse.json({ error: 'Game code not found' }, { status: 404 })
    }

    // Prevent deletion of sold codes
    if (gameCode.is_sold) {
      return NextResponse.json({ 
        error: 'Cannot delete sold game codes. This would break order history.' 
      }, { status: 400 })
    }

    // Delete the game code
    const { error: deleteError } = await supabase
      .from('game_codes')
      .delete()
      .eq('id', codeId)

    if (deleteError) {
      console.error('Error deleting game code:', deleteError)
      return NextResponse.json({ error: 'Failed to delete game code' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Game code deleted successfully',
      codeId 
    })
  } catch (error) {
    console.error('Admin game code DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 