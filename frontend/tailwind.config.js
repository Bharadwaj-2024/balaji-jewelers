/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold:   { DEFAULT: '#C9A84C', light: '#E5C97A', dark: '#A8893A' },
        black:  { DEFAULT: '#0A0A0A', soft: '#1a1a1a' },
        ivory:  { DEFAULT: '#FAF7F2' },
        champ:  { DEFAULT: '#F5E6C8', dark: '#E8D4B0' },
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        cormorant: ['Cormorant Garamond', 'serif'],
        jost: ['Jost', 'sans-serif'],
      },
      animation: {
        'fade-up':    'fadeUp 0.6s ease both',
        'fade-in':    'fadeIn 0.4s ease both',
        'slide-down': 'slideDown 0.3s ease both',
        'ticker':     'ticker 40s linear infinite',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: 0 },                                to: { opacity: 1 } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        ticker:    { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
