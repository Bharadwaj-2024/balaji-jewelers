'use client';
// components/product/ProductCard.tsx
import Image from 'next/image';
import Link  from 'next/link';
import { formatPrice }  from '@/lib/api';
import { useCart }      from '@/context/CartContext';
import { useWishlist }  from '@/context/WishlistContext';
import { useRouter }    from 'next/navigation';

interface Props {
  product: {
    id:             number;
    name:           string;
    purity:         string;
    gold_weight:    number;
    making_charges: number;
    price:          number;
    primary_image?: string;
    hover_image?:   string;
    category_name?: string;
    is_new?:        boolean;
    is_featured?:   boolean;
    avg_rating?:    number;
    review_count?:  number;
  };
  mini?: boolean;
}

export default function ProductCard({ product: p, mini = false }: Props) {
  const { addItem, isInCart } = useCart();
  const { toggle, isWished }  = useWishlist();
  const router = useRouter();

  const inCart = isInCart(p.id);
  const inWish = isWished(p.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCart) {
      addItem({
        id:             p.id,
        product_id:     p.id,
        name:           p.name,
        purity:         p.purity,
        gold_weight:    p.gold_weight,
        making_charges: p.making_charges,
        price:          p.price,
        image:          p.primary_image,
      });
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCart) {
      addItem({
        id:             p.id,
        product_id:     p.id,
        name:           p.name,
        purity:         p.purity,
        gold_weight:    p.gold_weight,
        making_charges: p.making_charges,
        price:          p.price,
        image:          p.primary_image,
      });
    }
    router.push('/checkout');
  };

  const purityColor = p.purity === '22k' ? '#b8860b' : p.purity === '18k' ? '#8a7090' : '#888';

  return (
    <>
      <style>{`
        .pc-card { transition: transform 0.28s ease, box-shadow 0.28s ease; }
        .pc-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(0,0,0,0.13); }
        .pc-img-container { overflow: hidden; }
        .pc-img-container img { transition: transform 0.5s ease; }
        .pc-card:hover .pc-img-container img { transform: scale(1.07); }
        .pc-add-btn {
          flex: 1; padding: 10px;
          font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 700;
          border: none; cursor: pointer; border-radius: 6px;
          transition: all 0.2s; letter-spacing: 0.3px;
        }
        .pc-add-btn.added {
          background: #1a1a1a; color: #C9A84C;
        }
        .pc-add-btn.not-added {
          background: linear-gradient(135deg, #C9A84C, #E5C97A, #C9A84C);
          background-size: 200%; color: #1a1a1a;
        }
        .pc-add-btn.not-added:hover {
          background-position: right;
          box-shadow: 0 4px 14px rgba(201,168,76,0.4);
          transform: translateY(-1px);
        }
        .pc-buy-btn {
          flex: 1; padding: 10px;
          font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 700;
          background: #1a1a1a; color: #fff; border: none;
          cursor: pointer; border-radius: 6px;
          transition: all 0.2s; letter-spacing: 0.3px;
        }
        .pc-buy-btn:hover { background: #333; transform: translateY(-1px); }
        .pc-wish-btn {
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(255,255,255,0.92);
          border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transition: transform 0.2s, box-shadow 0.2s; backdrop-filter: blur(4px);
        }
        .pc-wish-btn:hover { transform: scale(1.18); box-shadow: 0 4px 12px rgba(0,0,0,0.18); }
        .purity-badge {
          display: inline-flex; align-items: center; gap: 3px;
          padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700;
          font-family: 'Jost', sans-serif; letter-spacing: 0.5px;
        }
      `}</style>

      <div className="pc-card bg-white rounded-[10px] overflow-hidden relative" style={{ border:'1px solid rgba(201,168,76,0.1)' }}>

        {/* Badges */}
        <div style={{ position:'absolute', top:10, left:10, zIndex:10, display:'flex', flexDirection:'column', gap:4 }}>
          {p.is_new && (
            <span style={{
              background:'linear-gradient(135deg,#C9A84C,#E5C97A)', color:'#1a1a1a',
              fontSize:9, fontWeight:800, letterSpacing:2, padding:'3px 8px', borderRadius:4,
              fontFamily:"'Jost',sans-serif", boxShadow:'0 2px 8px rgba(201,168,76,0.4)',
            }}>NEW</span>
          )}
          {p.is_featured && (
            <span style={{
              background:'#1a1a1a', color:'#C9A84C',
              fontSize:9, fontWeight:800, letterSpacing:1.5, padding:'3px 8px', borderRadius:4,
              fontFamily:"'Jost',sans-serif",
            }}>⭐ FEATURED</span>
          )}
        </div>

        {/* Wishlist btn */}
        <button
          className="pc-wish-btn"
          style={{ position:'absolute', top:10, right:10, zIndex:10 }}
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(p.id); }}
          title={inWish ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24"
            fill={inWish ? '#C9A84C' : 'none'}
            stroke={inWish ? '#C9A84C' : '#aaa'}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        <Link href={`/product/${p.id}`} className="block">

          {/* Image */}
          <div className="pc-img-container" style={{
            height: mini ? 180 : 220,
            background:'linear-gradient(135deg,#faf5e8,#f0e8d0)',
            position:'relative',
          }}>
            {p.primary_image ? (
              <Image
                src={p.primary_image}
                alt={p.name}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover"
              />
            ) : (
              <div style={{
                width:'100%', height:'100%', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:50, opacity:0.25,
              }}>💍</div>
            )}

            {/* Gold weight overlay on hover */}
            <div style={{
              position:'absolute', bottom:0, left:0, right:0,
              background:'linear-gradient(transparent, rgba(0,0,0,0.5))',
              padding:'20px 12px 10px',
              display:'flex', alignItems:'flex-end', justifyContent:'space-between',
              opacity:0, transition:'opacity 0.25s',
            }} className="img-overlay">
            </div>
          </div>

          {/* Info */}
          <div style={{ padding:'14px 14px 10px' }}>

            {/* Category + purity row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{
                fontSize:10, color:'#aaa', fontFamily:"'Jost',sans-serif",
                textTransform:'uppercase', letterSpacing:1,
              }}>
                {p.category_name}
              </span>
              <span className="purity-badge" style={{
                background: p.purity === '22k' ? 'rgba(201,168,76,0.15)' : 'rgba(138,112,144,0.1)',
                color: purityColor, border: `1px solid ${purityColor}30`,
              }}>
                {p.purity === '22k' ? '🥇' : p.purity === '18k' ? '🥈' : '🏅'} {p.purity.toUpperCase()}
              </span>
            </div>

            {/* Name */}
            <h3 style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:14, fontWeight:600, color:'#1a1a1a',
              lineHeight:1.35, marginBottom:8,
              display:'-webkit-box', WebkitLineClamp:2,
              WebkitBoxOrient:'vertical', overflow:'hidden',
            }}>
              {p.name}
            </h3>

            {/* Weight */}
            <div style={{ fontSize:11, color:'#bbb', fontFamily:"'Jost',sans-serif", marginBottom:8 }}>
              {p.gold_weight}g · Incl. making charges
            </div>

            {/* Rating */}
            {p.avg_rating !== undefined && p.avg_rating > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:8 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <svg key={i} width="11" height="11" viewBox="0 0 24 24"
                    fill={i < Math.round(p.avg_rating!) ? '#C9A84C' : 'none'}
                    stroke={i < Math.round(p.avg_rating!) ? '#C9A84C' : '#ddd'}
                    strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
                <span style={{ fontSize:10, color:'#bbb', fontFamily:"'Jost',sans-serif" }}>({p.review_count})</span>
              </div>
            )}

            {/* Price */}
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:12 }}>
              <div>
                <div style={{
                  fontFamily:"'Jost',sans-serif", fontSize:18, fontWeight:800, color:'#1a1a1a',
                  lineHeight:1,
                }}>
                  {formatPrice(p.price)}
                </div>
                <div style={{ fontSize:9, color:'#C9A84C', fontFamily:"'Jost',sans-serif", marginTop:2, fontWeight:600, letterSpacing:0.5 }}>
                  TODAY'S PRICE
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Action Buttons — always visible */}
        <div style={{ padding:'0 14px 14px', display:'flex', gap:8 }}>
          <button
            onClick={handleAddToCart}
            className={`pc-add-btn ${inCart ? 'added' : 'not-added'}`}
          >
            {inCart ? '✓ Added to Cart' : '🛒 Add to Cart'}
          </button>
          <button
            onClick={handleBuyNow}
            className="pc-buy-btn"
          >
            Buy Now
          </button>
        </div>
      </div>
    </>
  );
}
