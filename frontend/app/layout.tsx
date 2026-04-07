// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import GoldTicker from '@/components/layout/GoldTicker';
import { CartProvider }    from '@/context/CartContext';
import { AuthProvider }    from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { Toaster }         from 'react-hot-toast';

export const metadata: Metadata = {
  title: { default: 'Balaji Jewellers — Crafted with Devotion, Worn with Pride', template: '%s | Balaji Jewellers' },
  description: 'Shop BIS Hallmark certified 22K & 18K gold jewellery online. Rings, necklaces, earrings, bangles, pendants and chains. Authentic craftsmanship since 1985.',
  keywords: ['gold jewellery', 'BIS hallmark', '22K gold', 'bridal jewellery', 'Balaji Jewellers'],
  openGraph: {
    title: 'Balaji Jewellers',
    description: 'Crafted with Devotion, Worn with Pride',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <GoldTicker />
              <Navbar />
              <main>{children}</main>
              <Footer />
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: '#0A0A0A',
                    color: '#C9A84C',
                    border: '1px solid rgba(201,168,76,0.3)',
                    fontFamily: 'Jost, sans-serif',
                    fontSize: '13px',
                  },
                }}
              />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
