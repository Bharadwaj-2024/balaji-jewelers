'use client';
// app/checkout/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart }   from '@/context/CartContext';
import { useAuth }   from '@/context/AuthContext';
import { addressesAPI, ordersAPI, couponsAPI, formatPrice } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const router   = useRouter();

  const [addresses,   setAddresses]   = useState<any[]>([]);
  const [selAddress,  setSelAddress]  = useState<number | null>(null);
  const [payMethod,   setPayMethod]   = useState('cod');
  const [coupon,      setCoupon]      = useState('');
  const [discount,    setDiscount]    = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [placing,     setPlacing]     = useState(false);
  const [ordered,     setOrdered]     = useState<number | null>(null);

  // New address form
  const [newAddr, setNewAddr] = useState({ full_name: user?.name||'', phone: user?.phone||'', address_line1: '', address_line2: '', city: '', state: '', pincode: '', is_default: false });

  useEffect(() => {
    if (!user) { router.push('/auth'); return; }
    addressesAPI.get().then(({ data }) => {
      setAddresses(data.data || []);
      const def = data.data?.find((a: any) => a.is_default);
      if (def) setSelAddress(def.id);
    });
  }, [user]);

  const gst      = Math.round((subtotal - discount) * 0.03);
  const shipping  = subtotal > 10000 ? 0 : 299;
  const total     = subtotal - discount + gst + shipping;

  const applyCoupon = async () => {
    try {
      const { data } = await couponsAPI.validate(coupon, subtotal);
      setDiscount(data.data.discount);
      setCouponApplied(true);
      toast.success(`Coupon applied! You save ${formatPrice(data.data.discount)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    }
  };

  const saveAndSelectAddress = async () => {
    if (!newAddr.address_line1 || !newAddr.city || !newAddr.pincode) { toast.error('Please fill address details'); return; }
    const { data } = await addressesAPI.add(newAddr);
    const { data: aData } = await addressesAPI.get();
    setAddresses(aData.data || []);
    setSelAddress(data.addressId);
    toast.success('Address saved!');
  };

  const placeOrder = async () => {
    if (!selAddress) { toast.error('Please select a delivery address'); return; }
    if (!items.length) { toast.error('Your cart is empty'); return; }
    setPlacing(true);
    try {
      const { data } = await ordersAPI.create({
        address_id:     selAddress,
        payment_method: payMethod,
        coupon_code:    couponApplied ? coupon : undefined,
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      clearCart();
      setOrdered(data.orderId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (ordered) return (
    <div className="max-w-[560px] mx-auto px-7 py-20 text-center">
      <div className="text-7xl mb-6">🎉</div>
      <h2 className="font-playfair text-3xl font-bold mb-3">Order Placed!</h2>
      <p className="text-gray-500 mb-2">Order #{ordered} confirmed.</p>
      <p className="text-gray-400 text-sm mb-8">You'll receive a confirmation WhatsApp / email shortly.</p>
      <div className="flex gap-4 justify-center">
        <button onClick={() => router.push('/orders')} className="btn-gold px-6 py-3 text-black font-semibold text-sm rounded-sm">View Orders</button>
        <button onClick={() => router.push('/products')} className="btn-black px-6 py-3 text-white text-sm rounded-sm">Continue Shopping</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-7 py-10">
      <h1 className="font-playfair text-3xl font-bold mb-8">Checkout</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left */}
        <div className="flex-1 space-y-8">
          {/* Address */}
          <div className="bg-white p-6 rounded-sm shadow-sm">
            <div className="font-playfair text-xl font-semibold mb-5">Delivery Address</div>
            {addresses.map(a => (
              <label key={a.id} className={`flex gap-3 p-4 mb-3 border-[1.5px] rounded-sm cursor-pointer transition-all ${selAddress===a.id?'border-gold bg-amber-50':'border-gray-200'}`}>
                <input type="radio" checked={selAddress===a.id} onChange={()=>setSelAddress(a.id)} className="mt-1" />
                <div>
                  <div className="font-semibold text-sm">{a.full_name} · {a.phone}</div>
                  <div className="text-[13px] text-gray-500">{a.address_line1}{a.address_line2?', '+a.address_line2:''}</div>
                  <div className="text-[13px] text-gray-500">{a.city}, {a.state} – {a.pincode}</div>
                  {a.is_default && <span className="text-[10px] text-gold tracking-wide">DEFAULT</span>}
                </div>
              </label>
            ))}
            {/* New address form */}
            <div className="mt-4 border-t border-gold/20 pt-4">
              <div className="font-semibold text-sm mb-3">Add New Address</div>
              <div className="grid grid-cols-2 gap-3">
                {[['full_name','Full Name'],['phone','Phone'],['address_line1','Address Line 1'],['address_line2','Address Line 2 (Optional)'],['city','City'],['state','State'],['pincode','Pincode']].map(([field, label]) => (
                  <input key={field} placeholder={label}
                    value={(newAddr as any)[field]}
                    onChange={e => setNewAddr(p => ({...p, [field]: e.target.value}))}
                    className={`input-gold text-sm ${['address_line1','address_line2'].includes(field)?'col-span-2':''}`} />
                ))}
              </div>
              <button onClick={saveAndSelectAddress} className="mt-3 btn-gold px-5 py-2.5 text-black text-sm rounded-sm">Save & Use This Address</button>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white p-6 rounded-sm shadow-sm">
            <div className="font-playfair text-xl font-semibold mb-5">Payment Method</div>
            {[['cod','Cash on Delivery','🏠'],['upi','UPI / QR Code','📱'],['card','Credit / Debit Card','💳']].map(([val,label,icon])=>(
              <label key={val} className={`flex gap-3 p-4 mb-3 border-[1.5px] rounded-sm cursor-pointer transition-all ${payMethod===val?'border-gold bg-amber-50':'border-gray-200'}`}>
                <input type="radio" checked={payMethod===val} onChange={()=>setPayMethod(val)} />
                <span>{icon} {label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="w-full lg:w-[320px]">
          <div className="bg-white p-6 rounded-sm shadow-sm sticky top-24">
            <div className="font-playfair text-xl font-semibold mb-4">Order Summary</div>
            {items.map(i=>(
              <div key={i.product_id} className="flex justify-between text-sm text-gray-500 mb-2">
                <span className="line-clamp-1 flex-1 pr-2">{i.name} ×{i.quantity}</span>
                <span className="font-medium text-black">{formatPrice(i.price*i.quantity)}</span>
              </div>
            ))}
            <div className="gold-line my-4" />
            {/* Coupon */}
            {!couponApplied && (
              <div className="flex gap-2 mb-4">
                <input value={coupon} onChange={e=>setCoupon(e.target.value)} placeholder="Coupon code" className="input-gold text-[12px] flex-1" />
                <button onClick={applyCoupon} className="btn-gold px-3 py-2 text-black text-[12px] rounded-sm">Apply</button>
              </div>
            )}
            {couponApplied && <div className="text-green-600 text-[12px] mb-4 font-semibold">✓ Coupon applied! −{formatPrice(discount)}</div>}
            {[['Subtotal',formatPrice(subtotal)],['Discount',discount>0?`−${formatPrice(discount)}`:'—'],['GST (3%)',formatPrice(gst)],['Shipping',shipping===0?'FREE':formatPrice(shipping)]].map(([k,v])=>(
              <div key={k} className="flex justify-between text-sm text-gray-500 mb-2"><span>{k}</span><span className={v==='FREE'?'text-green-600 font-semibold':''}>{v}</span></div>
            ))}
            <div className="gold-line my-3" />
            <div className="flex justify-between font-playfair text-lg font-bold mb-5">
              <span>Total</span><span className="text-gold">{formatPrice(total)}</span>
            </div>
            <button onClick={placeOrder} disabled={placing} className="btn-gold w-full py-4 text-black font-bold text-sm rounded-sm disabled:opacity-60">
              {placing ? 'Placing Order...' : '✓ Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
