import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Shield,
  Clock,
  CreditCard
} from 'lucide-react'

/**
 * Website footer component for customer/user interface.
 * Includes company information, navigation links, contact details, and social media.
 * Responsive design with mobile-friendly layout.
 */
export function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/orders', label: 'My Orders' },
    { href: '/credits', label: 'Credits' },
  ]

  const supportLinks = [
    { href: '/support', label: 'Help Center' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/faq', label: 'FAQ' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
  ]

  const platformLinks = [
    { href: '/products?platform=ps5', label: 'PlayStation 5' },
    { href: '/products?platform=xbox', label: 'Xbox' },
    { href: '/products?platform=roblox', label: 'Roblox' },
    { href: '/products?platform=pc', label: 'PC Games' },
    { href: '/products?platform=nintendo', label: 'Nintendo' },
  ]

  const socialLinks = [
    { 
      href: 'https://facebook.com/amkstore', 
      label: 'Facebook', 
      icon: Facebook,
      className: 'hover:text-blue-600' 
    },
    { 
      href: 'https://twitter.com/amkstore', 
      label: 'Twitter', 
      icon: Twitter,
      className: 'hover:text-sky-500' 
    },
    { 
      href: 'https://instagram.com/amkstore', 
      label: 'Instagram', 
      icon: Instagram,
      className: 'hover:text-pink-600' 
    },
    { 
      href: 'https://youtube.com/amkstore', 
      label: 'YouTube', 
      icon: Youtube,
      className: 'hover:text-red-600' 
    },
  ]

  const features = [
    {
      icon: Shield,
      title: 'Secure & Trusted',
      description: 'All game codes are verified and authentic'
    },
    {
      icon: Clock,
      title: 'Instant Delivery',
      description: 'Get your codes immediately after purchase'
    },
    {
      icon: CreditCard,
      title: 'Flexible Payment',
      description: 'Multiple payment options including credits'
    }
  ]

  return (
    <footer className="bg-gray-50 border-t mt-auto">
      {/* Features Section */}
      {/* <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AMK Store</span>
            </div>
            <p className="text-gray-600 mb-6 max-w-sm">
              Your trusted marketplace for digital game codes. Secure, instant, and reliable 
              delivery of gaming content for all major platforms.
            </p>
            
            {/* Contact Information */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>support@amkstore.com</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-blue-600" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platforms */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Platforms</h3>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Support & Legal</h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        {/* <div className="mt-12 bg-gray-100 rounded-2xl p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Stay Updated
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter for the latest game releases, exclusive offers, 
              and special promotions delivered straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 h-12 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button 
                type="submit"
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div> */}
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-100 border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-gray-600">
              © {currentYear} AMK Store. All rights reserved.
            </div>

            {/* Social Media Links */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 mr-2">Follow us:</span>
              {socialLinks.map((social) => (
                <Link
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-500 transition-colors duration-200 ${social.className}`}
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Shield className="h-4 w-4 text-green-600" />
                <span>SSL Secured</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span>Safe Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}