/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        bg: {
          primary: '#0a0a0f',
          secondary: '#111118',
          card: '#16161e',
          hover: '#1e1e28',
          border: '#2a2a38',
        },
        accent: {
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          pink: '#ec4899',
          green: '#10b981',
          orange: '#f59e0b',
          red: '#ef4444',
        },
        text: {
          primary: '#f0f0f8',
          secondary: '#9090a8',
          muted: '#5a5a70',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(139,92,246,0.3)',
        'glow-cyan': '0 0 20px rgba(6,182,212,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      }
    },
  },
  plugins: [],
}
