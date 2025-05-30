import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Credit request validation schema
const createCreditRequestSchema = z.object({
  amount: z.number().min(5, 'Minimum amount is $5').max(1000, 'Maximum amount is $1000'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
})

/**
 * POST /api/credit-requests
 * Create a new credit request with payment proof upload
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const amount = parseFloat(formData.get('amount') as string)
    const paymentMethod = formData.get('paymentMethod') as string
    const notesValue = formData.get('notes') as string
    const notes = notesValue && notesValue.trim() ? notesValue.trim() : undefined
    const paymentProofFile = formData.get('paymentProof') as File

    // Validate required fields
    const validation = createCreditRequestSchema.safeParse({
      amount,
      paymentMethod,
      notes,
    })

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors,
      }, { status: 400 })
    }

    if (!paymentProofFile) {
      return NextResponse.json({ error: 'Payment proof file is required' }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(paymentProofFile.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload JPEG, PNG, GIF, or PDF files only.' 
      }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (paymentProofFile.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 10MB.' 
      }, { status: 400 })
    }

    // Check for existing pending requests
    const { data: existingRequests, error: existingError } = await supabase
      .from('credit_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (existingError) {
      console.error('Error checking existing requests:', existingError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existingRequests && existingRequests.length > 0) {
      return NextResponse.json({ 
        error: 'You already have a pending credit request. Please wait for it to be processed.' 
      }, { status: 400 })
    }

    // Convert file to base64 for database storage (temporary solution)
    const fileBuffer = await paymentProofFile.arrayBuffer()
    const fileBase64 = Buffer.from(fileBuffer).toString('base64')
    const fileDataUrl = `data:${paymentProofFile.type};base64,${fileBase64}`

    // Create credit request record
    const { data: creditRequest, error: createError } = await supabase
      .from('credit_requests')
      .insert({
        user_id: user.id,
        amount: validation.data.amount,
        payment_method: validation.data.paymentMethod,
        notes: validation.data.notes,
        payment_proof_url: fileDataUrl, // Store as data URL temporarily
        status: 'pending',
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating credit request:', createError)
      return NextResponse.json({ error: 'Failed to create credit request' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Credit request submitted successfully',
      creditRequest: {
        id: creditRequest.id,
        amount: creditRequest.amount,
        status: creditRequest.status,
        created_at: creditRequest.created_at,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Credit request submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/credit-requests
 * Get user's credit requests with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const offset = (page - 1) * limit

    // Get user's credit requests
    const { data: requests, error: requestsError } = await supabase
      .from('credit_requests')
      .select(`
        id,
        amount,
        payment_method,
        notes,
        status,
        admin_notes,
        created_at,
        reviewed_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (requestsError) {
      console.error('Error fetching credit requests:', requestsError)
      return NextResponse.json({ error: 'Failed to fetch credit requests' }, { status: 500 })
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('credit_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Error counting credit requests:', countError)
      return NextResponse.json({ error: 'Failed to count credit requests' }, { status: 500 })
    }

    return NextResponse.json({
      requests: requests || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get credit requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 