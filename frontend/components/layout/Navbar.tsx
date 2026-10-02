'use client';
// components/layout/Navbar.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart }     from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth }     from '@/context/AuthContext';

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [query,      setQuery]      = useState('');
  const { count }   = useCart();
  const { count: wCount } = useWishlist();
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black shadow-lg' : 'bg-black'}`}>
      {/* Main bar */}
      <div className="max-w-[1200px] mx-auto px-7 flex items-center justify-between h-[62px]">
        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none cursor-pointer">
          <span style={{ fontFamily: 'Playfair Display, serif', color: '#C9A84C', fontSize: 19, fontWeight: 700, letterSpacing: 2 }}>BALAJI</span>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', color: 'rgba(255,255,255,.5)', fontSize: 10, letterSpacing: 5 }}>JEWELLERS</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex gap-7 items-center">
          {[['Collections', '/products'], ['Rings', '/products?category=1'], ['Necklaces', '/products?category=2'], ['Offers', '/products?is_featured=true'], ['About', '/']].map(([label, href]) => (
            <Link key={label} href={href}
              className="text-white/70 text-[11px] tracking-[1.5px] uppercase font-medium hover:text-gold transition-colors border-b border-transparent hover:border-gold pb-0.5">
              {label}
            </Link>
          ))}
        </div>

        {/* Icons */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <button onClick={() => setSearchOpen(o => !o)} className="text-white/70 hover:text-gold transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          {/* Wishlist */}
          <Link href="/wishlist" className="relative text-white/70 hover:text-gold transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {wCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gold text-black rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center">
                {wCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative text-white/70 hover:text-gold transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gold text-black rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/orders" className="text-white/60 text-[12px] font-jost hover:text-gold transition-colors">
                Hi, {user.name.split(' ')[0]}
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="border border-gold/60 text-gold text-[11px] px-3 py-1.5 hover:bg-gold hover:text-black transition-all">
                  Admin
                </Link>
              )}
              <button onClick={logout} className="text-white/40 text-[11px] hover:text-red-400 transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <Link href="/auth" className="btn-gold px-4 py-2 text-black text-[12px] rounded-sm">
              Login
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(o => !o)} className="md:hidden text-white/70">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-gold/15 px-7 py-3 bg-black animate-slide-down">
          <form onSubmit={handleSearch} className="max-w-[1200px] mx-auto flex gap-3">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search rings, necklaces, pendants, 22K gold..."
              className="flex-1 bg-transparent border-b border-gold/50 text-white text-sm py-2 outline-none placeholder:text-white/30 font-jost"
            />
            <button type="submit" className="btn-gold px-5 py-2 text-black text-xs font-semibold rounded-sm">
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-black border-t border-gold/15 px-7 py-5 flex flex-col gap-4 animate-slide-down">
          {[['Collections', '/products'], ['Rings', '/products?category=1'], ['Necklaces', '/products?category=2'], ['Offers', '/products?is_featured=true']].map(([label, href]) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)}
              className="text-white/70 text-[13px] tracking-[1.5px] uppercase">
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
