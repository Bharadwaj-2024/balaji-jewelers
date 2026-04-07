'use client';
// app/auth/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth }   from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [mode,     setMode]     = useState<'login'|'register'>('login');
  const [loading,  setLoading]  = useState(false);
  const [form,     setForm]     = useState({ name:'', email:'', password:'', phone:'' });
  const { login, register }     = useAuth();
  const router = useRouter();

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        if (!form.name.trim()) { toast.error('Name is required'); setLoading(false); return; }
        if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); setLoading(false); return; }
        await register(form.name, form.email, form.password, form.phone);
        toast.success('Account created! Welcome to Balaji Jewellers.');
      }
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-ivory">
      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div style={{ fontFamily:'Playfair Display,serif', color:'#C9A84C', fontSize:22, fontWeight:700, letterSpacing:3 }}>BALAJI</div>
          <div style={{ fontFamily:'Cormorant Garamond,serif', color:'#999', fontSize:11, letterSpacing:5 }}>JEWELLERS</div>
          <h1 className="font-playfair text-2xl font-bold mt-5 mb-1">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-400 text-sm">
            {mode === 'login' ? 'Sign in to your account' : 'Join Balaji Jewellers today'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 shadow-sm rounded-sm border border-gold/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-[12px] text-gray-500 mb-1.5 tracking-wide">Full Name *</label>
                <input value={form.name} onChange={e=>set('name',e.target.value)} required
                  placeholder="Priya Sharma" className="input-gold" />
              </div>
            )}
            <div>
              <label className="block text-[12px] text-gray-500 mb-1.5 tracking-wide">Email Address *</label>
              <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} required
                placeholder="priya@example.com" className="input-gold" />
            </div>
            <div>
              <label className="block text-[12px] text-gray-500 mb-1.5 tracking-wide">Password *</label>
              <input type="password" value={form.password} onChange={e=>set('password',e.target.value)} required
                placeholder={mode==='register'?'Min. 8 characters':'••••••••'} className="input-gold" />
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-[12px] text-gray-500 mb-1.5 tracking-wide">Phone (Optional)</label>
                <input type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)}
                  placeholder="+91 98765 43210" className="input-gold" />
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-gold w-full py-3.5 text-black font-bold text-sm tracking-wide rounded-sm disabled:opacity-60 mt-2">
              {loading ? (mode==='login'?'Signing In...':'Creating Account...') : (mode==='login'?'Sign In':'Create Account')}
            </button>
          </form>

          <div className="text-center mt-6">
            <span className="text-gray-400 text-sm">
              {mode==='login' ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setMode(m => m==='login'?'register':'login')}
                className="text-gold font-semibold hover:underline">
                {mode==='login' ? 'Sign Up' : 'Sign In'}
              </button>
            </span>
          </div>

          {mode === 'login' && (
            <div className="mt-4 p-3 bg-champ/50 rounded-sm text-center">
              <div className="text-[11px] text-gray-500">
                <strong>Demo Admin:</strong> admin@balajijewellers.com / Admin@123
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
