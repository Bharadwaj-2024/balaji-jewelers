'use client';
// app/admin/page.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth }   from '@/context/AuthContext';
import { adminAPI, productsAPI, ordersAPI, goldRatesAPI, categoriesAPI, formatPrice } from '@/lib/api';
import toast from 'react-hot-toast';

type Tab = 'overview'|'products'|'orders'|'gold'|'users';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [tab, setTab]         = useState<Tab>('overview');
  const [stats, setStats]     = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders]   = useState<any[]>([]);
  const [users, setUsers]     = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [rates, setRates]     = useState<any>(null);
  const [newRates, setNewRates] = useState({ rate_22k:'', rate_18k:'', rate_14k:'' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/auth'); return; }
    if (!isAdmin) { router.push('/'); return; }
    loadData();
  }, [user, isAdmin]);

  const loadData = async () => {
    try {
      const [s, p, o, u, c, r] = await Promise.all([
        adminAPI.stats(), productsAPI.getAll({ limit: 50 }), ordersAPI.getAll(),
        adminAPI.users(), categoriesAPI.get(), goldRatesAPI.get(),
      ]);
      setStats(s.data.data);
      setProducts(p.data.data || []);
      setOrders(o.data.data || []);
      setUsers(u.data.data || []);
      setCategories(c.data.data || []);
      setRates(r.data.data);
      setNewRates({ rate_22k: r.data.data?.rate_22k, rate_18k: r.data.data?.rate_18k, rate_14k: r.data.data?.rate_14k });
    } catch { toast.error('Failed to load data'); }
  };

  const updateStatus = async (orderId: number, status: string) => {
    await ordersAPI.updateStatus(orderId, { status });
    setOrders(prev => prev.map(o => o.id===orderId ? {...o,status} : o));
    toast.success('Order status updated');
  };

  const updateGoldRates = async () => {
    setLoading(true);
    try {
      await goldRatesAPI.update(newRates);
      toast.success('Gold rates updated! Prices will refresh within 1 hour.');
    } catch { toast.error('Failed to update rates'); }
    finally { setLoading(false); }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await productsAPI.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Product deleted');
  };

  const TABS: [Tab, string, string][] = [
    ['overview','Overview','📊'],['products','Products','💍'],
    ['orders','Orders','📦'],['gold','Gold Rates','🪙'],['users','Users','👥'],
  ];

  const STATUS_OPTS = ['pending','processing','shipped','delivered','cancelled'];
  const SC: Record<string,{bg:string;txt:string}> = {
    pending:{bg:'#FFF3CD',txt:'#856404'},processing:{bg:'#CCE5FF',txt:'#004085'},
    shipped:{bg:'#D4EDDA',txt:'#155724'},delivered:{bg:'#D1ECF1',txt:'#0C5460'},cancelled:{bg:'#F8D7DA',txt:'#721C24'},
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-[220px] bg-black flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-5 border-b border-gold/15">
          <div style={{ fontFamily:'Playfair Display,serif', color:'#C9A84C', fontSize:16, fontWeight:700, letterSpacing:2 }}>BALAJI</div>
          <div className="text-white/40 text-[10px] tracking-[2px]">ADMIN PANEL</div>
        </div>
        <nav className="p-3 space-y-1">
          {TABS.map(([t, label, icon]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-left text-[13px] transition-all ${tab===t?'bg-gold text-black font-semibold':'text-white/60 hover:bg-white/5 hover:text-white'}`}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div className="p-4 mt-auto border-t border-gold/15">
          <div className="text-white/40 text-[11px]">Logged in as</div>
          <div className="text-white/70 text-[13px] font-semibold">{user?.name}</div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">

        {/* ── Overview ── */}
        {tab === 'overview' && stats && (
          <div>
            <h1 className="font-playfair text-2xl font-bold mb-7">Dashboard Overview</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
              {[
                ['Total Orders', stats.orders.total, '📦', '#CCE5FF','#004085'],
                ['Revenue', formatPrice(stats.revenue), '💰', '#D4EDDA','#155724'],
                ['Products', stats.products.total, '💍', '#FFF3CD','#856404'],
                ['Customers', stats.users, '👥', '#F3E5F5','#6A1B9A'],
              ].map(([label,val,icon,bg,txt])=>(
                <div key={String(label)} className="bg-white p-5 rounded-sm shadow-sm border-l-4" style={{borderColor:String(txt)}}>
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="text-2xl font-playfair font-bold">{val}</div>
                  <div className="text-gray-500 text-sm">{label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-sm shadow-sm">
              <div className="font-playfair text-lg font-semibold mb-4">Recent Orders</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Order ID','Customer','Amount','Status','Date'].map(h=><th key={h} className="text-left py-2 text-gray-400 font-medium text-[12px]">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(stats.recentOrders||[]).map((o: any)=>(
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 font-mono text-[12px]">#{o.id}</td>
                      <td className="py-3">{o.user_name}</td>
                      <td className="py-3 font-semibold">{formatPrice(o.total_amount)}</td>
                      <td className="py-3"><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{background:SC[o.status]?.bg,color:SC[o.status]?.txt}}>{o.status}</span></td>
                      <td className="py-3 text-gray-400">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Products ── */}
        {tab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-7">
              <h1 className="font-playfair text-2xl font-bold">Products ({products.length})</h1>
            </div>
            <div className="bg-white rounded-sm shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Name','Category','Purity','Weight','Price','Stock','Featured','Actions'].map(h=>(
                      <th key={h} className="text-left py-3 px-4 text-gray-400 font-medium text-[12px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p=>(
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-[13px] max-w-[160px] truncate">{p.name}</td>
                      <td className="py-3 px-4 text-gray-500 text-[12px]">{p.category_name}</td>
                      <td className="py-3 px-4"><span className="bg-champ text-[11px] px-2 py-0.5 rounded">{p.purity?.toUpperCase()}</span></td>
                      <td className="py-3 px-4 text-gray-500">{p.gold_weight}g</td>
                      <td className="py-3 px-4 font-semibold">{formatPrice(p.price)}</td>
                      <td className="py-3 px-4"><span className={`text-[11px] font-semibold ${p.stock_quantity===0?'text-red-500':'text-green-600'}`}>{p.stock_quantity}</span></td>
                      <td className="py-3 px-4">{p.is_featured?'⭐':'—'}</td>
                      <td className="py-3 px-4">
                        <button onClick={()=>deleteProduct(p.id)} className="text-red-400 text-[11px] hover:text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {tab === 'orders' && (
          <div>
            <h1 className="font-playfair text-2xl font-bold mb-7">Orders ({orders.length})</h1>
            <div className="bg-white rounded-sm shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Order ID','Customer','Items','Total','Payment','Status','Update'].map(h=>(
                      <th key={h} className="text-left py-3 px-4 text-gray-400 font-medium text-[12px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o=>(
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-[12px]">#{o.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[13px]">{o.user_name}</div>
                        <div className="text-gray-400 text-[11px]">{o.user_email}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{o.item_count}</td>
                      <td className="py-3 px-4 font-semibold">{formatPrice(o.total_amount)}</td>
                      <td className="py-3 px-4"><span className={`text-[11px] ${o.payment_status==='paid'?'text-green-600':'text-yellow-600'}`}>{o.payment_status}</span></td>
                      <td className="py-3 px-4"><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{background:SC[o.status]?.bg,color:SC[o.status]?.txt}}>{o.status}</span></td>
                      <td className="py-3 px-4">
                        <select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)}
                          className="text-[12px] border border-gray-200 rounded px-2 py-1 outline-none">
                          {STATUS_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Gold Rates ── */}
        {tab === 'gold' && (
          <div className="max-w-[500px]">
            <h1 className="font-playfair text-2xl font-bold mb-7">Gold Rates</h1>
            <div className="bg-white p-7 rounded-sm shadow-sm">
              <div className="text-gray-400 text-[13px] mb-5">
                Last updated: {rates?.updated_at ? new Date(rates.updated_at).toLocaleString('en-IN') : '—'}
              </div>
              {[['22K Gold (per gram)', 'rate_22k'],['18K Gold (per gram)', 'rate_18k'],['14K Gold (per gram)', 'rate_14k']].map(([label,key])=>(
                <div key={key} className="mb-5">
                  <label className="block text-[12px] text-gray-500 mb-1.5 tracking-wide">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="number" value={(newRates as any)[key]}
                      onChange={e => setNewRates(p => ({...p, [key]: e.target.value}))}
                      className="input-gold pl-7" />
                  </div>
                </div>
              ))}
              <button onClick={updateGoldRates} disabled={loading} className="btn-gold w-full py-3.5 text-black font-bold text-sm rounded-sm disabled:opacity-60">
                {loading ? 'Updating...' : '🪙 Update Gold Rates'}
              </button>
              <div className="mt-4 p-3 bg-amber-50 rounded-sm text-[12px] text-amber-700">
                ⚠️ Updating gold rates will affect live prices for all products. Rates are cached for 1 hour.
              </div>
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <div>
            <h1 className="font-playfair text-2xl font-bold mb-7">Users ({users.length})</h1>
            <div className="bg-white rounded-sm shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['ID','Name','Email','Phone','Role','Joined'].map(h=>(
                      <th key={h} className="text-left py-3 px-4 text-gray-400 font-medium text-[12px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u=>(
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-400">#{u.id}</td>
                      <td className="py-3 px-4 font-semibold">{u.name}</td>
                      <td className="py-3 px-4 text-gray-500">{u.email}</td>
                      <td className="py-3 px-4 text-gray-500">{u.phone||'—'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${u.role==='admin'?'bg-gold/20 text-gold':'bg-gray-100 text-gray-500'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
