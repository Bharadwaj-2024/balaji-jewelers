'use client';
// app/cart/page.tsx
import { useCart }   from '@/context/CartContext';
import { formatPrice } from '@/lib/api';
import Image  from 'next/image';
import Link   from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, count } = useCart();
  const router = useRouter();

  const gst      = Math.round(subtotal * 0.03);
  const shipping  = subtotal > 10000 ? 0 : 299;
  const total     = subtotal + gst + shipping;

  if (!count) return (
    <div className="max-w-[1200px] mx-auto px-7 py-20 text-center">
      <div className="text-7xl mb-6">🛒</div>
      <h2 className="font-playfair text-3xl font-bold mb-3">Your cart is empty</h2>
      <p className="text-gray-500 mb-8">Explore our collections and add pieces you love</p>
      <Link href="/products" className="btn-gold px-8 py-3.5 text-black font-semibold text-sm rounded-sm inline-block">Explore Collections</Link>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-7 py-10">
      <h1 className="font-playfair text-3xl font-bold mb-8">Your Cart <span className="text-gold text-xl">({count})</span></h1>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items */}
        <div className="flex-1 space-y-4">
          {items.map(item => (
            <div key={item.product_id} className="bg-white p-5 flex gap-5 items-start rounded-sm shadow-sm">
              <div className="w-24 h-24 relative flex-shrink-0 rounded-sm overflow-hidden bg-champ">
                {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">💍</div>}
              </div>
              <div className="flex-1">
                <div className="font-playfair text-[16px] font-semibold mb-1">{item.name}</div>
                <div className="text-[11px] text-gold tracking-wide mb-3">{item.purity?.toUpperCase()} · {item.gold_weight}g</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 border border-gold/30 rounded-sm">
                    <button onClick={() => updateQty(item.product_id, item.quantity-1)} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gold/10">−</button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product_id, item.quantity+1)} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gold/10">+</button>
                  </div>
                  <div className="font-bold text-[17px]">{formatPrice(item.price * item.quantity)}</div>
                  <button onClick={() => removeItem(item.product_id)} className="text-red-400 text-[12px] hover:text-red-600">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="w-full lg:w-[320px]">
          <div className="bg-white p-6 rounded-sm shadow-sm">
            <div className="font-playfair text-xl font-semibold mb-5">Order Summary</div>
            {[['Subtotal', formatPrice(subtotal)],['GST (3%)', formatPrice(gst)],['Shipping', shipping===0?'FREE':formatPrice(shipping)]].map(([k,v])=>(
              <div key={k} className="flex justify-between text-sm text-gray-500 mb-3"><span>{k}</span><span className={v==='FREE'?'text-green-600 font-semibold':''}>{v}</span></div>
            ))}
            {subtotal < 10000 && <div className="text-[11px] text-gray-400 mb-3">Add {formatPrice(10000-subtotal)} more for free shipping</div>}
            <div className="gold-line my-4" />
            <div className="flex justify-between font-playfair text-lg font-bold mb-5">
              <span>Total</span><span className="text-gold">{formatPrice(total)}</span>
            </div>
            <button onClick={() => router.push('/checkout')} className="btn-gold w-full py-4 text-black font-bold text-sm tracking-wide rounded-sm">
              Proceed to Checkout →
            </button>
            <Link href="/products" className="block text-center text-[12px] text-gray-400 hover:text-gold mt-4 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
