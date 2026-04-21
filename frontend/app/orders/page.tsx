'use client';
// app/orders/page.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersAPI, formatPrice } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

const STATUS_COLORS: Record<string,{bg:string;txt:string}> = {
  pending:    { bg:'#FFF3CD', txt:'#856404' },
  processing: { bg:'#CCE5FF', txt:'#004085' },
  shipped:    { bg:'#D4EDDA', txt:'#155724' },
  delivered:  { bg:'#D1ECF1', txt:'#0C5460' },
  cancelled:  { bg:'#F8D7DA', txt:'#721C24' },
};
const STEPS = ['Order Placed','Processing','Shipped','Delivered'];

export default function OrdersPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [detail, setDetail] = useState<Record<number, any>>({});

  useEffect(() => {
    if (!user) { router.push('/auth'); return; }
    ordersAPI.getMy()
      .then(({ data }) => setOrders(data.data || []))
      .finally(() => setLoading(false));
  }, [user]);

  const loadDetail = async (id: number) => {
    if (detail[id]) { setExpanded(expanded === id ? null : id); return; }
    const { data } = await ordersAPI.getById(id);
    setDetail(prev => ({ ...prev, [id]: data.data }));
    setExpanded(id);
  };

  const stepIdx = (status: string) => ['pending','processing','shipped','delivered'].indexOf(status);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-[900px] mx-auto px-7 py-10">
      <h1 className="font-playfair text-3xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-5">📦</div>
          <div className="font-playfair text-2xl mb-3">No orders yet</div>
          <p className="text-gray-400 mb-6">Start shopping to see your orders here</p>
          <button onClick={() => router.push('/products')} className="btn-gold px-7 py-3 text-black font-semibold rounded-sm">Shop Now</button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => {
            const sc = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
            const d  = detail[o.id];
            return (
              <div key={o.id} className="bg-white rounded-sm shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="cursor-pointer flex-1" onClick={() => loadDetail(o.id)}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-playfair font-semibold">Order #{o.id}</span>
                      {o.invoice_no && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                          {o.invoice_no}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.txt }}>
                        {o.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[13px] text-gray-400">{new Date(o.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</div>
                    <div className="text-[13px] text-gray-500 mt-1 line-clamp-1">{o.product_names}</div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="font-playfair text-xl font-bold">{formatPrice(o.total_amount)}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadDetail(o.id)}
                        className="text-[11px] text-gold border border-gold/30 px-3 py-1.5 rounded-sm hover:bg-amber-50 transition-colors">
                        {expanded === o.id ? '▲ Hide' : '▼ Details'}
                      </button>
                      <button
                        onClick={() => router.push(`/orders/${o.id}/invoice`)}
                        className="text-[11px] bg-amber-500 text-black font-semibold px-3 py-1.5 rounded-sm hover:bg-amber-400 transition-colors">
                        🧾 View Bill
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detail panel */}
                {expanded === o.id && d && (
                  <div className="border-t border-gold/15 p-5">
                    {/* Stepper */}
                    {o.status !== 'cancelled' && (
                      <div className="flex items-center mb-7 gap-0">
                        {STEPS.map((step, i) => {
                          const done = i <= stepIdx(o.status);
                          return (
                            <div key={step} className="flex items-center flex-1">
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${done ? 'bg-gold text-black' : 'bg-gray-100 text-gray-400'}`}>
                                  {done ? '✓' : i+1}
                                </div>
                                <div className={`text-[10px] mt-1.5 text-center whitespace-nowrap ${done ? 'text-gold font-semibold' : 'text-gray-400'}`}>{step}</div>
                              </div>
                              {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 ${i < stepIdx(o.status) ? 'bg-gold' : 'bg-gray-200'}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-3 mb-5">
                      {(d.items || []).map((item: any) => (
                        <div key={item.id} className="flex gap-4 items-center">
                          <div className="w-14 h-14 relative rounded-sm overflow-hidden bg-champ flex-shrink-0">
                            {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center">💍</div>}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{item.name}</div>
                            <div className="text-[12px] text-gray-400">{item.purity?.toUpperCase()} · ×{item.quantity}</div>
                          </div>
                          <div className="font-semibold">{formatPrice(item.price * item.quantity)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Address */}
                    {d.address_line1 && (
                      <div className="text-[13px] text-gray-500 border-t border-gray-100 pt-4">
                        <div className="font-semibold text-black mb-1">Delivery to</div>
                        {d.full_name} · {d.phone}<br />
                        {d.address_line1}{d.address_line2 ? ', '+d.address_line2 : ''}<br />
                        {d.city}, {d.state} – {d.pincode}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
