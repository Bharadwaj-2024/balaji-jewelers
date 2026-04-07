'use client';
// app/wishlist/page.tsx
import { useWishlist } from '@/context/WishlistContext';
import { useCart }     from '@/context/CartContext';
import { useEffect, useState } from 'react';
import { productsAPI, goldRatesAPI, formatPrice, calcProductPrice } from '@/lib/api';
import Image from 'next/image';
import Link  from 'next/link';

export default function WishlistPage() {
  const { ids, toggle }       = useWishlist();
  const { addItem, isInCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [rates, setRates]       = useState<any>(null);

  useEffect(() => {
    goldRatesAPI.get().then(({ data }) => setRates(data.data));
  }, []);

  useEffect(() => {
    if (!ids.length) { setProducts([]); return; }
    Promise.all(ids.map(id => productsAPI.getById(id).then(r => r.data.data).catch(() => null)))
      .then(results => setProducts(results.filter(Boolean)));
  }, [ids]);

  if (!ids.length) return (
    <div className="max-w-[1200px] mx-auto px-7 py-20 text-center">
      <div className="text-7xl mb-5">♡</div>
      <h2 className="font-playfair text-3xl font-bold mb-3">Your wishlist is empty</h2>
      <p className="text-gray-500 mb-8">Save pieces you love and revisit them anytime</p>
      <Link href="/products" className="btn-gold px-8 py-3.5 text-black font-semibold text-sm rounded-sm inline-block">Browse Collections</Link>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-7 py-10">
      <h1 className="font-playfair text-3xl font-bold mb-8">My Wishlist <span className="text-gold text-xl">({ids.length})</span></h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {products.map(p => {
          const price  = rates ? calcProductPrice(p.gold_weight, p.purity, p.making_charges, rates) : p.price;
          const inCart = isInCart(p.id);
          const img    = p.images?.[0]?.image_url;
          return (
            <div key={p.id} className="card-hover bg-white rounded-sm overflow-hidden">
              <div className="img-zoom h-52 bg-champ relative">
                {img ? <Image src={img} alt={p.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">💍</div>}
                <button onClick={() => toggle(p.id)} className="absolute top-2.5 right-2.5 bg-white rounded-full w-8 h-8 flex items-center justify-center text-red-400 shadow-sm hover:scale-110 transition-transform">
                  ♥
                </button>
              </div>
              <div className="p-4">
                <div className="text-[10px] text-gold tracking-[1px] uppercase mb-1">{p.purity?.toUpperCase()} · {p.gold_weight}g</div>
                <Link href={`/product/${p.id}`} className="font-playfair text-[14px] font-semibold hover:text-gold transition-colors block mb-3">{p.name}</Link>
                <div className="font-bold text-lg mb-3">{formatPrice(price)}</div>
                <div className="flex gap-2">
                  <button onClick={() => { addItem({id:p.id,product_id:p.id,name:p.name,purity:p.purity,gold_weight:p.gold_weight,making_charges:p.making_charges,price,image:img}); }}
                    className={`flex-1 py-2 text-[12px] font-semibold rounded-sm ${inCart?'btn-black text-white':'btn-gold text-black'}`}>
                    {inCart ? '✓ In Cart' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
