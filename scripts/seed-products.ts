#!/usr/bin/env tsx

/**
 * Product & Game Codes Seeding Script
 * 
 * Seeds products and game codes from a template JSON file.
 * Reads from scripts/templates/products-template.json
 * Automatically encrypts game codes before storing in database.
 * 
 * Usage:
 *   npm run seed:products
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { encryptGameCode } from '../src/lib/encryption'

// Load environment variables
config({ path: '.env.local' })

const prisma = new PrismaClient()

interface ProductTemplate {
  name: string
  description?: string
  platform: string
  price: number
  image_url?: string
  is_active: boolean
  game_codes: string[]
}

interface TemplateData {
  products: ProductTemplate[]
  _instructions?: any // This should be removed before seeding
}

const TEMPLATE_PATH = join(process.cwd(), 'scripts/templates/products-template.json')

/**
 * Load products from template file
 */
function loadProductsTemplate(): ProductTemplate[] {
  if (!existsSync(TEMPLATE_PATH)) {
    throw new Error(`Template file not found: ${TEMPLATE_PATH}`)
  }

  try {
    const rawData = readFileSync(TEMPLATE_PATH, 'utf-8')
    const data: TemplateData = JSON.parse(rawData)

    // Warn if instructions are still present
    if (data._instructions) {
      console.log('⚠️  Warning: Template still contains _instructions object. You may want to remove it for cleaner data.')
    }

    if (!data.products || !Array.isArray(data.products)) {
      throw new Error('Template file must contain a "products" array')
    }

    return data.products
  } catch (error) {
    throw new Error(`Failed to parse template file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate product data
 */
function validateProduct(product: ProductTemplate, index: number): void {
  const errors: string[] = []

  if (!product.name || typeof product.name !== 'string') {
    errors.push('name is required and must be a string')
  }

  if (!product.platform || typeof product.platform !== 'string') {
    errors.push('platform is required and must be a string')
  }

  if (typeof product.price !== 'number' || product.price < 0) {
    errors.push('price must be a non-negative number')
  }

  if (typeof product.is_active !== 'boolean') {
    errors.push('is_active must be a boolean')
  }

  if (!Array.isArray(product.game_codes)) {
    errors.push('game_codes must be an array')
  } else if (product.game_codes.length === 0) {
    errors.push('game_codes array cannot be empty')
  } else {
    // Validate each game code
    product.game_codes.forEach((code, codeIndex) => {
      if (!code || typeof code !== 'string') {
        errors.push(`game_codes[${codeIndex}] must be a non-empty string`)
      }
    })
  }

  if (errors.length > 0) {
    throw new Error(`Product #${index + 1} (${product.name}) validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`)
  }
}

/**
 * Seed products and game codes from template
 */
async function seedProducts(): Promise<void> {
  console.log('🎮 Loading products from template...')
  
  const products = loadProductsTemplate()
  console.log(`📁 Found ${products.length} products in template`)

  // Count total game codes
  const totalGameCodes = products.reduce((sum, product) => sum + product.game_codes.length, 0)
  console.log(`🔑 Total game codes to process: ${totalGameCodes}`)

  // Validate all products first
  console.log('🔍 Validating product data...')
  products.forEach((product, index) => validateProduct(product, index))
  console.log('✅ All products validated successfully')

  // Seed products and game codes
  console.log('💾 Seeding products to database...')
  
  let createdProductsCount = 0
  let updatedProductsCount = 0
  let createdGameCodesCount = 0

  for (const [index, productTemplate] of products.entries()) {
    try {
      console.log(`\n📦 Processing: ${productTemplate.name} (${productTemplate.game_codes.length} codes)`)

      // Check if product exists
      const existingProduct = await prisma.product.findFirst({
        where: { name: productTemplate.name }
      })

      let product
      if (existingProduct) {
        // Update existing product
        product = await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            description: productTemplate.description || null,
            platform: productTemplate.platform,
            price: productTemplate.price,
            image_url: productTemplate.image_url || null,
            is_active: productTemplate.is_active,
            updated_at: new Date()
          }
        })
        updatedProductsCount++
        console.log(`  ✏️  Updated product: ${product.name}`)
      } else {
        // Create new product
        product = await prisma.product.create({
          data: {
            name: productTemplate.name,
            description: productTemplate.description || null,
            platform: productTemplate.platform,
            price: productTemplate.price,
            image_url: productTemplate.image_url || null,
            is_active: productTemplate.is_active
          }
        })
        createdProductsCount++
        console.log(`  ✨ Created product: ${product.name}`)
      }

      // Process game codes for this product
      console.log(`  🔐 Processing ${productTemplate.game_codes.length} game codes...`)
      
      for (const [codeIndex, gameCode] of productTemplate.game_codes.entries()) {
        try {
          // Check if this exact code already exists for this product
          const existingCode = await prisma.gameCode.findFirst({
            where: {
              product_id: product.id,
              encrypted_code: encryptGameCode(gameCode) // Check against encrypted version
            }
          })

          if (!existingCode) {
            // Create new game code with encryption
            await prisma.gameCode.create({
              data: {
                product_id: product.id,
                encrypted_code: encryptGameCode(gameCode),
                is_sold: false
              }
            })
            createdGameCodesCount++
            console.log(`    ✨ Added code #${codeIndex + 1}`)
          } else {
            console.log(`    ⏭️  Code #${codeIndex + 1} already exists (skipped)`)
          }
        } catch (codeError) {
          console.error(`    ❌ Failed to process code #${codeIndex + 1}:`, codeError)
          throw codeError
        }
      }

    } catch (error) {
      console.error(`❌ Failed to seed product #${index + 1} (${productTemplate.name}):`, error)
      throw error
    }
  }

  console.log('\n🎉 Product seeding completed!')
  console.log(`   📈 Created products: ${createdProductsCount}`)
  console.log(`   📝 Updated products: ${updatedProductsCount}`)
  console.log(`   🔑 Created game codes: ${createdGameCodesCount}`)
  console.log(`   📊 Total processed: ${products.length} products, ${totalGameCodes} codes`)
}

/**
 * Verify seeded products and game codes
 */
async function verifyProducts(): Promise<void> {
  console.log('\n🔍 Verifying seeded products...')
  
  const products = await prisma.product.findMany({
    include: {
      game_codes: {
        select: {
          id: true,
          is_sold: true
        }
      }
    },
    orderBy: { platform: 'asc' }
  })

  const platformStats = products.reduce((acc, product) => {
    if (!acc[product.platform]) {
      acc[product.platform] = { products: 0, total_codes: 0, available_codes: 0 }
    }
    acc[product.platform].products++
    acc[product.platform].total_codes += product.game_codes.length
    acc[product.platform].available_codes += product.game_codes.filter(code => !code.is_sold).length
    return acc
  }, {} as Record<string, { products: number, total_codes: number, available_codes: number }>)

  console.log(`📊 Product Statistics by Platform:`)
  Object.entries(platformStats).forEach(([platform, stats]) => {
    console.log(`   ${platform}: ${stats.products} products, ${stats.available_codes}/${stats.total_codes} codes available`)
  })

  const totalProducts = products.length
  const totalCodes = products.reduce((sum, p) => sum + p.game_codes.length, 0)
  const availableCodes = products.reduce((sum, p) => sum + p.game_codes.filter(c => !c.is_sold).length, 0)

  console.log(`\n📈 Overall Totals:`)
  console.log(`   Products: ${totalProducts}`)
  console.log(`   Game Codes: ${availableCodes}/${totalCodes} available`)

  console.log('\n🎮 All Products:')
  products.forEach(product => {
    const availableCount = product.game_codes.filter(code => !code.is_sold).length
    const status = product.is_active ? '🟢' : '🔴'
    console.log(`   ${status} ${product.name} (${product.platform}) - $${product.price} - ${availableCount}/${product.game_codes.length} codes`)
  })
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    await seedProducts()
    await verifyProducts()
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
} 