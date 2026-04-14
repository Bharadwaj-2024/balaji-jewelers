'use client';
// components/home/HomeClient.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { productsAPI, categoriesAPI } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import SignatureAtelier from '@/components/home/SignatureAtelier';
import GoldBudgetPlanner from '@/components/home/GoldBudgetPlanner';
import PuritySpotlight from '@/components/home/PuritySpotlight';

const OCCASIONS = [
  { name: 'Wedding',     emoji: '💍', bg: '#1a0800', href: '/products?occasion=Wedding' },
  { name: 'Daily Wear',  emoji: '☀️', bg: '#000d1a', href: '/products?occasion=Daily+Wear' },
  { name: 'Festive',     emoji: '🪔', bg: '#1a1400', href: '/products?occasion=Festive' },
  { name: 'Anniversary', emoji: '💕', bg: '#1a0010', href: '/products?occasion=Anniversary' },
];

const BUDGETS = [
  { label: 'Under ₹15,000',    max: 15000 },
  { label: '₹15K – ₹50K',    min: 15000, max: 50000 },
  { label: '₹50K – ₹1L',     min: 50000, max: 100000 },
  { label: '₹1L+',             min: 100000 },
];

const REVIEWS = [
  { name: 'Priya Sharma',  city: 'Mumbai',    rating: 5, text: 'Absolutely stunning quality! The necklace was exactly as shown. Fast delivery too. Will definitely recommend to everyone!' },
  { name: 'Ananya Reddy',  city: 'Hyderabad', rating: 5, text: 'Bought the bridal ring set for my wedding. My entire family was amazed by the craftsmanship. 100% authentic gold.' },
  { name: 'Kavitha Nair',  city: 'Kochi',     rating: 5, text: 'The jhumkas are absolutely gorgeous! Perfect for my daughter\'s wedding. The detail work is impeccable and the gold shine is beautiful.' },
];

function SectionHead({ label, title, sub = '' }: { label: string; title: string; sub?: string }) {
  return (
    <div className="text-center mb-12">
      <div className="text-gold text-[13px] tracking-[5px] uppercase mb-2.5 font-light" style={{ fontFamily: 'Cormorant Garamond,serif' }}>{label}</div>
      <h2 className="font-playfair text-black font-bold mb-3" style={{ fontSize: 'clamp(26px,3.5vw,40px)' }}>{title}</h2>
      <div className="gold-line w-16 mx-auto mb-3" />
      {sub && <p className="text-gray-500" style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 17 }}>{sub}</p>}
    </div>
  );
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i < rating ? '#C9A84C' : 'none'} stroke={i < rating ? '#C9A84C' : '#ddd'} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

export default function HomeClient() {
  const [categories, setCategories]     = useState<any[]>([]);
  const [newArrivals, setNewArrivals]   = useState<any[]>([]);
  const [featured,    setFeatured]      = useState<any[]>([]);
  const [loadingNew,  setLoadingNew]    = useState(true);
  const [loadingFeat, setLoadingFeat]   = useState(true);

  useEffect(() => {
    categoriesAPI.get().then(({ data }) => setCategories(data.data || [])).catch(() => {});
    productsAPI.getAll({ is_new: true, limit: 8 }).then(({ data }) => { setNewArrivals(data.data || []); setLoadingNew(false); }).catch(() => setLoadingNew(false));
    productsAPI.getAll({ is_featured: true, limit: 8 }).then(({ data }) => { setFeatured(data.data || []); setLoadingFeat(false); }).catch(() => setLoadingFeat(false));
  }, []);

  return (
    <>
      {/* ── Categories ── */}
      <section className="py-20 bg-black px-7">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-11">
            <div className="text-gold text-[13px] tracking-[5px] uppercase mb-2.5 font-light" style={{ fontFamily: 'Cormorant Garamond,serif' }}>Browse By</div>
            <h2 className="font-playfair text-white font-bold text-4xl mb-3">Our Collections</h2>
            <div className="gold-line w-16 mx-auto" />
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories.length > 0
              ? categories.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <Link href={`/products?category=${c.id}`}
                      className="img-zoom card-hover relative aspect-[3/4] block rounded-sm overflow-hidden border border-gold/15 cursor-pointer">
                      {c.image_url
                        ? <Image src={c.image_url} alt={c.name} fill className="object-cover" />
                        : <div className="w-full h-full bg-gradient-to-b from-[#1a0f00] to-[#0a0500]" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                      <div className="absolute bottom-3 left-0 right-0 text-center">
                        <div className="font-playfair text-white text-[13px] font-semibold">{c.name}</div>
                        <div className="text-gold/70 text-[10px] mt-0.5">{c.product_count} pieces</div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              : Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton aspect-[3/4] rounded-sm" />
                ))}
          </div>
        </div>
      </section>

      {/* ── New Arrivals ── */}
      <section className="py-20 px-7 bg-ivory">
        <div className="max-w-[1200px] mx-auto">
          <SectionHead label="Fresh From The Workshop" title="New Arrivals" />
          <div className="scroll-x flex gap-5 pb-3">
            {loadingNew
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="min-w-[230px] flex-none"><ProductCardSkeleton /></div>
                ))
              : newArrivals.map(p => (
                  <div key={p.id} className="min-w-[230px] flex-none">
                    <ProductCard product={p} mini />
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ── Occasions ── */}
      <section className="py-20 px-7 bg-champ">
        <div className="max-w-[1200px] mx-auto">
          <SectionHead label="Curated For" title="Every Occasion" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {OCCASIONS.map(o => (
              <Link key={o.name} href={o.href}
                className="img-zoom card-hover relative aspect-[3/4] rounded-sm overflow-hidden cursor-pointer"
                style={{ background: o.bg }}>
                <div className="absolute inset-0 flex flex-col items-center justify-end p-6">
                  <div className="text-3xl mb-2">{o.emoji}</div>
                  <div className="font-playfair text-white text-lg font-semibold text-center">{o.name}</div>
                  <div className="text-gold text-[11px] mt-2 tracking-[2px]">SHOP NOW →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SignatureAtelier />

      <PuritySpotlight />

      {/* ── Budget Filter ── */}
      <section className="py-16 px-7 bg-white">
        <div className="max-w-[1200px] mx-auto text-center">
          <SectionHead label="Find Your" title="Design by Budget" />
          <div className="flex flex-wrap gap-4 justify-center">
            {BUDGETS.map(b => (
              <Link
                key={b.label}
                href={`/products?${b.min ? `min_price=${b.min}&` : ''}${b.max ? `max_price=${b.max}` : ''}`}
                className="px-7 py-3 border-[1.5px] border-gold/40 text-black text-[13px] tracking-wide font-medium hover:bg-gold hover:text-black hover:border-gold transition-all"
              >
                {b.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <GoldBudgetPlanner />

      {/* ── Featured ── */}
      <section className="py-20 px-7 bg-ivory">
        <div className="max-w-[1200px] mx-auto">
          <SectionHead label="Handpicked For You" title="Featured Pieces" sub="Each piece BIS Hallmark certified and authentically crafted" />
          {loadingFeat
            ? <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
            : <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {featured.map(p => <ProductCard key={p.id} product={p} />)}
              </div>}
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section className="py-16 px-7 bg-black">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {[['🏅','BIS Hallmark','100% Certified Gold'],['✨','Authentic Gold','Genuine 22K & 18K'],['🚚','Free Shipping','On orders above ₹10K'],['↩️','Easy Returns','7-day hassle free'],['💬','WhatsApp Support','9AM – 9PM daily']].map(([icon,t,s]) => (
              <div key={t} className="text-center p-6 border border-gold/15 rounded-sm">
                <div className="text-3xl mb-3">{icon}</div>
                <div className="font-playfair text-white text-sm font-semibold mb-1">{t}</div>
                <div className="text-white/40 text-[12px]">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="py-20 px-7 bg-champ">
        <div className="max-w-[1200px] mx-auto">
          <SectionHead label="What Our Customers Say" title="Trusted by Thousands" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map(r => (
              <div key={r.name} className="bg-white p-7 rounded-sm border-t-[3px] border-gold">
                <Stars rating={r.rating} />
                <p className="mt-3 mb-5 text-gray-500 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 16 }}>
                  "{r.text}"
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-black text-sm">{r.name}</div>
                    <div className="text-gray-400 text-[12px]">{r.city}</div>
                  </div>
                  <div className="text-gold/20 font-playfair text-6xl leading-none">"</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
