import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Bulk upload schema
const bulkUploadSchema = z.object({
  codes: z.array(z.string().min(1, 'Code cannot be empty')),
  method: z.enum(['textarea', 'csv']).default('textarea'),
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
 * POST /api/admin/products/[id]/codes/bulk
 * Bulk upload game codes for a specific product (Admin only)
 */
export async function POST(
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

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { codes, method } = bulkUploadSchema.parse(body)

    if (codes.length === 0) {
      return NextResponse.json({ error: 'No codes provided' }, { status: 400 })
    }

    if (codes.length > 1000) {
      return NextResponse.json({ 
        error: 'Maximum 1000 codes allowed per upload' 
      }, { status: 400 })
    }

    // Process codes for bulk insertion
    const results = {
      success: true,
      added: 0,
      duplicates: 0,
      errors: [] as string[],
      totalProcessed: codes.length,
    }

    // Get existing codes for this product to check for duplicates
    const { data: existingCodes, error: existingError } = await supabase
      .from('game_codes')
      .select('encrypted_code')
      .eq('product_id', productId)

    if (existingError) {
      console.error('Error fetching existing codes:', existingError)
      return NextResponse.json({ error: 'Failed to check existing codes' }, { status: 500 })
    }

    const existingCodeSet = new Set(existingCodes?.map(c => c.encrypted_code) || [])
    
    // Process each code
    const codesToInsert: Array<{
      product_id: string
      encrypted_code: string
      is_sold: boolean
    }> = []

    codes.forEach((code, index) => {
      try {
        // Basic validation
        if (!code || code.trim().length === 0) {
          results.errors.push(`Line ${index + 1}: Empty code`)
          return
        }

        const cleanCode = code.trim()

        // Check for minimum length
        if (cleanCode.length < 3) {
          results.errors.push(`Line ${index + 1}: Code too short: "${cleanCode}"`)
          return
        }

        // Check for duplicates within the upload batch
        const isDuplicateInBatch = codesToInsert.some(c => c.encrypted_code === cleanCode)
        if (isDuplicateInBatch) {
          results.duplicates++
          results.errors.push(`Line ${index + 1}: Duplicate code in upload: "${cleanCode}"`)
          return
        }

        // Check for duplicates in database
        if (existingCodeSet.has(cleanCode)) {
          results.duplicates++
          results.errors.push(`Line ${index + 1}: Code already exists: "${cleanCode}"`)
          return
        }

        // Code is valid, add to insertion list
        codesToInsert.push({
          product_id: productId,
          encrypted_code: cleanCode, // In production, this would be encrypted
          is_sold: false,
        })
      } catch (error) {
        results.errors.push(`Line ${index + 1}: Processing error: ${error}`)
      }
    })

    // Bulk insert valid codes
    if (codesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('game_codes')
        .insert(codesToInsert)

      if (insertError) {
        console.error('Error inserting codes:', insertError)
        return NextResponse.json({ 
          error: 'Failed to insert codes',
          details: insertError.message 
        }, { status: 500 })
      }

      results.added = codesToInsert.length
    }

    // Determine overall success
    results.success = results.added > 0 && results.errors.length === 0

    return NextResponse.json({
      message: `Bulk upload completed. Added ${results.added} codes.`,
      ...results,
      method,
      productName: product.name,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors,
      }, { status: 400 })
    }

    console.error('Bulk upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 