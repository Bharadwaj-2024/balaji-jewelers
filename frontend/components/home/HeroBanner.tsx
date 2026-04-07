'use client';
// components/home/HeroBanner.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  {
    sub:   'Bridal Collection 2025',
    title: 'Royal Bridal',
    em:    'Collection',
    desc:  'Adorned for your most precious moments',
    cta:   'Explore Bridal',
    href:  '/products?occasion=Wedding',
    bg:    'from-[#1a0800] via-[#3d1800] to-[#0a0400]',
    accent:'#C9A84C',
  },
  {
    sub:   'New Arrivals · Spring 2025',
    title: 'Fresh &',
    em:    'Radiant',
    desc:  'New designs, timeless craftsmanship',
    cta:   'Shop New Arrivals',
    href:  '/products?is_new=true',
    bg:    'from-[#050510] via-[#0a0525] to-[#050510]',
    accent:'#8B9FE8',
  },
  {
    sub:   'Festival Offers · Upto 30% Off',
    title: 'Festive',
    em:    'Treasures',
    desc:  'Celebrate every occasion with gold',
    cta:   'View Offers',
    href:  '/products?is_featured=true',
    bg:    'from-[#0a0a00] via-[#1a1800] to-[#0a0a00]',
    accent:'#E5C97A',
  },
];

export default function HeroBanner() {
  const [idx, setIdx] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const s = SLIDES[idx];

  return (
    <section className={`relative h-[88vh] min-h-[500px] overflow-hidden bg-gradient-to-br ${s.bg} transition-all duration-1000`}>
      {/* Dot pattern overlay */}
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle, #C9A84C 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
      {/* Decorative circles */}
      <div className="absolute top-[8%] right-[6%] w-80 h-80 rounded-full border border-gold/10" />
      <div className="absolute top-[14%] right-[11%] w-48 h-48 rounded-full border border-gold/18" />
      <div className="absolute bottom-[12%] left-[4%] w-36 h-36 rounded-full border border-gold/10" />

      {/* Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-12 h-full flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="text-[13px] tracking-[6px] uppercase mb-4 font-light"
              style={{ fontFamily: 'Cormorant Garamond,serif', color: s.accent }}>
              {s.sub}
            </div>
            <h1 className="font-playfair text-white font-bold leading-[1.08] mb-5"
              style={{ fontSize: 'clamp(44px, 6vw, 80px)' }}>
              {s.title}<br />
              <em style={{ color: s.accent }}>{s.em}</em>
            </h1>
            <p className="text-white/60 mb-10 tracking-wide"
              style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 18 }}>
              {s.desc}
            </p>
            <div className="flex gap-4 flex-wrap">
              <button onClick={() => router.push(s.href)} className="btn-gold px-10 py-4 text-black font-bold text-[13px] tracking-[2px] uppercase rounded-none">
                {s.cta}
              </button>
              <button onClick={() => router.push('/products')} className="btn-black px-10 py-4 text-[13px] tracking-[2px] uppercase rounded-none border border-white/20">
                View All
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next */}
      {[[-1, '‹', 'left-4'], [1, '›', 'right-4']].map(([dir, icon, pos]) => (
        <button
          key={String(pos)}
          onClick={() => setIdx(i => (i + Number(dir) + SLIDES.length) % SLIDES.length)}
          className={`absolute ${pos} top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white text-2xl border border-gold/30 bg-white/8 backdrop-blur-sm hover:bg-gold/20 transition-all`}
        >
          {icon}
        </button>
      ))}

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className="h-[3px] rounded-full transition-all duration-300"
            style={{ width: i === idx ? 28 : 8, background: i === idx ? '#C9A84C' : 'rgba(255,255,255,.25)' }}
          />
        ))}
      </div>
    </section>
  );
}
