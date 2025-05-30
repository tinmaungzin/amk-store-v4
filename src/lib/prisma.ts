/**
 * Prisma Database Utility
 * 
 * This file provides a singleton Prisma client instance and
 * type-safe database operations for the AMK Store application.
 */

import { PrismaClient } from '@prisma/client'

// Declare global variable for Prisma client in development
declare global {
  var __prisma: PrismaClient | undefined
}

// Create singleton Prisma client
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// In development, attach to global to prevent multiple instances
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

export { prisma }

/**
 * Type definitions for better developer experience
 */
export type {
  Profile,
  Product,
  GameCode,
  Order,
  OrderItem,
  CreditRequest,
} from '@prisma/client'

// Extended types with relations
export type ProfileWithRelations = Profile & {
  orders?: Order[]
  credit_requests?: CreditRequest[]
}

export type ProductWithCodes = Product & {
  game_codes?: GameCode[]
  _count?: {
    game_codes: number
  }
}

export type OrderWithDetails = Order & {
  user: Profile
  order_items: (OrderItem & {
    product: Product
    game_code?: GameCode
  })[]
}

export type CreditRequestWithUser = CreditRequest & {
  user: Profile
  reviewer?: Profile
}

/**
 * Database helper functions
 */
export const db = {
  // Profile operations
  profile: {
    findByEmail: (email: string) =>
      prisma.profile.findUnique({ where: { email } }),
    
    findById: (id: string) =>
      prisma.profile.findUnique({ where: { id } }),
    
    updateCreditBalance: (id: string, amount: number) =>
      prisma.profile.update({
        where: { id },
        data: { credit_balance: amount, updated_at: new Date() }
      }),
    
    incrementCreditBalance: (id: string, amount: number) =>
      prisma.profile.update({
        where: { id },
        data: { 
          credit_balance: { increment: amount },
          updated_at: new Date()
        }
      }),
  },

  // Product operations
  product: {
    findActive: () =>
      prisma.product.findMany({
        where: { is_active: true },
        orderBy: { created_at: 'desc' }
      }),
    
    findByPlatform: (platform: string) =>
      prisma.product.findMany({
        where: { platform, is_active: true },
        orderBy: { price: 'asc' }
      }),
    
    findWithAvailableCodes: () =>
      prisma.product.findMany({
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
      }),
    
    count: () => prisma.product.count(),
  },

  // Game code operations
  gameCode: {
    findAvailable: (productId: string) =>
      prisma.gameCode.findFirst({
        where: { product_id: productId, is_sold: false }
      }),
    
    markAsSold: (id: string, orderId: string) =>
      prisma.gameCode.update({
        where: { id },
        data: {
          is_sold: true,
          sold_at: new Date(),
          order_id: orderId
        }
      }),
    
    getInventoryStats: () =>
      prisma.gameCode.groupBy({
        by: ['product_id', 'is_sold'],
        _count: { id: true },
        include: {
          product: {
            select: { name: true, platform: true }
          }
        }
      }),
    
    count: () => prisma.gameCode.count(),
  },

  // Order operations
  order: {
    findByUser: (userId: string) =>
      prisma.order.findMany({
        where: { user_id: userId },
        include: {
          order_items: {
            include: {
              product: true,
              game_code: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
    
    findWithDetails: (orderId: string) =>
      prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          order_items: {
            include: {
              product: true,
              game_code: true
            }
          }
        }
      }),
    
    createWithItems: async (orderData: {
      user_id: string
      total_amount: number
      payment_method: string
      items: Array<{
        product_id: string
        quantity: number
        unit_price: number
      }>
    }) => {
      return prisma.$transaction(async (tx) => {
        // Create order
        const order = await tx.order.create({
          data: {
            user_id: orderData.user_id,
            total_amount: orderData.total_amount,
            payment_method: orderData.payment_method,
            status: 'pending'
          }
        })

        // Create order items and assign game codes
        for (const item of orderData.items) {
          // Find available game code
          const gameCode = await tx.gameCode.findFirst({
            where: { product_id: item.product_id, is_sold: false }
          })

          if (!gameCode) {
            throw new Error(`No available codes for product ${item.product_id}`)
          }

          // Create order item
          await tx.orderItem.create({
            data: {
              order_id: order.id,
              product_id: item.product_id,
              game_code_id: gameCode.id,
              quantity: item.quantity,
              unit_price: item.unit_price
            }
          })

          // Mark game code as sold
          await tx.gameCode.update({
            where: { id: gameCode.id },
            data: {
              is_sold: true,
              sold_at: new Date(),
              order_id: order.id
            }
          })
        }

        // Update order status to completed
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'completed' }
        })

        return order
      })
    },
    
    count: () => prisma.order.count(),
  },

  // Credit request operations
  creditRequest: {
    findPending: () =>
      prisma.creditRequest.findMany({
        where: { status: 'pending' },
        include: { user: true },
        orderBy: { created_at: 'asc' }
      }),
    
    findByUser: (userId: string) =>
      prisma.creditRequest.findMany({
        where: { user_id: userId },
        include: { reviewer: true },
        orderBy: { created_at: 'desc' }
      }),
    
    approve: (id: string, reviewerId: string, adminNotes?: string) =>
      prisma.$transaction(async (tx) => {
        const creditRequest = await tx.creditRequest.update({
          where: { id },
          data: {
            status: 'approved',
            reviewed_by: reviewerId,
            reviewed_at: new Date(),
            admin_notes
          }
        })

        // Add credit to user's balance
        await tx.profile.update({
          where: { id: creditRequest.user_id },
          data: {
            credit_balance: { increment: creditRequest.amount },
            updated_at: new Date()
          }
        })

        return creditRequest
      }),
    
    reject: (id: string, reviewerId: string, adminNotes: string) =>
      prisma.creditRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
          admin_notes
        }
      }),
    
    count: () => prisma.creditRequest.count(),
  },

  // Profile operations
  profile: {
    findByEmail: (email: string) =>
      prisma.profile.findUnique({ where: { email } }),
    
    findById: (id: string) =>
      prisma.profile.findUnique({ where: { id } }),
    
    updateCreditBalance: (id: string, amount: number) =>
      prisma.profile.update({
        where: { id },
        data: { credit_balance: amount, updated_at: new Date() }
      }),
    
    incrementCreditBalance: (id: string, amount: number) =>
      prisma.profile.update({
        where: { id },
        data: { 
          credit_balance: { increment: amount },
          updated_at: new Date()
        }
      }),
    
    count: () => prisma.profile.count(),
  },

  // Analytics and reporting
  analytics: {
    getSalesStats: async (days: number = 30) => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const [totalRevenue, orderCount, topProducts] = await Promise.all([
        prisma.order.aggregate({
          where: {
            status: 'completed',
            created_at: { gte: startDate }
          },
          _sum: { total_amount: true },
          _count: { id: true }
        }),
        
        prisma.order.count({
          where: {
            status: 'completed',
            created_at: { gte: startDate }
          }
        }),
        
        prisma.orderItem.groupBy({
          by: ['product_id'],
          _count: { id: true },
          _sum: { unit_price: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5,
          where: {
            order: {
              status: 'completed',
              created_at: { gte: startDate }
            }
          }
        })
      ])

      return {
        totalRevenue: totalRevenue._sum.total_amount || 0,
        orderCount,
        topProducts
      }
    },
    
    getInventoryStats: () =>
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          platform: true,
          _count: {
            select: {
              game_codes: { where: { is_sold: false } }
            }
          }
        },
        where: { is_active: true }
      }),
  }
}

// Export default prisma client
export default prisma 