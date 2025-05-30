/**
 * Products API Route
 * 
 * Handles fetching products data for the frontend
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

/**
 * GET /api/products
 * Fetch all products with available game codes count
 */
export async function GET() {
  try {
    const products = await db.product.findWithAvailableCodes()
    
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
} 