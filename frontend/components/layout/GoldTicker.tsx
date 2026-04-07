'use client';
// components/layout/GoldTicker.tsx
import { useEffect, useState } from 'react';
import { goldRatesAPI } from '@/lib/api';

export default function GoldTicker() {
  const [rates, setRates] = useState({ rate_22k: 6820, rate_18k: 5580, rate_14k: 4300 });

  useEffect(() => {
    goldRatesAPI.get()
      .then(({ data }) => { if (data.data) setRates(data.data); })
      .catch(() => {});
  }, []);

  const text = `✦  22K Gold: ₹${Number(rates.rate_22k).toLocaleString('en-IN')}/g  |  18K Gold: ₹${Number(rates.rate_18k).toLocaleString('en-IN')}/g  |  14K Gold: ₹${Number(rates.rate_14k).toLocaleString('en-IN')}/g  |  BIS Hallmark Certified  |  Free Shipping above ₹10,000  |  WhatsApp: +91 98765 43210  |  Easy Returns · 7 Days  |  100% Authentic Gold  `;

  return (
    <div className="bg-black text-gold text-[11px] py-[7px] overflow-hidden" style={{ fontFamily: 'Jost, sans-serif' }}>
      <div className="ticker-wrap">
        <span className="ticker-inner">{text}{text}</span>
      </div>
    </div>
  );
}
