/**
 * Performance Monitoring Utility
 * 
 * Helps track API response times and database query performance
 */

export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map()

  /**
   * Start timing an operation
   */
  static start(label: string): void {
    this.timers.set(label, performance.now())
  }

  /**
   * End timing and log the result
   */
  static end(label: string): number {
    const startTime = this.timers.get(label)
    if (!startTime) {
      console.warn(`⚠️ No timer found for "${label}"`)
      return 0
    }

    const duration = performance.now() - startTime
    this.timers.delete(label)

    if (process.env.NODE_ENV === 'development') {
      const emoji = duration < 100 ? '🚀' : duration < 500 ? '⚡' : duration < 1000 ? '⏳' : '🐌'
      console.log(`${emoji} ${label}: ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  /**
   * Measure an async function execution time
   */
  static async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label)
    try {
      const result = await fn()
      this.end(label)
      return result
    } catch (error) {
      this.end(label)
      throw error
    }
  }

  /**
   * Log slow query warning
   */
  static warnSlowQuery(queryName: string, duration: number, threshold: number = 1000): void {
    if (duration > threshold) {
      console.warn(`🐌 SLOW QUERY: ${queryName} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`)
    }
  }
}

/**
 * API Response time middleware helper
 */
export function withPerformanceLogging<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return PerformanceMonitor.measure(operation, fn)
} 