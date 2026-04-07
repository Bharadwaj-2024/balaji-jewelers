'use client';
// components/product/ProductCard.tsx
import Image from 'next/image';
import Link  from 'next/link';
import { formatPrice } from '@/lib/api';
import { useCart }     from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

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

  const inCart  = isInCart(p.id);
  const inWish  = isWished(p.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
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

  return (
    <div className="card-hover bg-white relative rounded-sm overflow-hidden group">
      {/* Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex gap-1.5">
        {p.is_new     && <span className="bg-gold text-black text-[9px] font-bold tracking-[1.5px] px-2 py-0.5">NEW</span>}
        {p.is_featured && <span className="bg-black text-gold text-[9px] font-bold tracking-[1px] px-2 py-0.5">FEATURED</span>}
      </div>

      {/* Wishlist */}
      <button
        onClick={e => { e.preventDefault(); toggle(p.id); }}
        className="absolute top-2.5 right-2.5 z-10 bg-white/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
      >
        <svg width="14" height="14" viewBox="0 0 24 24"
          fill={inWish ? '#C9A84C' : 'none'}
          stroke={inWish ? '#C9A84C' : '#aaa'}
          strokeWidth="2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      <Link href={`/product/${p.id}`} className="block">
        {/* Image */}
        <div className={`img-zoom ${mini ? 'h-44' : 'h-52'} bg-champ relative`}>
          {p.primary_image ? (
            <Image
              src={p.primary_image}
              alt={p.name}
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">💍</div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="text-[10px] text-gold tracking-[1px] uppercase mb-1 font-jost">
            {p.category_name} · {p.purity.toUpperCase()} · {p.gold_weight}g
          </div>
          <h3 className="font-playfair text-[14px] font-semibold text-black leading-snug mb-3 line-clamp-2">
            {p.name}
          </h3>

          {/* Rating */}
          {p.avg_rating !== undefined && p.avg_rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} width="11" height="11" viewBox="0 0 24 24"
                  fill={i < Math.round(p.avg_rating!) ? '#C9A84C' : 'none'}
                  stroke={i < Math.round(p.avg_rating!) ? '#C9A84C' : '#ddd'}
                  strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
              <span className="text-[11px] text-gray-400 font-jost">({p.review_count})</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <div className="font-jost text-[16px] font-bold text-black">{formatPrice(p.price)}</div>
              <div className="text-[10px] text-gray-400 font-jost">Incl. making charges</div>
            </div>
            <button
              onClick={handleAddToCart}
              className={`${inCart ? 'btn-black text-white' : 'btn-gold text-black'} px-3 py-2 rounded-sm text-[11px] font-semibold tracking-[0.3px] opacity-0 group-hover:opacity-100 transition-opacity`}
            >
              {inCart ? '✓ Added' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
