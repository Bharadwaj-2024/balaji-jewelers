'use client';
// app/products/ProductsClient.tsx
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { productsAPI, categoriesAPI } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';

const PURITIES  = ['22k','18k','14k'];
const OCCASIONS = ['Wedding','Daily Wear','Festive','Anniversary'];

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
      if (selCats.length === 1)  params.category    = selCats[0];
      if (selPurity.length === 1) params.purity     = selPurity[0];
      if (selOcc.length === 1)    params.occasion   = selOcc[0];
      if (minPrice)               params.min_price  = minPrice;
      if (maxPrice)               params.max_price  = maxPrice;
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

  return (
    <div className="max-w-[1200px] mx-auto px-7 py-8">
      <div className="flex gap-8">
        {/* ── Sidebar ── */}
        <aside className="w-[210px] flex-shrink-0">
          <div className="sticky top-24">
            <div className="flex justify-between items-center mb-5">
              <div className="font-playfair text-xl font-semibold">Filters</div>
              <button onClick={clearFilters} className="text-gold text-[11px] tracking-wide hover:underline">CLEAR</button>
            </div>

            {/* Search */}
            <div className="mb-5">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="input-gold text-[13px]" />
            </div>

            {/* Category */}
            <div className="mb-5">
              <div className="text-gold text-[10px] tracking-[2px] uppercase font-semibold mb-3">Category</div>
              {categories.map(c => (
                <label key={c.id} className="flex items-center gap-2 mb-2 cursor-pointer text-[13px] text-gray-600 hover:text-black">
                  <input type="checkbox" checked={selCats.includes(c.id)} onChange={() => toggle(selCats, c.id, setSelCats)} />
                  {c.name} <span className="text-gray-400">({c.product_count})</span>
                </label>
              ))}
            </div>

            {/* Purity */}
            <div className="mb-5">
              <div className="text-gold text-[10px] tracking-[2px] uppercase font-semibold mb-3">Gold Purity</div>
              {PURITIES.map(p => (
                <label key={p} className="flex items-center gap-2 mb-2 cursor-pointer text-[13px] text-gray-600 hover:text-black">
                  <input type="checkbox" checked={selPurity.includes(p)} onChange={() => toggle(selPurity, p, setSelPurity)} />
                  {p.toUpperCase()} Gold
                </label>
              ))}
            </div>

            {/* Occasion */}
            <div className="mb-5">
              <div className="text-gold text-[10px] tracking-[2px] uppercase font-semibold mb-3">Occasion</div>
              {OCCASIONS.map(o => (
                <label key={o} className="flex items-center gap-2 mb-2 cursor-pointer text-[13px] text-gray-600 hover:text-black">
                  <input type="checkbox" checked={selOcc.includes(o)} onChange={() => toggle(selOcc, o, setSelOcc)} />
                  {o}
                </label>
              ))}
            </div>

            {/* Price Range */}
            <div className="mb-5">
              <div className="text-gold text-[10px] tracking-[2px] uppercase font-semibold mb-3">Price Range (₹)</div>
              <div className="flex gap-2">
                <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min"
                  className="input-gold text-[12px] w-1/2" type="number" />
                <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max"
                  className="input-gold text-[12px] w-1/2" type="number" />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-600">
                <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
                Featured Only
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-600">
                <input type="checkbox" checked={isNew} onChange={e => setIsNew(e.target.checked)} />
                New Arrivals
              </label>
            </div>
          </div>
        </aside>

        {/* ── Products ── */}
        <div className="flex-1">
          {/* Sort bar */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-gray-500" style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 18 }}>
              Showing <strong className="text-black">{total}</strong> pieces
            </div>
            <div className="flex gap-3 items-center">
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="input-gold w-auto text-[12px] pr-8">
                <option value="created_at">Newest First</option>
                <option value="price">Price</option>
                <option value="name">Name</option>
              </select>
              <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                className="input-gold w-auto text-[12px] pr-8">
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
                <button onClick={clearFilters} className="btn-gold px-6 py-3 text-black text-sm rounded-sm">Clear Filters</button>
              </div>
            : <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button onClick={() => fetchProducts(page - 1)} disabled={page === 1}
                className="px-4 py-2 border border-gold/30 text-sm disabled:opacity-30 hover:bg-gold hover:text-black transition-colors">
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => fetchProducts(n)}
                  className={`px-4 py-2 border text-sm transition-colors ${n === page ? 'bg-gold text-black border-gold' : 'border-gold/30 hover:bg-gold/10'}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => fetchProducts(page + 1)} disabled={page === totalPages}
                className="px-4 py-2 border border-gold/30 text-sm disabled:opacity-30 hover:bg-gold hover:text-black transition-colors">
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
