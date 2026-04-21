'use client';
// app/orders/[id]/invoice/page.tsx — Printable Bill / Invoice
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ordersAPI, formatPrice } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface InvoiceItem {
  name:           string;
  purity:         string;
  gold_weight:    number;
  gold_rate:      number;
  making_charges: number;
  quantity:       number;
  price:          number;
}

interface Invoice {
  order_id:        number;
  invoice_no:      string;
  bill_date:       string;
  customer_name:   string;
  customer_email:  string;
  customer_phone:  string;
  delivery_address:string;
  items_json:      InvoiceItem[];
  subtotal:        number;
  making_charges:  number;
  discount:        number;
  gst:             number;
  shipping:        number;
  total_amount:    number;
  payment_method:  string;
  coupon_code:     string | null;
}

export default function InvoicePage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuth();
  const [inv, setInv]       = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!user) { router.push('/auth'); return; }
    ordersAPI.getInvoice(id)
      .then(({ data }) => setInv(data.data))
      .catch(() => setError('Could not load invoice.'))
      .finally(() => setLoading(false));
  }, [user, id]);

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full" />
    </div>
  );

  if (error || !inv) return (
    <div className="text-center py-20 text-red-500">{error || 'Invoice not found.'}</div>
  );

  const addressLines = inv.delivery_address ? inv.delivery_address.split('\n') : [];
  const items: InvoiceItem[] = Array.isArray(inv.items_json)
    ? inv.items_json
    : JSON.parse(String(inv.items_json));

  const payLabel: Record<string, string> = {
    cod: 'Cash on Delivery',
    upi: 'UPI / QR Code',
    card: 'Credit / Debit Card',
    razorpay: 'Razorpay',
  };

  return (
    <>
      {/* Print / Screen styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .invoice-wrap { box-shadow: none !important; margin: 0 !important; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap');
      `}</style>

      {/* Action buttons */}
      <div className="no-print flex gap-3 justify-center mt-8 mb-6">
        <button onClick={() => router.back()}
          className="px-5 py-2.5 rounded-sm border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
          ← Back to Orders
        </button>
        <button onClick={handlePrint}
          className="px-6 py-2.5 rounded-sm bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 transition-colors shadow-md">
          🖨️ Print / Save PDF
        </button>
      </div>

      {/* Invoice */}
      <div className="invoice-wrap max-w-[760px] mx-auto mb-16 bg-white shadow-xl rounded-sm overflow-hidden"
           style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* Header band */}
        <div style={{ background: 'linear-gradient(135deg, #1a1a1a 60%, #3a2a00)' }} className="px-10 py-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, letterSpacing: 1 }}>
                🪙 Balaji Jewellers
              </div>
              <div style={{ fontSize: 12, color: '#c9a84c', marginTop: 4, letterSpacing: 2 }}>
                FINE GOLD &amp; SILVER JEWELLERY
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 12, lineHeight: 1.7 }}>
                123, Gold Bazaar Road, Hyderabad - 500001<br />
                Phone: +91 98765 43210 &nbsp;|&nbsp; admin@balajijewellers.com<br />
                GSTIN: 36AABCB1234F1Z5
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#c9a84c', letterSpacing: 2, textTransform: 'uppercase' }}>Tax Invoice</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                {inv.invoice_no}
              </div>
              <div style={{ fontSize: 11, color: '#ccc', marginTop: 8 }}>
                Date: {new Date(inv.bill_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ fontSize: 11, color: '#ccc' }}>Order #{inv.order_id}</div>
            </div>
          </div>
        </div>

        {/* Gold divider */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #c9a84c, #f5d98a, #c9a84c)' }} />

        {/* Customer + Delivery */}
        <div className="px-10 py-7 grid grid-cols-2 gap-8 border-b border-gray-100">
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#c9a84c', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              Bill To
            </div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{inv.customer_name}</div>
            {inv.customer_email && <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{inv.customer_email}</div>}
            {inv.customer_phone && <div style={{ fontSize: 12, color: '#666' }}>{inv.customer_phone}</div>}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#c9a84c', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              Ship To
            </div>
            {addressLines.length ? (
              addressLines.map((line, i) => (
                <div key={i} style={{ fontSize: 12, color: i === 0 ? '#222' : '#666', fontWeight: i === 0 ? 600 : 400, lineHeight: 1.7 }}>
                  {line}
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: '#999' }}>No address provided</div>
            )}
          </div>
        </div>

        {/* Items table */}
        <div className="px-10 py-6">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#faf7f0', borderBottom: '2px solid #c9a84c' }}>
                <th style={{ textAlign: 'left',   padding: '10px 8px', fontWeight: 600, color: '#7a5c00', fontSize: 11, letterSpacing: 1 }}>#</th>
                <th style={{ textAlign: 'left',   padding: '10px 8px', fontWeight: 600, color: '#7a5c00', fontSize: 11, letterSpacing: 1 }}>ITEM DESCRIPTION</th>
                <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: '#7a5c00', fontSize: 11, letterSpacing: 1 }}>WT (g)</th>
                <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: '#7a5c00', fontSize: 11, letterSpacing: 1 }}>GOLD RATE</th>
                <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: '#7a5c00', fontSize: 11, letterSpacing: 1 }}>MAKING</th>
                <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: '#7a5c00', fontSize: 11, letterSpacing: 1 }}>QTY</th>
                <th style={{ textAlign: 'right',  padding: '10px 8px', fontWeight: 600, color: '#7a5c00', fontSize: 11, letterSpacing: 1 }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0ead8' }}>
                  <td style={{ padding: '11px 8px', color: '#999' }}>{i + 1}</td>
                  <td style={{ padding: '11px 8px' }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#c9a84c', marginTop: 2 }}>{item.purity?.toUpperCase()} Gold</div>
                  </td>
                  <td style={{ padding: '11px 8px', textAlign: 'center', color: '#555' }}>{item.gold_weight}g</td>
                  <td style={{ padding: '11px 8px', textAlign: 'center', color: '#555' }}>₹{Number(item.gold_rate).toLocaleString('en-IN')}/g</td>
                  <td style={{ padding: '11px 8px', textAlign: 'center', color: '#555' }}>₹{Number(item.making_charges).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '11px 8px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '11px 8px', textAlign: 'right', fontWeight: 600 }}>
                    {formatPrice(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-10 pb-8 flex justify-end">
          <div style={{ width: 280 }}>
            <div style={{ height: 1, background: '#e8d9a0', marginBottom: 12 }} />
            {[
              ['Subtotal (Gold Value + Making)', formatPrice(inv.subtotal)],
              ...(inv.discount > 0
                ? [['Coupon Discount' + (inv.coupon_code ? ` (${inv.coupon_code})` : ''), `− ${formatPrice(inv.discount)}`]]
                : []),
              ['GST @ 3%', formatPrice(inv.gst)],
              ['Shipping', inv.shipping === 0 ? 'FREE' : formatPrice(inv.shipping)],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 7 }}>
                <span>{label}</span>
                <span style={{ color: String(val).startsWith('−') ? '#dc2626' : String(val) === 'FREE' ? '#16a34a' : '#333', fontWeight: 500 }}>{val}</span>
              </div>
            ))}
            <div style={{ height: 2, background: 'linear-gradient(90deg, #c9a84c, #f5d98a, #c9a84c)', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>
              <span>Total Amount</span>
              <span style={{ color: '#c9a84c' }}>{formatPrice(inv.total_amount)}</span>
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 6, textAlign: 'right' }}>
              Payment: {payLabel[inv.payment_method] || inv.payment_method}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#faf7f0', borderTop: '1px solid #e8d9a0', padding: '20px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#7a5c00', fontWeight: 600, letterSpacing: 2, marginBottom: 6 }}>
            THANK YOU FOR SHOPPING WITH BALAJI JEWELLERS
          </div>
          <div style={{ fontSize: 10, color: '#aaa' }}>
            All items come with a quality guarantee. Returns accepted within 7 days with original invoice.
          </div>
          <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>
            This is a computer-generated invoice. No signature required.
          </div>
        </div>
      </div>
    </>
  );
}
