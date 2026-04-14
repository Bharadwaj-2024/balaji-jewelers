'use client';
// app/product/[id]/page.tsx
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link  from 'next/link';
import { productsAPI, reviewsAPI, goldRatesAPI, formatPrice, calcProductPrice } from '@/lib/api';
import { useCart }     from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth }     from '@/context/AuthContext';
import ProductCard     from '@/components/product/ProductCard';
import PurityGoldRate  from '@/components/product/PurityGoldRate';
import { TextSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

const TABS = ['description','details','care','reviews'];

export default function ProductDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { addItem, isInCart } = useCart();
  const { toggle, isWished }  = useWishlist();
  const { user } = useAuth();

  const [product,   setProduct]   = useState<any>(null);
  const [related,   setRelated]   = useState<any[]>([]);
  const [rates,     setRates]     = useState<any>(null);
  const [reviews,   setReviews]   = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('description');
  const [mainImg,   setMainImg]   = useState('');
  const [loading,   setLoading]   = useState(true);
  const [ringSize,  setRingSize]  = useState('');
  const [myRating,  setMyRating]  = useState(0);
  const [myComment, setMyComment] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      productsAPI.getById(id),
      goldRatesAPI.get(),
      reviewsAPI.get(id),
    ]).then(([{ data: pd }, { data: rd }, { data: rv }]) => {
      setProduct(pd.data);
      setMainImg(pd.data.images?.[0]?.image_url || '');
      setRates(rd.data);
      setReviews(rv.data || []);
      // fetch related
      if (pd.data.category_id) {
        productsAPI.getAll({ category: pd.data.category_id, limit: 4 })
          .then(({ data }) => setRelated((data.data || []).filter((p: any) => p.id !== pd.data.id).slice(0,4)));
      }
    }).catch(() => router.push('/products'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="max-w-[1200px] mx-auto px-7 py-10">
      <div className="grid grid-cols-2 gap-12">
        <div className="skeleton aspect-square rounded-sm" />
        <div className="space-y-4 pt-4">{Array.from({length:6}).map((_,i)=><TextSkeleton key={i} width={['w-1/2','w-3/4','w-full','w-2/3','w-1/2','w-full'][i]} />)}</div>
      </div>
    </div>
  );
  if (!product) return null;

  const price   = rates ? calcProductPrice(product.gold_weight, product.purity, product.making_charges, rates) : product.price;
  const goldCost = rates ? Math.round(product.gold_weight * (product.purity==='22k'?rates.rate_22k:product.purity==='18k'?rates.rate_18k:rates.rate_14k)) : 0;
  const unitRate = product.purity === '22k' ? rates?.rate_22k : product.purity === '18k' ? rates?.rate_18k : rates?.rate_14k;
  const gst     = Math.round(price * 0.03);
  const inCart  = isInCart(product.id);
  const inWish  = isWished(product.id);
  const skuCode = `BJ${String(product.id).padStart(4,'0')}`;
  const waMsg   = encodeURIComponent(`Hi, I'm interested in ${product.name} (SKU: ${skuCode}) priced at ${formatPrice(price+gst)} from Balaji Jewellers.`);
  const waNum   = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210';

  const handleAddCart = () => {
    addItem({ id: product.id, product_id: product.id, name: product.name, purity: product.purity, gold_weight: product.gold_weight, making_charges: product.making_charges, price, image: mainImg });
  };

  const handleSubmitReview = async () => {
    if (!user) { toast.error('Please login to submit a review'); return; }
    if (!myRating) { toast.error('Please select a rating'); return; }
    try {
      await reviewsAPI.add(id, { rating: myRating, comment: myComment });
      const { data } = await reviewsAPI.get(id);
      setReviews(data.data || []);
      setMyRating(0); setMyComment('');
      toast.success('Review submitted!');
    } catch { toast.error('Failed to submit review'); }
  };

  const tabContent: Record<string, React.ReactNode> = {
    description: <p className="text-gray-500 leading-relaxed max-w-2xl" style={{fontFamily:'Cormorant Garamond,serif',fontSize:17}}>{product.description}</p>,
    details: (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[['Gold Purity', product.purity?.toUpperCase()+' BIS'],['Gross Weight',product.gold_weight+'g'],['Making Charges',formatPrice(product.making_charges)],['Occasion',product.occasion||'—'],['SKU',skuCode],['Hallmark','BIS Certified'],['Category',product.category_name||'—'],['Stock',product.stock_quantity+' available']].map(([k,v])=>(
          <div key={k} className="p-4 bg-champ rounded-sm">
            <div className="text-[10px] text-gray-400 tracking-[1px] uppercase mb-1">{k}</div>
            <div className="font-semibold text-black text-sm">{v}</div>
          </div>
        ))}
      </div>
    ),
    care: (
      <ul className="space-y-3 text-gray-500" style={{fontFamily:'Cormorant Garamond,serif',fontSize:16}}>
        {['Store in the provided velvet pouch or box when not in use.','Avoid contact with perfumes, chemicals, and household cleaners.','Clean gently with a soft, lint-free cloth.','Remove before swimming, bathing, or exercising.','Get professional cleaning and polishing every 6–12 months.'].map(t=>(
          <li key={t} className="flex gap-3"><span className="text-gold mt-0.5">✦</span>{t}</li>
        ))}
      </ul>
    ),
    reviews: (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {reviews.map(r=>(
            <div key={r.id} className="p-5 border border-gold/20 rounded-sm">
              <div className="flex gap-3 mb-3 items-center">
                <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center font-playfair font-bold text-black text-sm">
                  {r.user_name?.[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm">{r.user_name}</div>
                  <div className="flex gap-0.5">{Array.from({length:5},(_,i)=><svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i<r.rating?'#C9A84C':'none'} stroke={i<r.rating?'#C9A84C':'#ddd'} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{r.comment}</p>
            </div>
          ))}
          {reviews.length===0&&<p className="text-gray-400 col-span-2">No reviews yet. Be the first to review!</p>}
        </div>
        {user && (
          <div className="border-t border-gold/20 pt-6">
            <div className="font-playfair text-lg mb-4">Write a Review</div>
            <div className="flex gap-2 mb-4">
              {[1,2,3,4,5].map(n=>(
                <button key={n} onClick={()=>setMyRating(n)}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={n<=myRating?'#C9A84C':'none'} stroke={n<=myRating?'#C9A84C':'#ddd'} strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
              ))}
            </div>
            <textarea value={myComment} onChange={e=>setMyComment(e.target.value)} placeholder="Share your experience..." rows={3} className="input-gold mb-3 resize-none" />
            <button onClick={handleSubmitReview} className="btn-gold px-6 py-2.5 text-black text-sm rounded-sm">Submit Review</button>
          </div>
        )}
      </div>
    ),
  };

  return (
    <div className="max-w-[1200px] mx-auto px-7 py-8">
      {/* Breadcrumb */}
      <div className="flex gap-2 text-[12px] text-gray-400 mb-6">
        <Link href="/" className="hover:text-gold">Home</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category_id}`} className="hover:text-gold">{product.category_name}</Link>
        <span>/</span>
        <span className="text-black">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-14">
        {/* Gallery */}
        <div>
          <div className="img-zoom aspect-square border border-gold/15 rounded-sm overflow-hidden relative mb-3">
            {mainImg
              ? <Image src={mainImg} alt={product.name} fill className="object-cover" />
              : <div className="w-full h-full bg-champ flex items-center justify-center text-7xl">💍</div>}
          </div>
          <div className="flex gap-2">
            {(product.images || []).map((img: any, i: number) => (
              <div key={i} onClick={() => setMainImg(img.image_url)}
                className={`w-16 aspect-square relative overflow-hidden cursor-pointer border-2 rounded-sm transition-colors ${mainImg===img.image_url?'border-gold':'border-transparent'}`}>
                <Image src={img.image_url} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="text-[11px] text-gold tracking-[2px] uppercase mb-2">{product.category_name} · {skuCode}</div>
          <h1 className="font-playfair text-2xl md:text-3xl font-bold leading-snug mb-3">{product.name}</h1>

          {/* Rating summary */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">{Array.from({length:5},(_,i)=><svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i<Math.round(product.avg_rating||0)?'#C9A84C':'none'} stroke={i<Math.round(product.avg_rating||0)?'#C9A84C':'#ddd'} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div>
            <span className="text-[12px] text-gray-400">{Number(product.avg_rating||0).toFixed(1)} ({product.review_count} reviews)</span>
          </div>

          <div className="gold-line mb-5" />

          <PurityGoldRate purity={product.purity} rates={rates} />

          {/* Price breakdown */}
          <div className="bg-champ p-5 rounded-sm mb-5">
            <div className="text-[10px] text-gray-400 tracking-[1px] uppercase mb-3">Price Breakdown</div>
            {[[`Gold Cost (${product.gold_weight}g × ${formatPrice(unitRate||0)})`, formatPrice(goldCost)],['Making Charges', formatPrice(product.making_charges)],['GST (3%)', formatPrice(gst)]].map(([k,v])=>(
              <div key={k} className="flex justify-between text-[13px] text-gray-500 mb-1.5"><span>{k}</span><span>{v}</span></div>
            ))}
            <div className="gold-line my-2" />
            <div className="flex justify-between font-playfair text-lg font-bold">
              <span>Total Price</span>
              <span className="text-gold">{formatPrice(price+gst)}</span>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {[['Purity',product.purity?.toUpperCase()+' BIS'],['Weight',product.gold_weight+'g'],['Occasion',product.occasion||'—'],['Stock',product.stock_quantity+' available']].map(([k,v])=>(
              <div key={k} className="p-3 border border-gold/20 rounded-sm">
                <div className="text-[10px] text-gray-400 tracking-[1px] uppercase mb-0.5">{k}</div>
                <div className="font-semibold text-sm">{v}</div>
              </div>
            ))}
          </div>

          {/* Ring size selector */}
          {product.category_id === 1 && (
            <div className="mb-5">
              <div className="text-[10px] text-gray-400 tracking-[1px] uppercase mb-2.5">Ring Size</div>
              <div className="flex flex-wrap gap-2">
                {['10','11','12','13','14','15','16','17','18'].map(s => (
                  <button key={s} onClick={() => setRingSize(s)}
                    className={`w-9 h-9 text-[12px] border-[1.5px] rounded-sm transition-all ${ringSize===s ? 'border-gold bg-gold text-black font-bold' : 'border-gray-200 text-gray-600 hover:border-gold'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button onClick={handleAddCart} className={`${inCart?'btn-black':'btn-gold'} py-4 text-[13px] font-bold tracking-wide rounded-sm ${inCart?'text-white':'text-black'}`}>
              {inCart ? '✓ Added to Cart' : '🛒 Add to Cart'}
            </button>
            <button onClick={() => { handleAddCart(); router.push('/checkout'); }} className="btn-black py-4 text-white text-[13px] font-semibold tracking-wide rounded-sm">
              ⚡ Buy Now
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <a href={`https://wa.me/${waNum}?text=${waMsg}`} target="_blank" rel="noopener noreferrer">
              <button className="btn-wa w-full py-3.5 text-[12px] font-semibold rounded-sm">💚 WhatsApp Order</button>
            </a>
            <button onClick={() => toggle(product.id)}
              className={`py-3.5 border-[1.5px] text-[12px] font-medium rounded-sm transition-all ${inWish?'border-gold bg-amber-50 text-gold':'border-gray-200 text-gray-600 hover:border-gold'}`}>
              {inWish ? '♥ Wishlisted' : '♡ Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-14">
        <div className="flex border-b border-gold/20 mb-7">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)}
              className={`px-6 py-3 text-[13px] capitalize tracking-wide transition-all border-b-2 -mb-px ${activeTab===t?'text-gold border-gold font-semibold':'text-gray-500 border-transparent hover:text-black'}`}>
              {t}
            </button>
          ))}
        </div>
        {tabContent[activeTab]}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <div className="text-center mb-8">
            <div className="text-gold text-[13px] tracking-[5px] uppercase mb-2" style={{fontFamily:'Cormorant Garamond,serif'}}>You May Also Like</div>
            <h2 className="font-playfair text-2xl font-bold">Related Pieces</h2>
            <div className="gold-line w-16 mx-auto mt-3" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map(p=><ProductCard key={p.id} product={p} mini />)}
          </div>
        </div>
      )}
    </div>
  );
}
