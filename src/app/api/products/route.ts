/**
 * Products API Route
 * 
 * Handles fetching products data for the frontend
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/products
 * Fetch all products with available game codes count
 */
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { 
        is_active: true,
        game_codes: {
          some: { is_sold: false }
        }
      },
      include: {
        _count: {
          select: { game_codes: { where: { is_sold: false } } }
        }
      }
    })
    
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
} 