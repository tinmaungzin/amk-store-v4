/**
 * Test script to check API endpoints after Prisma optimization
 */

async function testAPI(endpoint, description) {
  try {
    console.log(`🧪 Testing ${description}...`)
    const response = await fetch(`http://localhost:3000${endpoint}`)
    const status = response.status
    
    if (status === 200) {
      const data = await response.json()
      console.log(`✅ ${description}: ${status} - ${Array.isArray(data) ? data.length + ' items' : 'OK'}`)
    } else {
      const error = await response.text()
      console.log(`❌ ${description}: ${status} - ${error.substring(0, 100)}...`)
    }
  } catch (error) {
    console.log(`💥 ${description}: Failed - ${error.message}`)
  }
}

async function runTests() {
  console.log('🚀 Testing API endpoints...\n')
  
  await testAPI('/api/products', 'Products API')
  
  // Test with auth (will fail but should not be 500)
  await testAPI('/api/orders', 'Orders API (no auth - should be 401)')
  
  console.log('\n🏁 Tests completed!')
}

runTests().catch(console.error) 