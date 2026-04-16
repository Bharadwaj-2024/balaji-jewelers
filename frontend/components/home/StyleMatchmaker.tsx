'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

type Match = {
  name: string;
  mood: string;
  occasion: string;
  purity: string;
  budget: string;
  blurb: string;
  query: string;
  accent: string;
};

const OCCASIONS = ['Wedding', 'Daily Wear', 'Festive', 'Anniversary'];
const PURITIES = ['24K', '22K', '18K', '14K'];
const BUDGETS = ['Under 25K', '25K-75K', '75K-2L', '2L+'];

const MATCHES: Match[] = [
  {
    name: 'Temple Bridal Aura',
    mood: 'Royal',
    occasion: 'Wedding',
    purity: '22K',
    budget: '75K-2L',
    blurb: 'Layered necklaces and bold jhumkas with heirloom detailing for your big day.',
    query: '/products?occasion=Wedding&purity=22K&min_price=75000&max_price=200000',
    accent: 'linear-gradient(140deg,#261a06 0%, #3d2a08 45%, #8c6a24 100%)',
  },
  {
    name: 'Minimal Gold Edit',
    mood: 'Modern',
    occasion: 'Daily Wear',
    purity: '18K',
    budget: '25K-75K',
    blurb: 'Sleek chains, stackable rings, and versatile studs for everyday elegance.',
    query: '/products?occasion=Daily+Wear&purity=18K&min_price=25000&max_price=75000',
    accent: 'linear-gradient(140deg,#151515 0%, #2b2b2b 45%, #8e7440 100%)',
  },
  {
    name: 'Festive Glow Capsule',
    mood: 'Vibrant',
    occasion: 'Festive',
    purity: '22K',
    budget: '25K-75K',
    blurb: 'Statement bangles and earrings that elevate traditional looks for celebrations.',
    query: '/products?occasion=Festive&purity=22K&min_price=25000&max_price=75000',
    accent: 'linear-gradient(140deg,#311f00 0%, #4d3608 42%, #d09a2d 100%)',
  },
  {
    name: 'Anniversary Signature Set',
    mood: 'Classic',
    occasion: 'Anniversary',
    purity: '18K',
    budget: '75K-2L',
    blurb: 'Refined pendant sets and sculpted bracelets that feel personal and timeless.',
    query: '/products?occasion=Anniversary&purity=18K&min_price=75000&max_price=200000',
    accent: 'linear-gradient(140deg,#220b16 0%, #3f172f 42%, #bb8a51 100%)',
  },
  {
    name: 'Daily Luxe Starter',
    mood: 'Classic',
    occasion: 'Daily Wear',
    purity: '14K',
    budget: 'Under 25K',
    blurb: 'Lightweight daily pieces with elegant silhouettes and easy styling.',
    query: '/products?occasion=Daily+Wear&purity=14K&max_price=25000',
    accent: 'linear-gradient(140deg,#121212 0%, #2d2d2d 42%, #7f6b42 100%)',
  },
  {
    name: 'Elite Wedding Statement',
    mood: 'Royal',
    occasion: 'Wedding',
    purity: '24K',
    budget: '2L+',
    blurb: 'Grand ceremonial pieces with high-karat brilliance crafted for legacy moments.',
    query: '/products?occasion=Wedding&purity=24K&min_price=200000',
    accent: 'linear-gradient(140deg,#2b1f03 0%, #5f4410 45%, #f1c15c 100%)',
  },
];

function OptionPill({ label, value, active, onClick }: { label: string; value: string; active: boolean; onClick: (v: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`px-4 py-2.5 text-[12px] md:text-[13px] tracking-wide border transition-all ${
        active
          ? 'bg-gold border-gold text-black font-semibold'
          : 'border-gold/40 text-white hover:border-gold hover:text-gold'
      }`}
    >
      {label}
    </button>
  );
}

export default function StyleMatchmaker() {
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0]);
  const [purity, setPurity] = useState<string>('22K');
  const [budget, setBudget] = useState<string>('25K-75K');
  const [seed, setSeed] = useState<number>(0);

  const picks = useMemo(() => {
    const filtered = MATCHES.filter(
      (item) => item.occasion === occasion && item.purity === purity && item.budget === budget,
    );

    if (filtered.length > 0) return filtered;

    const fallback = MATCHES.filter((item) => item.occasion === occasion || item.purity === purity || item.budget === budget);
    return fallback.length > 0 ? fallback : MATCHES;
  }, [occasion, purity, budget]);

  const active = picks[seed % picks.length];

  return (
    <section className="py-20 px-7 bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 opacity-70" style={{ background: 'radial-gradient(circle at 18% 22%, rgba(201,168,76,0.18), transparent 48%), radial-gradient(circle at 86% 74%, rgba(201,168,76,0.14), transparent 40%)' }} />

      <div className="max-w-[1200px] mx-auto relative">
        <div className="text-center mb-10">
          <div className="text-gold text-[13px] tracking-[5px] uppercase mb-2 font-light" style={{ fontFamily: 'Cormorant Garamond,serif' }}>
            Interactive Concierge
          </div>
          <h2 className="font-playfair font-bold mb-3" style={{ fontSize: 'clamp(26px,3.5vw,40px)' }}>
            Discover Your Signature Gold Story
          </h2>
          <div className="gold-line w-16 mx-auto mb-3" />
          <p className="text-white/70 max-w-2xl mx-auto" style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 18 }}>
            Choose your celebration, budget, and purity. Reveal a curated jewelry direction designed for your moment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-stretch">
          <div className="border border-gold/30 bg-white/[0.04] p-5 md:p-7 rounded-sm">
            <div className="mb-6">
              <div className="text-gold text-[11px] tracking-[3px] uppercase mb-3">Occasion</div>
              <div className="flex flex-wrap gap-2.5">
                {OCCASIONS.map((opt) => (
                  <OptionPill key={opt} label={opt} value={opt} active={occasion === opt} onClick={setOccasion} />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="text-gold text-[11px] tracking-[3px] uppercase mb-3">Purity</div>
              <div className="flex flex-wrap gap-2.5">
                {PURITIES.map((opt) => (
                  <OptionPill key={opt} label={opt} value={opt} active={purity === opt} onClick={setPurity} />
                ))}
              </div>
            </div>

            <div>
              <div className="text-gold text-[11px] tracking-[3px] uppercase mb-3">Budget</div>
              <div className="flex flex-wrap gap-2.5">
                {BUDGETS.map((opt) => (
                  <OptionPill key={opt} label={opt} value={opt} active={budget === opt} onClick={setBudget} />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSeed((n) => n + 1)}
              className="mt-8 btn-gold px-7 py-3 text-black text-[12px] tracking-[2px] uppercase"
            >
              Reveal Another Match
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${active.name}-${seed}`}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="rounded-sm border border-gold/35 overflow-hidden h-full min-h-[280px]"
            >
              <div className="p-7 h-full flex flex-col" style={{ background: active.accent }}>
                <div className="text-[11px] tracking-[3px] uppercase text-gold/90 mb-3">Your Signature Match</div>
                <h3 className="font-playfair text-3xl leading-tight mb-3">{active.name}</h3>
                <div className="text-[12px] tracking-[2px] uppercase text-white/80 mb-4">
                  {active.occasion} • {active.purity} • {active.budget}
                </div>
                <p className="text-white/85 leading-relaxed mb-8" style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 19 }}>
                  {active.blurb}
                </p>

                <div className="mt-auto flex flex-wrap gap-2 mb-4">
                  <span className="px-2.5 py-1 text-[11px] border border-white/30">{active.mood}</span>
                  <span className="px-2.5 py-1 text-[11px] border border-white/30">Curated Pairings</span>
                  <span className="px-2.5 py-1 text-[11px] border border-white/30">Gift-worthy</span>
                </div>

                <Link
                  href={active.query}
                  className="inline-flex items-center justify-center px-6 py-3 border border-gold bg-black/60 text-gold text-[12px] tracking-[2px] uppercase hover:bg-black transition-colors"
                >
                  Shop This Style
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
