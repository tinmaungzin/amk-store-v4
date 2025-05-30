import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConditionalNavigation } from "@/components/shared/conditional-navigation";
import { ConditionalFooter } from "@/components/shared/conditional-footer";
import { Toaster } from "@/components/ui/sonner";
import { ConditionalCartProvider } from "@/components/shared/conditional-cart-provider";
import { UserProvider } from "@/hooks/use-user";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AMK Store - Digital Game Codes Marketplace",
  description: "Secure marketplace for digital game codes including PS5, Xbox, Roblox, and more. Buy with confidence and get instant delivery.",
  keywords: ["game codes", "digital games", "PS5", "Xbox", "Roblox", "gaming", "marketplace"],
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
    ],
    apple: {
      url: '/favicon.svg',
      type: 'image/svg+xml',
    },
  },
  manifest: '/site.webmanifest',
  themeColor: '#3B82F6',
  colorScheme: 'light',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AMK Store" />
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent ethereum-related errors from browser extensions
              if (typeof window !== 'undefined' && window.ethereum) {
                try {
                  // Only set if it doesn't already exist to avoid overriding legitimate values
                  if (window.ethereum.selectedAddress === undefined) {
                    Object.defineProperty(window.ethereum, 'selectedAddress', {
                      value: null,
                      writable: true,
                      configurable: true
                    });
                  }
                } catch (e) {
                  // Silently ignore errors
                }
              }
            `
          }} 
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50 flex flex-col`}
      >
        <UserProvider>
          <ConditionalCartProvider>
            <ConditionalNavigation />
            <main className="flex-1">
              {children}
            </main>
            <ConditionalFooter />
          </ConditionalCartProvider>
        </UserProvider>
        <Toaster />
      </body>
    </html>
  );
}
