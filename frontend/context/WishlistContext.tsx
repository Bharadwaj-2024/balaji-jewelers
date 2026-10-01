'use client';
// context/WishlistContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { wishlistAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface WishlistCtx {
  ids:       number[];
  toggle:    (productId: number) => void;
  isWished:  (productId: number) => boolean;
  count:     number;
}

const WishlistContext = createContext<WishlistCtx>({} as WishlistCtx);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      wishlistAPI.get()
        .then(({ data }) => setIds((data.data || []).map((item: any) => item.product_id)))
        .catch(() => setIds([]))
        .finally(() => setReady(true));
      return;
    }
    try {
      const stored = localStorage.getItem('bj_wishlist');
      setIds(stored ? JSON.parse(stored) : []);
    } catch (_) {
      setIds([]);
    }
    setReady(true);
  }, [user, authLoading]);

  useEffect(() => {
    if (ready && !user) localStorage.setItem('bj_wishlist', JSON.stringify(ids));
  }, [ids, ready, user]);

  const toggle = (productId: number) => {
    const exists = ids.includes(productId);
    setIds(prev => exists ? prev.filter(id => id !== productId) : [...prev, productId]);
    toast(exists ? 'Removed from wishlist' : '♥ Added to wishlist');
    if (user) {
      const request = exists ? wishlistAPI.remove(productId) : wishlistAPI.add(productId);
      request.catch(() => {
        setIds(prev => exists ? [...prev, productId] : prev.filter(id => id !== productId));
        toast.error('Could not update your wishlist');
      });
    }
  };

  const isWished = (productId: number) => ids.includes(productId);

  return (
    <WishlistContext.Provider value={{ ids, toggle, isWished, count: ids.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
