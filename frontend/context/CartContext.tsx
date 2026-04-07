'use client';
// context/CartContext.tsx
import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import toast from 'react-hot-toast';

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

  // Hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('bj_cart');
    if (stored) dispatch({ type: 'HYDRATE', payload: JSON.parse(stored) });
  }, []);

  // Persist on change
  useEffect(() => {
    localStorage.setItem('bj_cart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD', payload: { ...item, quantity: 1 } });
    toast.success(`${item.name} added to cart!`);
  };

  const removeItem = (productId: number) => {
    dispatch({ type: 'REMOVE', payload: productId });
  };

  const updateQty = (productId: number, quantity: number) => {
    dispatch({ type: 'UPDATE', payload: { id: productId, quantity } });
  };

  const clearCart = () => dispatch({ type: 'CLEAR' });

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
