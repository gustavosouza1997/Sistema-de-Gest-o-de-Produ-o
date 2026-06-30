import type { Config } from 'tailwindcss';

function hsl(v: string) {
  return `hsl(var(${v}) / <alpha-value>)`;
}

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background:  hsl('--background'),
        foreground:  hsl('--foreground'),
        card: {
          DEFAULT:    hsl('--card'),
          foreground: hsl('--card-foreground'),
        },
        primary: {
          DEFAULT:    hsl('--primary'),
          foreground: hsl('--primary-foreground'),
        },
        secondary: {
          DEFAULT:    hsl('--secondary'),
          foreground: hsl('--secondary-foreground'),
        },
        muted: {
          DEFAULT:    hsl('--muted'),
          foreground: hsl('--muted-foreground'),
        },
        accent: {
          DEFAULT:    hsl('--accent'),
          foreground: hsl('--accent-foreground'),
        },
        destructive: {
          DEFAULT:    hsl('--destructive'),
          foreground: hsl('--destructive-foreground'),
        },
        border: hsl('--border'),
        input:  hsl('--input'),
        ring:   hsl('--ring'),
        sidebar: {
          DEFAULT:            hsl('--sidebar'),
          foreground:         hsl('--sidebar-foreground'),
          border:             hsl('--sidebar-border'),
          accent:             hsl('--sidebar-accent'),
          'accent-foreground': hsl('--sidebar-accent-foreground'),
          muted:              hsl('--sidebar-muted'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
