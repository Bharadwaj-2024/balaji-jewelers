'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const PURITY_CARDS = [
  {
    purity: '22K',
    title: 'Royal Wedding Gold',
    description: 'Traditional richness with deeper yellow warmth for heirloom bridal moments.',
    href: '/products?purity=22k',
    badge: 'Most Loved',
    gradient: 'linear-gradient(155deg, #1d1200 0%, #b1882e 42%, #f2d996 100%)',
  },
  {
    purity: '18K',
    title: 'Modern Luxe Craft',
    description: 'Balanced strength and shine for everyday elegance with premium finishing.',
    href: '/products?purity=18k',
    badge: 'Trending',
    gradient: 'linear-gradient(155deg, #0e1720 0%, #43657c 42%, #d2b578 100%)',
  },
  {
    purity: '14K',
    title: 'Smart Daily Gold',
    description: 'Durable style-forward picks crafted for active, all-day comfort and sparkle.',
    href: '/products?purity=14k',
    badge: 'Value Pick',
    gradient: 'linear-gradient(155deg, #1f1210 0%, #90534a 42%, #e2bf86 100%)',
  },
];

export default function PuritySpotlight() {
  return (
    <section className="px-7 py-20 bg-[radial-gradient(circle_at_top,_#fff8e8_0%,_#f8efdf_35%,_#f1e4cc_100%)]">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <div className="text-gold text-[13px] tracking-[5px] uppercase mb-2.5 font-light" style={{ fontFamily: 'Cormorant Garamond,serif' }}>
            Signature Purity
          </div>
          <h2 className="font-playfair text-black font-bold mb-3" style={{ fontSize: 'clamp(28px,3.5vw,44px)' }}>
            Find Your Gold Personality
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 18 }}>
            Three purity stories. One unmistakable Balaji finish. Explore curated pieces crafted for your way of wearing gold.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PURITY_CARDS.map((card, i) => (
            <motion.div
              key={card.purity}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, delay: i * 0.12 }}
              className="relative rounded-sm overflow-hidden border border-gold/25 shadow-[0_20px_45px_rgba(0,0,0,0.12)]"
              style={{ background: card.gradient }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(255,255,255,0.38),transparent_42%)]" />
              <div className="absolute -right-10 -bottom-14 w-40 h-40 rounded-full border border-white/35" />
              <div className="absolute -left-8 -top-8 w-24 h-24 rounded-full bg-white/10" />

              <div className="relative p-7 text-white min-h-[310px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] uppercase tracking-[2px] px-2.5 py-1 rounded-full border border-white/35 bg-black/20">
                    {card.badge}
                  </span>
                  <span className="font-playfair text-4xl font-bold leading-none">{card.purity}</span>
                </div>

                <h3 className="font-playfair text-2xl font-semibold mb-2 leading-tight">{card.title}</h3>
                <p className="text-white/90 text-[14px] leading-relaxed mb-8">{card.description}</p>

                <div className="mt-auto">
                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-[12px] tracking-[1.5px] uppercase rounded-sm bg-white text-black font-semibold transition-transform duration-200 hover:translate-y-[-2px]"
                  >
                    Explore {card.purity}
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}