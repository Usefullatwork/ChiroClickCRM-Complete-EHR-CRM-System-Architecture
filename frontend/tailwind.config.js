/** @type {import('tailwindcss').Config} */

// Targeted safelist for dynamic class patterns (StatusBadge, calendar type colors).
// Only safelist colors/shades actually used in dynamic interpolation.
// Reduced from 850+ to ~120 classes — rest are discovered statically by Tailwind.
const safelistColors = [
  'blue',
  'green',
  'teal',
  'orange',
  'purple',
  'red',
  'yellow',
  'amber',
  'gray',
];
const safelistShades = [50, 100, 500, 600, 700];

function buildSafelist() {
  const list = [];
  for (const color of safelistColors) {
    for (const shade of safelistShades) {
      list.push(`bg-${color}-${shade}`);
      list.push(`text-${color}-${shade}`);
      list.push(`border-${color}-${shade}`);
    }
  }
  return list;
}

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  safelist: buildSafelist(),
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "'Inter Variable'",
          "'Inter'",
          '-apple-system',
          'BlinkMacSystemFont',
          "'Segoe UI'",
          'Roboto',
          'sans-serif',
        ],
        mono: [
          "'JetBrains Mono Variable'",
          "'JetBrains Mono'",
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Scandi-Clinical semantic colors
        clinical: {
          DEFAULT: 'hsl(var(--clinical))',
          foreground: 'hsl(var(--clinical-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
      },
      fontSize: {
        caption: 'var(--text-caption)',
        body: 'var(--text-body)',
        heading: 'var(--text-heading)',
        title: 'var(--text-title)',
        display: 'var(--text-display)',
      },
      spacing: {
        xs: 'var(--space-xs)',
        'sm-token': 'var(--space-sm)',
        'md-token': 'var(--space-md)',
        'lg-token': 'var(--space-lg)',
        'xl-token': 'var(--space-xl)',
        '2xl-token': 'var(--space-2xl)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        soft: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 4px 6px -1px rgb(0 0 0 / 0.06)',
        'soft-md': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 10px 15px -3px rgb(0 0 0 / 0.08)',
        'soft-lg': '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 20px 25px -5px rgb(0 0 0 / 0.1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
