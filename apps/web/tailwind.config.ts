import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bloomberg Terminal color scheme
        terminal: {
          bg: '#000000',
          surface: '#0a0a0a',
          border: '#1a1a1a',
          text: {
            primary: '#ff9900',
            secondary: '#ffffff',
            muted: '#9ca3af',
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b'
          },
          accent: {
            blue: '#3b82f6',
            green: '#10b981',
            red: '#ef4444',
            orange: '#ff9900',
            yellow: '#f59e0b'
          }
        }
      },
      fontFamily: {
        'mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'source-code-pro', 'Menlo', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s step-end infinite'
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' }
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
