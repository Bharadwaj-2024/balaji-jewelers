'use client';
// context/CartContext.tsx
import { createContext, useContext, useEffect, useReducer, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { cartAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export interface CartItem {
  id:             number;
  product_id:     number;
  name:           string;
  purity:         string;
  gold_weight:    number;
  making_charges: number;
  price:          number;
  quantity:       number;
  image?:         string;
}

interface CartState { items: CartItem[]; }

type Action =
  | { type: 'ADD';    payload: CartItem }
  | { type: 'REMOVE'; payload: number }
  | { type: 'UPDATE'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; payload: CartItem[] };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'HYDRATE': return { items: action.payload };
    case 'ADD': {
      const exists = state.items.find(i => i.product_id === action.payload.product_id);
      if (exists) {
        return { items: state.items.map(i => i.product_id === action.payload.product_id ? { ...i, quantity: i.quantity + 1 } : i) };
      }
      return { items: [...state.items, action.payload] };
    }
    case 'REMOVE': return { items: state.items.filter(i => i.product_id !== action.payload) };
    case 'UPDATE': return { items: state.items.map(i => i.product_id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i).filter(i => i.quantity > 0) };
    case 'CLEAR':  return { items: [] };
    default: return state;
  }
}

interface CartCtx {
  items:      CartItem[];
  count:      number;
  subtotal:   number;
  addItem:    (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: number) => void;
  updateQty:  (productId: number, quantity: number) => void;
  clearCart:  () => void;
  isInCart:   (productId: number) => boolean;
}

const CartContext = createContext<CartCtx>({} as CartCtx);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const [ready, setReady] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      cartAPI.get()
        .then(({ data }) => dispatch({ type: 'HYDRATE', payload: data.data?.items || [] }))
        .catch(() => dispatch({ type: 'HYDRATE', payload: [] }))
        .finally(() => setReady(true));
      return;
    }
    try {
      const stored = localStorage.getItem('bj_cart');
      dispatch({ type: 'HYDRATE', payload: stored ? JSON.parse(stored) : [] });
    } catch (_) {
      dispatch({ type: 'HYDRATE', payload: [] });
    }
    setReady(true);
  }, [user, authLoading]);

  useEffect(() => {
    if (ready && !user) localStorage.setItem('bj_cart', JSON.stringify(state.items));
  }, [state.items, ready, user]);

  const refreshServerCart = () => cartAPI.get()
    .then(({ data }) => dispatch({ type: 'HYDRATE', payload: data.data?.items || [] }));

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD', payload: { ...item, quantity: 1 } });
    toast.success(`${item.name} added to cart!`);
    if (user) {
      cartAPI.add(item.product_id, 1)
        .then(refreshServerCart)
        .catch((error) => {
          refreshServerCart().catch(() => {});
          toast.error(error.response?.data?.message || 'Could not update your cart');
        });
    }
  };

  const removeItem = (productId: number) => {
    const item = state.items.find(i => i.product_id === productId);
    dispatch({ type: 'REMOVE', payload: productId });
    if (user && item) {
      cartAPI.remove(item.id).catch(() => {
        refreshServerCart().catch(() => {});
        toast.error('Could not remove this item');
      });
    }
  };

  const updateQty = (productId: number, quantity: number) => {
    const item = state.items.find(i => i.product_id === productId);
    dispatch({ type: 'UPDATE', payload: { id: productId, quantity } });
    if (user && item) {
      const request = quantity < 1 ? cartAPI.remove(item.id) : cartAPI.update(item.id, quantity);
      request.catch((error) => {
        refreshServerCart().catch(() => {});
        toast.error(error.response?.data?.message || 'Could not update quantity');
      });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR' });
    if (user) cartAPI.clear().catch(() => {});
  };

  const count    = state.items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const isInCart = (productId: number) => state.items.some(i => i.product_id === productId);

  return (
    <CartContext.Provider value={{ items: state.items, count, subtotal, addItem, removeItem, updateQty, clearCart, isInCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
