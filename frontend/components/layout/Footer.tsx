'use client';
// components/layout/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black pt-14 pb-7">
      <div className="max-w-[1200px] mx-auto px-7">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div style={{ fontFamily: 'Playfair Display,serif', color: '#C9A84C', fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>
              BALAJI JEWELLERS
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond,serif', color: 'rgba(255,255,255,.45)', fontSize: 11, letterSpacing: 4, marginBottom: 14 }}>
              Crafted with Devotion, Worn with Pride
            </div>
            <p className="text-white/40 text-[13px] leading-relaxed max-w-[260px]">
              Your trusted destination for BIS Hallmark certified gold jewellery since 1985. Authenticity guaranteed on every piece.
            </p>
            <div className="flex gap-3 mt-5">
              {['📷', '👍', '▶️'].map((icon, i) => (
                <div key={i} className="w-8 h-8 border border-gold/30 rounded-full flex items-center justify-center cursor-pointer hover:border-gold transition-colors text-sm">
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Collections */}
          <div>
            <div className="text-gold text-[11px] tracking-[2px] uppercase font-semibold mb-4">Collections</div>
            {['Rings', 'Necklaces', 'Earrings', 'Bangles', 'Pendants', 'Chains'].map(item => (
              <Link key={item} href={`/products?search=${item}`}
                className="block text-white/40 text-[13px] mb-2.5 hover:text-gold transition-colors">
                {item}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <div className="text-gold text-[11px] tracking-[2px] uppercase font-semibold mb-4">Company</div>
            {['About Us', 'Our Story', 'Blog', 'Careers', 'Press'].map(item => (
              <div key={item} className="block text-white/40 text-[13px] mb-2.5 cursor-pointer hover:text-gold transition-colors">
                {item}
              </div>
            ))}
          </div>

          {/* Support */}
          <div>
            <div className="text-gold text-[11px] tracking-[2px] uppercase font-semibold mb-4">Support</div>
            {['FAQ', 'Size Guide', 'Care Tips', 'Track Order', 'Returns', 'WhatsApp Support'].map(item => (
              <div key={item} className="block text-white/40 text-[13px] mb-2.5 cursor-pointer hover:text-gold transition-colors">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="gold-line mb-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-white/30 text-[12px]">
            © 2025 Balaji Jewellers. GST: 29AXXXX1234X1Z5. All rights reserved.
          </div>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210'}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] px-4 py-2 rounded-full text-white text-[13px] font-semibold hover:bg-[#20bf5b] transition-colors"
          >
            💚 WhatsApp Support
          </a>
        </div>
      </div>
    </footer>
  );
}
