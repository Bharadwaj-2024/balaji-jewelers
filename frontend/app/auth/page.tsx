'use client';
// app/auth/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const [mode,    setMode]    = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', confirm:'' });
  const [errors, setErrors] = useState<Record<string,string>>({});

  const { login, register, user } = useAuth();
  const router = useRouter();

  useEffect(() => { if (user) router.push('/'); }, [user]);

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setForm({ name:'', email:'', phone:'', password:'', confirm:'' });
    setErrors({});
    setShowPass(false);
  };

  const validate = () => {
    const e: Record<string,string> = {};
    if (mode === 'register') {
      if (!form.name.trim())             e.name     = 'Full name is required';
      if (form.phone && !/^[6-9]\d{9}$/.test(form.phone))
                                         e.phone    = 'Enter a valid 10-digit number';
      if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    }
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password || form.password.length < 8)        e.password = 'Minimum 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        await register(form.name.trim(), form.email, form.password, form.phone || undefined);
        toast.success('Account created! Welcome to Balaji Jewellers.');
      }
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const len = form.password.length;
    if (len === 0) return null;
    if (len < 8)   return { label:'Weak', color:'#ef4444', bars:1 };
    if (len < 10)  return { label:'Fair', color:'#f97316', bars:2 };
    if (len < 12)  return { label:'Good', color:'#eab308', bars:3 };
    return           { label:'Strong', color:'#22c55e', bars:4 };
  };
  const strength = passwordStrength();

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-ivory">
      <div className="w-full max-w-[440px]">

        {/* Branding */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🪙</div>
          <div className="font-playfair text-[22px] font-bold tracking-[4px] text-gold">BALAJI</div>
          <div className="font-cormorant text-[11px] tracking-[6px] text-gray-400 mb-6">JEWELLERS</div>
          <h1 className="font-playfair text-2xl font-bold text-black mb-1">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-400 text-sm">
            {mode === 'login' ? 'Sign in to your account to continue' : 'Join us for exclusive jewellery collections'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-champ rounded-sm p-1 mb-7">
          {(['login','register'] as Mode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-sm transition-all duration-200
                ${mode === m
                  ? 'btn-gold text-black shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 bg-transparent border-none'
                }`}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white p-8 shadow-sm rounded-sm border border-gold/10">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Name — register */}
            {mode === 'register' && (
              <div>
                <label className="block text-[12px] text-gray-500 mb-1.5 tracking-wide font-medium">Full Name *</label>
                <input
                  className={`input-gold ${errors.name ? 'border-red-400' : ''}`}
                  placeholder="e.g. Priya Sharma"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  autoComplete="name"
                />
                {errors.name && <p className="text-red-500 text-[11px] mt-1">{errors.name}</p>}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[12px] text-gray-500 mb-1.5 tracking-wide font-medium">Email Address *</label>
              <input
                type="email"
                className={`input-gold ${errors.email ? 'border-red-400' : ''}`}
                placeholder="priya@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                autoComplete="email"
              />
              {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
            </div>

            {/* Phone — register */}
            {mode === 'register' && (
              <div>
                <label className="block text-[12px] text-gray-500 mb-1.5 tracking-wide font-medium">
                  Mobile Number <span className="text-gray-300 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">+91</span>
                  <input
                    type="tel"
                    className={`input-gold pl-10 ${errors.phone ? 'border-red-400' : ''}`}
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value.replace(/\D/g,'').slice(0,10))}
                    maxLength={10}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-[11px] mt-1">{errors.phone}</p>}
              </div>
            )}

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[12px] text-gray-500 tracking-wide font-medium">Password *</label>
                {mode === 'login' && (
                  <button type="button" className="text-[11px] text-gold font-semibold border-none bg-transparent cursor-pointer hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input-gold pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  placeholder={mode === 'register' ? 'Min. 8 characters' : '••••••••'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold bg-transparent border-none cursor-pointer text-base"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-[11px] mt-1">{errors.password}</p>}

              {/* strength bar */}
              {mode === 'register' && strength && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(n => (
                      <div key={n} style={{ flex:1, height:3, borderRadius:2, transition:'background 0.3s',
                        background: n <= strength.bars ? strength.color : '#e5e7eb' }} />
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400">{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm — register */}
            {mode === 'register' && (
              <div>
                <label className="block text-[12px] text-gray-500 mb-1.5 tracking-wide font-medium">Confirm Password *</label>
                <input
                  type="password"
                  className={`input-gold ${errors.confirm ? 'border-red-400' : ''}`}
                  placeholder="Re-enter password"
                  value={form.confirm}
                  onChange={e => set('confirm', e.target.value)}
                  autoComplete="new-password"
                />
                {errors.confirm && <p className="text-red-500 text-[11px] mt-1">{errors.confirm}</p>}
                {form.confirm && !errors.confirm && form.password === form.confirm && (
                  <p className="text-green-500 text-[11px] mt-1">✓ Passwords match</p>
                )}
              </div>
            )}

            {/* Terms — register */}
            {mode === 'register' && (
              <label className="flex gap-2 items-start cursor-pointer">
                <input type="checkbox" required className="mt-0.5 flex-shrink-0" style={{ accentColor:'#C9A84C' }} />
                <span className="text-[12px] text-gray-500 leading-relaxed">
                  I agree to Balaji Jewellers'{' '}
                  <span className="text-gold font-semibold">Terms of Service</span> and{' '}
                  <span className="text-gold font-semibold">Privacy Policy</span>
                </span>
              </label>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3.5 text-black font-bold text-sm tracking-wide rounded-sm disabled:opacity-60 mt-1 flex items-center justify-center gap-2"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" />
                    {mode === 'login' ? 'Signing In…' : 'Creating Account…'}</>
                : mode === 'login' ? '✨ Sign In' : '🪙 Create My Account'
              }
            </button>
          </form>

          {/* Switch mode */}
          <div className="text-center mt-5 text-sm text-gray-400">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-gold font-semibold hover:underline bg-transparent border-none cursor-pointer"
            >
              {mode === 'login' ? 'Sign Up Free' : 'Sign In'}
            </button>
          </div>

          {/* Divider */}
          <div className="gold-line my-5" />

          {/* Guest */}
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="w-full py-2.5 text-[13px] font-medium text-gray-500 border border-gold/20 rounded-sm bg-transparent hover:bg-champ hover:text-gray-700 hover:border-gold/40 transition-all cursor-pointer"
          >
            👜 Browse Jewellery Without Logging In
          </button>

          {/* Trust note */}
          <div className="mt-5 p-3 bg-champ/50 rounded-sm text-center">
            <p className="text-[11px] text-gray-500">
              🔒 Secure login &nbsp;·&nbsp; 🪙 BIS Hallmarked jewellery &nbsp;·&nbsp; 🚚 Free delivery above ₹10,000
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
