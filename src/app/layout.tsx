import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/shared/navigation";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/contexts/CartContext";
import { CartSheet } from "@/components/customer/cart/CartSheet";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
      >
        <CartProvider>
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
          <CartSheet />
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
