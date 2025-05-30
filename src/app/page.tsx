import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Welcome to AMK Store
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Your trusted marketplace for digital game codes. Get instant access to PS5, Xbox, 
          Roblox, and more games with secure and reliable delivery.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/products">
            <Button size="lg" className="w-full sm:w-auto">
              Browse Games
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Get Started
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose AMK Store?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>🔒 Secure & Encrypted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                All game codes are encrypted and stored securely. Your purchases are protected 
                with industry-standard security measures.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚡ Instant Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get your game codes instantly after purchase. No waiting, no delays - 
                start playing immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>💳 Flexible Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Use our credit system for easy purchases. Add credits to your account 
                and buy games with one click.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Platforms Section */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Available Platforms</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-2xl mb-2">🎮</div>
            <h3 className="font-semibold">PlayStation</h3>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold">Xbox</h3>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-2xl mb-2">🟦</div>
            <h3 className="font-semibold">Roblox</h3>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-2xl mb-2">💻</div>
            <h3 className="font-semibold">PC Games</h3>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Gaming?</h2>
        <p className="text-xl mb-6">
          Join thousands of satisfied customers and get your favorite games today.
        </p>
        <Link href="/login">
          <Button size="lg" variant="secondary">
            Create Your Account
          </Button>
        </Link>
      </div>
    </div>
  )
}
