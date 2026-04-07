// app/page.tsx
import type { Metadata } from 'next';
import HeroBanner from '@/components/home/HeroBanner';
import HomeClient from '@/components/home/HomeClient';

export const metadata: Metadata = {
  title: 'Balaji Jewellers — BIS Hallmark Certified Gold Jewellery',
  description: 'Shop authentic 22K & 18K gold jewellery. Rings, necklaces, earrings, bangles, pendants and chains. BIS Hallmark certified. Free shipping above ₹10,000.',
};

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <HomeClient />
    </>
  );
}
