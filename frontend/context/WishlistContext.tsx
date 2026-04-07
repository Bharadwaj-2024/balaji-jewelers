'use client';
// context/WishlistContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface WishlistCtx {
  ids:       number[];
  toggle:    (productId: number) => void;
  isWished:  (productId: number) => boolean;
  count:     number;
}

const WishlistContext = createContext<WishlistCtx>({} as WishlistCtx);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('bj_wishlist');
    if (stored) setIds(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('bj_wishlist', JSON.stringify(ids));
  }, [ids]);

  const toggle = (productId: number) => {
    setIds(prev => {
      const exists = prev.includes(productId);
      toast(exists ? 'Removed from wishlist' : '♥ Added to wishlist');
      return exists ? prev.filter(id => id !== productId) : [...prev, productId];
    });
  };

  const isWished = (productId: number) => ids.includes(productId);

  return (
    <WishlistContext.Provider value={{ ids, toggle, isWished, count: ids.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
