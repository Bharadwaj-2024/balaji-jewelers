'use client';
// app/products/page.tsx
import { Suspense } from 'react';
import ProductsClient from './ProductsClient';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>}>
      <ProductsClient />
    </Suspense>
  );
}
