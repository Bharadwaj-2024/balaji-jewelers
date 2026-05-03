'use client';
// app/products/ProductsClient.tsx
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { productsAPI, categoriesAPI } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import './products.css';

const PURITIES  = ['22k','18k','14k'];
const OCCASIONS = ['Wedding','Daily Wear','Festive','Anniversary'];
const PURITY_LABELS: Record<string,string> = { '22k':'22K Gold','18k':'18K Gold','14k':'14K Gold' };
const OCCASION_ICONS: Record<string,string> = {
  'Wedding':'💍','Daily Wear':'☀️','Festive':'🪔','Anniversary':'🌹'
};

/* ── Custom Checkbox ── */
function GoldCheckbox({ checked, label, icon, count, onChange }: {
  checked: boolean; label: string; icon?: string; count?: number; onChange: () => void;
}) {
  return (
    <label
      onClick={onChange}
      className="flex items-center gap-2.5 cursor-pointer group mb-1"
      style={{ userSelect: 'none' }}
    >
      {/* Custom box */}
      <span style={{
        width: 18, height: 18, flexShrink: 0, borderRadius: 4,
        border: checked ? '2px solid #C9A84C' : '1.5px solid #d1c9b4',
        background: checked ? '#C9A84C' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s',
        boxShadow: checked ? '0 2px 8px rgba(201,168,76,0.3)' : 'none',
      }}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span style={{
        fontSize: 13, color: checked ? '#7a5c00' : '#555',
        fontFamily:"'Jost',sans-serif", fontWeight: checked ? 600 : 400,
        transition: 'color 0.15s',
      }} className="group-hover:text-[#7a5c00]">
        {icon && <span className="mr-1">{icon}</span>}
        {label}
        {count !== undefined && (
          <span style={{ color:'#bbb', fontWeight:400, fontSize:11, marginLeft:4 }}>({count})</span>
        )}
      </span>
    </label>
  );
}

/* ── Filter Section Header ── */
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 9, letterSpacing: 3, color: '#C9A84C', fontWeight: 700,
        fontFamily:"'Jost',sans-serif", textTransform:'uppercase', marginBottom: 10,
        display:'flex', alignItems:'center', gap:6,
      }}>
        <span style={{ flex:1, height:1, background:'linear-gradient(90deg,#C9A84C,transparent)' }}/>
        {title}
        <span style={{ flex:1, height:1, background:'linear-gradient(90deg,transparent,#C9A84C)' }}/>
      </div>
      {children}
    </div>
  );
}

export default function ProductsClient() {
  const searchParams = useSearchParams();

  const [products,   setProducts]   = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);

  // Filters
  const [selCats,    setSelCats]    = useState<number[]>(searchParams.get('category') ? [Number(searchParams.get('category'))] : []);
  const [selPurity,  setSelPurity]  = useState<string[]>(searchParams.get('purity') ? [searchParams.get('purity')!] : []);
  const [selOcc,     setSelOcc]     = useState<string[]>(searchParams.get('occasion') ? [searchParams.get('occasion')!] : []);
  const [minPrice,   setMinPrice]   = useState(searchParams.get('min_price') || '');
  const [maxPrice,   setMaxPrice]   = useState(searchParams.get('max_price') || '');
  const [sort,       setSort]       = useState('created_at');
  const [sortOrder,  setSortOrder]  = useState('DESC');
  const [isFeatured, setIsFeatured] = useState(searchParams.get('is_featured') === 'true');
  const [isNew,      setIsNew]      = useState(searchParams.get('is_new') === 'true');
  const [search,     setSearch]     = useState(searchParams.get('search') || '');

  const LIMIT = 12;

  useEffect(() => {
    categoriesAPI.get().then(({ data }) => setCategories(data.data || [])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit: LIMIT, sort, order: sortOrder };
      if (selCats.length === 1)   params.category    = selCats[0];
      if (selPurity.length === 1) params.purity      = selPurity[0];
      if (selOcc.length === 1)    params.occasion    = selOcc[0];
      if (minPrice)               params.min_price   = minPrice;
      if (maxPrice)               params.max_price   = maxPrice;
      if (isFeatured)             params.is_featured = true;
      if (isNew)                  params.is_new      = true;
      if (search)                 params.search      = search;

      const { data } = await productsAPI.getAll(params);
      setProducts(data.data || []);
      setTotal(data.pagination?.total || 0);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [selCats, selPurity, selOcc, minPrice, maxPrice, sort, sortOrder, isFeatured, isNew, search]);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  const clearFilters = () => {
    setSelCats([]); setSelPurity([]); setSelOcc([]);
    setMinPrice(''); setMaxPrice(''); setIsFeatured(false); setIsNew(false); setSearch('');
  };

  const toggle = (arr: any[], val: any, set: (v: any[]) => void) =>
    set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);

  const totalPages = Math.ceil(total / LIMIT);
  const activeFilterCount = selCats.length + selPurity.length + selOcc.length
    + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (isFeatured ? 1 : 0) + (isNew ? 1 : 0);

  return (
    <>
      <div className="max-w-[1200px] mx-auto px-7 py-8">
        <div className="flex gap-7">

          {/* ── Sidebar ── */}
          <aside style={{ width: 230, flexShrink: 0 }}>
            <div style={{ position:'sticky', top:96 }}>

              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700 }}>
                  Filters
                  {activeFilterCount > 0 && (
                    <span style={{
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                      width:20, height:20, borderRadius:'50%', background:'#C9A84C',
                      color:'#fff', fontSize:10, fontWeight:700, marginLeft:8,
                    }}>{activeFilterCount}</span>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="clear-all-btn">Clear All</button>
                )}
              </div>

              {/* Active filter pills */}
              {activeFilterCount > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:14 }}>
                  {selCats.map(id => {
                    const cat = categories.find(c => c.id === id);
                    return cat ? (
                      <span key={id} className="badge-filter" onClick={() => toggle(selCats, id, setSelCats)}>
                        {cat.name} ×
                      </span>
                    ) : null;
                  })}
                  {selPurity.map(p => (
                    <span key={p} className="badge-filter" onClick={() => toggle(selPurity, p, setSelPurity)}>
                      {PURITY_LABELS[p]} ×
                    </span>
                  ))}
                  {selOcc.map(o => (
                    <span key={o} className="badge-filter" onClick={() => toggle(selOcc, o, setSelOcc)}>
                      {o} ×
                    </span>
                  ))}
                </div>
              )}

              <div className="filter-card">

                {/* Search */}
                <div style={{ position:'relative', marginBottom:20 }}>
                  <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:14 }}>🔍</span>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search jewellery..."
                    className="search-filter"
                  />
                </div>

                {/* Category */}
                <FilterSection title="Category">
                  {categories.map(c => (
                    <GoldCheckbox
                      key={c.id}
                      checked={selCats.includes(c.id)}
                      label={c.name}
                      count={c.product_count}
                      onChange={() => toggle(selCats, c.id, setSelCats)}
                    />
                  ))}
                </FilterSection>

                {/* Purity */}
                <FilterSection title="Gold Purity">
                  {PURITIES.map(p => (
                    <GoldCheckbox
                      key={p}
                      checked={selPurity.includes(p)}
                      label={PURITY_LABELS[p]}
                      icon={p === '22k' ? '🥇' : p === '18k' ? '🥈' : '🏅'}
                      onChange={() => toggle(selPurity, p, setSelPurity)}
                    />
                  ))}
                </FilterSection>

                {/* Occasion */}
                <FilterSection title="Occasion">
                  {OCCASIONS.map(o => (
                    <GoldCheckbox
                      key={o}
                      checked={selOcc.includes(o)}
                      label={o}
                      icon={OCCASION_ICONS[o]}
                      onChange={() => toggle(selOcc, o, setSelOcc)}
                    />
                  ))}
                </FilterSection>

                {/* Price Range */}
                <FilterSection title="Price Range (₹)">
                  <div style={{ display:'flex', gap:8 }}>
                    <div style={{ flex:1, position:'relative' }}>
                      <input
                        value={minPrice}
                        onChange={e => setMinPrice(e.target.value)}
                        placeholder="Min"
                        type="number"
                        className="price-input"
                        style={{ paddingLeft:20 }}
                      />
                      <span style={{ position:'absolute', left:7, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'#aaa' }}>₹</span>
                    </div>
                    <div style={{ flex:1, position:'relative' }}>
                      <input
                        value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                        placeholder="Max"
                        type="number"
                        className="price-input"
                        style={{ paddingLeft:20 }}
                      />
                      <span style={{ position:'absolute', left:7, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'#aaa' }}>₹</span>
                    </div>
                  </div>
                </FilterSection>

                {/* Toggle pills */}
                <FilterSection title="Special">
                  <label className={`toggle-pill ${isFeatured ? 'active' : ''}`} onClick={() => setIsFeatured(p => !p)}>
                    <span style={{ fontSize:14 }}>⭐</span>
                    <span style={{ flex:1 }}>Featured Only</span>
                    <span className={`pill-switch ${isFeatured ? 'pill-switch-on' : 'pill-switch-off'}`}>
                      <span className={`pill-knob ${isFeatured ? 'pill-knob-on' : 'pill-knob-off'}`} />
                    </span>
                  </label>
                  <label className={`toggle-pill ${isNew ? 'active' : ''}`} style={{ marginTop:6 }} onClick={() => setIsNew(p => !p)}>
                    <span style={{ fontSize:14 }}>✨</span>
                    <span style={{ flex:1 }}>New Arrivals</span>
                    <span className={`pill-switch ${isNew ? 'pill-switch-on' : 'pill-switch-off'}`}>
                      <span className={`pill-knob ${isNew ? 'pill-knob-on' : 'pill-knob-off'}`} />
                    </span>
                  </label>
                </FilterSection>

              </div>
            </div>
          </aside>

          {/* ── Products ── */}
          <div style={{ flex:1 }}>

            {/* Sort bar */}
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              marginBottom:24, padding:'14px 20px',
              background:'#fff', borderRadius:10,
              border:'1px solid rgba(201,168,76,0.15)',
              boxShadow:'0 2px 12px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:'#555' }}>
                Showing{' '}
                <strong style={{ color:'#1a1a1a', fontFamily:"'Playfair Display',serif" }}>{total}</strong>
                {' '}pieces
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <select value={sort} onChange={e => setSort(e.target.value)} className="sort-select">
                  <option value="created_at">Newest First</option>
                  <option value="price">By Price</option>
                  <option value="name">By Name</option>
                </select>
                <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="sort-select">
                  <option value="DESC">High to Low</option>
                  <option value="ASC">Low to High</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            {loading
              ? <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
              : products.length === 0
              ? <div className="text-center py-20">
                  <div className="text-6xl mb-4">💍</div>
                  <div className="font-playfair text-2xl mb-2">No products found</div>
                  <div className="text-gray-500 mb-6">Try adjusting your filters</div>
                  <button onClick={clearFilters} className="btn-gold px-8 py-3 text-black text-sm rounded-sm font-semibold">
                    Clear Filters
                  </button>
                </div>
              : <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
            }

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:40 }}>
                <button
                  onClick={() => fetchProducts(page - 1)}
                  disabled={page === 1}
                  style={{
                    width:38, height:38, borderRadius:8, border:'1.5px solid rgba(201,168,76,0.3)',
                    background: page === 1 ? '#f5f5f5' : '#fff',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    fontSize:16, color: page === 1 ? '#ccc' : '#C9A84C',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all 0.2s',
                  }}
                >‹</button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => fetchProducts(n)}
                    style={{
                      width:38, height:38, borderRadius:8,
                      border: n === page ? 'none' : '1.5px solid rgba(201,168,76,0.25)',
                      background: n === page
                        ? 'linear-gradient(135deg,#C9A84C,#E5C97A)'
                        : '#fff',
                      color: n === page ? '#1a1a1a' : '#666',
                      fontWeight: n === page ? 700 : 400,
                      fontSize:13, cursor:'pointer',
                      fontFamily:"'Jost',sans-serif",
                      boxShadow: n === page ? '0 4px 12px rgba(201,168,76,0.35)' : 'none',
                      transition:'all 0.2s',
                    }}
                  >{n}</button>
                ))}

                <button
                  onClick={() => fetchProducts(page + 1)}
                  disabled={page === totalPages}
                  style={{
                    width:38, height:38, borderRadius:8, border:'1.5px solid rgba(201,168,76,0.3)',
                    background: page === totalPages ? '#f5f5f5' : '#fff',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    fontSize:16, color: page === totalPages ? '#ccc' : '#C9A84C',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all 0.2s',
                  }}
                >›</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
