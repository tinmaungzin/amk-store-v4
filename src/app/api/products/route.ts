/**
 * Products API Route
 * 
 * Handles fetching products data for the frontend
 */

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

/**
 * GET /api/products
 * Fetch all products with available game codes count
 */
export async function GET() {
  // Create fresh client to avoid prepared statement conflicts in development
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + "?prepared_statements=false"
      }
    }
  })

  try {
    console.log('🛒 Fetching products...')
    
    // Simplified query to avoid prepared statement conflicts
    const products = await prisma.product.findMany({
      where: { 
        is_active: true
      },
      include: {
        _count: {
          select: { 
            game_codes: { 
              where: { is_sold: false } 
            } 
          }
        }
      }
    })
    
    // Filter products that have available codes
    const productsWithCodes = products.filter(product => 
      product._count.game_codes > 0
    )
    
    console.log(`✅ Found ${productsWithCodes.length} products with available codes`)
    
    return NextResponse.json(productsWithCodes)
  } catch (error) {
    console.error('❌ Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 