'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const HIGHLIGHTS = [
  {
    title: '22K & 18K Purity',
    detail: 'Hallmark verified and crafted with precision for long-term value.',
  },
  {
    title: 'Hand-set Detailing',
    detail: 'Stone placement and texture work finished by experienced artisans.',
  },
  {
    title: 'Wedding To Daily Wear',
    detail: 'Design language that moves from celebration to everyday elegance.',
  },
];

export default function SignatureAtelier() {
  return (
    <section className="relative overflow-hidden bg-[#090705] px-7 py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 10% 20%, rgba(201,168,76,0.2), transparent 40%), radial-gradient(circle at 90% 75%, rgba(229,201,122,0.22), transparent 35%)',
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full border border-gold/25" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-56 w-56 rounded-full border border-gold/15" />

      <div className="relative mx-auto grid max-w-[1200px] items-stretch gap-8 md:grid-cols-[1.05fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="rounded-sm border border-gold/25 bg-gradient-to-br from-[#1f1204] via-[#130c04] to-[#0f0904] p-7 md:p-10"
        >
          <p
            className="mb-3 text-[12px] uppercase tracking-[0.4em] text-gold/90"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Signature Atelier
          </p>
          <h2 className="mb-5 font-playfair text-3xl font-bold leading-tight text-white md:text-5xl">
            Designed To Be
            <span className="block text-gold">Remembered Forever</span>
          </h2>
          <p
            className="max-w-[56ch] text-[17px] text-white/70"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Explore statement pieces shaped with traditional artistry and modern finishing.
            Each creation is built to hold emotion, value, and timeless beauty.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/products?is_featured=true"
              className="btn-gold px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-black"
            >
              Shop Signature Picks
            </Link>
            <Link
              href="/products?occasion=Wedding"
              className="inline-flex items-center border border-white/30 px-8 py-3 text-[12px] uppercase tracking-[0.2em] text-white transition hover:border-gold hover:text-gold"
            >
              Bridal Stories
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: 0.1 }}
          className="grid gap-4"
        >
          {HIGHLIGHTS.map((item, index) => (
            <div
              key={item.title}
              className="group rounded-sm border border-gold/20 bg-gradient-to-r from-[#111] via-[#121212] to-[#0d0d0d] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gold/50 text-[12px] font-semibold text-gold">
                  {index + 1}
                </span>
                <h3 className="font-playfair text-2xl text-white">{item.title}</h3>
              </div>
              <p className="pl-10 text-[14px] leading-relaxed text-white/60">{item.detail}</p>
            </div>
          ))}

          <div className="rounded-sm border border-gold/30 bg-[#0f0f0f] p-6">
            <p className="text-[11px] uppercase tracking-[0.35em] text-gold/75">Client Favorite</p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div>
                <p className="font-playfair text-2xl text-white">Royal Temple Necklace Set</p>
                <p className="mt-1 text-sm text-white/65">Heavy bridal statement with handcrafted motifs</p>
              </div>
              <Link href="/products" className="text-sm font-semibold text-gold transition hover:text-gold-light">
                View Collection
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
