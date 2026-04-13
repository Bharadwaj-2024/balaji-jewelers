'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { goldRatesAPI } from '@/lib/api';

type Purity = '22k' | '18k' | '14k';

type GoldRates = {
  rate_22k: number;
  rate_18k: number;
  rate_14k: number;
};

const DEFAULT_RATES: GoldRates = {
  rate_22k: 6820,
  rate_18k: 5580,
  rate_14k: 4300,
};

const PURITY_LABEL: Record<Purity, string> = {
  '22k': '22K',
  '18k': '18K',
  '14k': '14K',
};

const RATE_KEY: Record<Purity, keyof GoldRates> = {
  '22k': 'rate_22k',
  '18k': 'rate_18k',
  '14k': 'rate_14k',
};

const formatRupees = (value: number) =>
  '\u20b9' + Math.round(value).toLocaleString('en-IN');

export default function GoldBudgetPlanner() {
  const [rates, setRates] = useState<GoldRates>(DEFAULT_RATES);
  const [budget, setBudget] = useState<number>(100000);
  const [purity, setPurity] = useState<Purity>('22k');
  const [makingPct, setMakingPct] = useState<number>(12);

  useEffect(() => {
    goldRatesAPI
      .get()
      .then(({ data }) => {
        if (data?.data) {
          setRates({
            rate_22k: Number(data.data.rate_22k) || DEFAULT_RATES.rate_22k,
            rate_18k: Number(data.data.rate_18k) || DEFAULT_RATES.rate_18k,
            rate_14k: Number(data.data.rate_14k) || DEFAULT_RATES.rate_14k,
          });
        }
      })
      .catch(() => {});
  }, []);

  const calc = useMemo(() => {
    const baseRate = Number(rates[RATE_KEY[purity]]) || 0;
    const effectiveRate = baseRate * (1 + makingPct / 100);
    const grams = effectiveRate > 0 ? budget / effectiveRate : 0;
    const est8gPrice = effectiveRate * 8;

    return {
      baseRate,
      effectiveRate,
      grams,
      est8gPrice,
    };
  }, [budget, makingPct, purity, rates]);

  return (
    <section className="relative overflow-hidden bg-[#fbf4e6] px-7 py-20">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 8% 15%, rgba(201,168,76,0.16), transparent 35%), radial-gradient(circle at 88% 80%, rgba(10,10,10,0.08), transparent 30%)',
        }}
      />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="mb-10 text-center">
          <div
            className="mb-2.5 text-[13px] uppercase tracking-[5px] text-gold"
            style={{ fontFamily: 'Cormorant Garamond,serif' }}
          >
            Smart Shopping Tool
          </div>
          <h2 className="mb-3 font-playfair text-4xl font-bold text-black">Gold Budget Planner</h2>
          <div className="gold-line mx-auto mb-3 w-16" />
          <p className="text-gray-600" style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 18 }}>
            Estimate how much gold you can buy instantly based on live rates, purity, and making charges.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
          <div className="rounded-sm border border-gold/35 bg-white p-6 md:p-8">
            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.2em] text-black/70">Budget</label>
            <div className="mb-5 flex items-center gap-3">
              <span className="text-xl font-bold text-black">\u20b9</span>
              <input
                type="number"
                min={10000}
                step={500}
                value={budget}
                onChange={(e) => setBudget(Math.max(10000, Number(e.target.value) || 10000))}
                className="input-gold max-w-[220px]"
              />
            </div>

            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.2em] text-black/70">Purity</label>
            <div className="mb-6 flex flex-wrap gap-3">
              {(Object.keys(PURITY_LABEL) as Purity[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPurity(p)}
                  className={`border px-5 py-2 text-sm font-semibold transition ${
                    purity === p
                      ? 'border-gold bg-gold text-black'
                      : 'border-gold/35 bg-white text-black hover:border-gold'
                  }`}
                >
                  {PURITY_LABEL[p]}
                </button>
              ))}
            </div>

            <div className="mb-2 flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.2em] text-black/70">
              <span>Making Charges</span>
              <span>{makingPct}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={25}
              value={makingPct}
              onChange={(e) => setMakingPct(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="rounded-sm border border-black/10 bg-[#12100d] p-6 text-white md:p-8">
            <p className="text-[11px] uppercase tracking-[0.35em] text-gold/80">Estimated Outcome</p>
            <div className="mt-5 space-y-4">
              <div className="border-b border-white/10 pb-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Current {PURITY_LABEL[purity]} Rate</p>
                <p className="mt-1 font-playfair text-3xl text-gold">{formatRupees(calc.baseRate)}/g</p>
              </div>
              <div className="border-b border-white/10 pb-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Approx Gold You Can Buy</p>
                <p className="mt-1 font-playfair text-3xl">{calc.grams.toFixed(2)} g</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Estimated 8g Cost</p>
                <p className="mt-1 font-playfair text-3xl">{formatRupees(calc.est8gPrice)}</p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/products?min_price=${Math.max(10000, budget - 25000)}&max_price=${budget + 15000}`}
                className="btn-gold px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-black"
              >
                Shop In This Budget
              </Link>
              <Link
                href="/products"
                className="border border-white/30 px-6 py-3 text-[12px] uppercase tracking-[0.2em] text-white transition hover:border-gold hover:text-gold"
              >
                Explore All Designs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
