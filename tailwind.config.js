/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: process.env.DARK_MODE ? process.env.DARK_MODE : 'class',
  content: [
    './app/**/*.{html,js,jsx,ts,tsx,mdx}',
    './components/**/*.{html,js,jsx,ts,tsx,mdx}',
    './utils/**/*.{html,js,jsx,ts,tsx,mdx}',
    './*.{html,js,jsx,ts,tsx,mdx}',
    './src/**/*.{html,js,jsx,ts,tsx,mdx}',
  ],
  presets: [require('nativewind/preset')],
  important: 'html',
  safelist: [
    {
      pattern:
        /(bg|border|text|stroke|fill)-(primary|secondary|tertiary|error|success|warning|info|typography|outline|background|indicator)-(0|50|100|200|300|400|500|600|700|800|900|950|white|gray|black|error|warning|muted|success|info|light|dark|primary)/,
    },
    // Add Apple HIG color patterns
    {
      pattern:
        /(bg|border|text)-(system-blue|system-green|system-orange|system-pink|system-purple|system-red|system-teal|system-yellow|system-gray|business|life|study|health|finance|hobby|work|personal)/,
    },
  ],
  theme: {
    extend: {
      // Apple HIG System Colors
      colors: {
        // iOS System Colors
        'system-blue': '#007AFF',
        'system-green': '#34C759',
        'system-indigo': '#5856D6',
        'system-orange': '#FF9500',
        'system-pink': '#FF2D92',
        'system-purple': '#AF52DE',
        'system-red': '#FF3B30',
        'system-teal': '#5AC8FA',
        'system-yellow': '#FFCC00',

        // System Grays
        'system-gray': '#8E8E93',
        'system-gray-2': '#AEAEB2',
        'system-gray-3': '#C7C7CC',
        'system-gray-4': '#D1D1D6',
        'system-gray-5': '#E5E5EA',
        'system-gray-6': '#F2F2F7',

        // Label Colors
        label: '#000000',
        'secondary-label': '#3C3C43',
        'tertiary-label': '#3C3C43',
        'quaternary-label': '#2C2C2E',

        // Background Colors
        'system-background': '#FFFFFF',
        'secondary-system-background': '#F2F2F7',
        'tertiary-system-background': '#FFFFFF',
        'system-grouped-background': '#F2F2F7',
        'secondary-system-grouped-background': '#FFFFFF',
        'tertiary-system-grouped-background': '#F2F2F7',

        // Category Colors
        business: '#007AFF',
        'business-light': '#E3F2FD',
        'business-dark': '#1565C0',
        life: '#34C759',
        'life-light': '#E8F5E8',
        'life-dark': '#2E7D32',
        study: '#FF9500',
        'study-light': '#FFF3E0',
        'study-dark': '#F57C00',
        health: '#FF2D92',
        'health-light': '#FCE4EC',
        'health-dark': '#C2185B',
        finance: '#AF52DE',
        'finance-light': '#F3E5F5',
        'finance-dark': '#7B1FA2',
        hobby: '#5AC8FA',
        'hobby-light': '#E0F2F1',
        'hobby-dark': '#00695C',
        work: '#5856D6',
        'work-light': '#E8EAF6',
        'work-dark': '#303F9F',
        personal: '#FFCC00',
        'personal-light': '#FFFDE7',
        'personal-dark': '#F57F17',

        // Heatmap Colors
        'heatmap-none': '#F2F2F7',
        'heatmap-low': '#C8E6C9',
        'heatmap-medium': '#81C784',
        'heatmap-high': '#4CAF50',
        'heatmap-highest': '#2E7D32',

        // Legacy Gluestack colors (for backward compatibility)
        primary: {
          0: 'rgb(var(--color-primary-0)/<alpha-value>)',
          50: 'rgb(var(--color-primary-50)/<alpha-value>)',
          100: 'rgb(var(--color-primary-100)/<alpha-value>)',
          200: 'rgb(var(--color-primary-200)/<alpha-value>)',
          300: 'rgb(var(--color-primary-300)/<alpha-value>)',
          400: 'rgb(var(--color-primary-400)/<alpha-value>)',
          500: 'rgb(var(--color-primary-500)/<alpha-value>)',
          600: 'rgb(var(--color-primary-600)/<alpha-value>)',
          700: 'rgb(var(--color-primary-700)/<alpha-value>)',
          800: 'rgb(var(--color-primary-800)/<alpha-value>)',
          900: 'rgb(var(--color-primary-900)/<alpha-value>)',
          950: 'rgb(var(--color-primary-950)/<alpha-value>)',
        },
        secondary: {
          0: 'rgb(var(--color-secondary-0)/<alpha-value>)',
          50: 'rgb(var(--color-secondary-50)/<alpha-value>)',
          100: 'rgb(var(--color-secondary-100)/<alpha-value>)',
          200: 'rgb(var(--color-secondary-200)/<alpha-value>)',
          300: 'rgb(var(--color-secondary-300)/<alpha-value>)',
          400: 'rgb(var(--color-secondary-400)/<alpha-value>)',
          500: 'rgb(var(--color-secondary-500)/<alpha-value>)',
          600: 'rgb(var(--color-secondary-600)/<alpha-value>)',
          700: 'rgb(var(--color-secondary-700)/<alpha-value>)',
          800: 'rgb(var(--color-secondary-800)/<alpha-value>)',
          900: 'rgb(var(--color-secondary-900)/<alpha-value>)',
          950: 'rgb(var(--color-secondary-950)/<alpha-value>)',
        },
        tertiary: {
          50: 'rgb(var(--color-tertiary-50)/<alpha-value>)',
          100: 'rgb(var(--color-tertiary-100)/<alpha-value>)',
          200: 'rgb(var(--color-tertiary-200)/<alpha-value>)',
          300: 'rgb(var(--color-tertiary-300)/<alpha-value>)',
          400: 'rgb(var(--color-tertiary-400)/<alpha-value>)',
          500: 'rgb(var(--color-tertiary-500)/<alpha-value>)',
          600: 'rgb(var(--color-tertiary-600)/<alpha-value>)',
          700: 'rgb(var(--color-tertiary-700)/<alpha-value>)',
          800: 'rgb(var(--color-tertiary-800)/<alpha-value>)',
          900: 'rgb(var(--color-tertiary-900)/<alpha-value>)',
          950: 'rgb(var(--color-tertiary-950)/<alpha-value>)',
        },
        error: {
          0: 'rgb(var(--color-error-0)/<alpha-value>)',
          50: 'rgb(var(--color-error-50)/<alpha-value>)',
          100: 'rgb(var(--color-error-100)/<alpha-value>)',
          200: 'rgb(var(--color-error-200)/<alpha-value>)',
          300: 'rgb(var(--color-error-300)/<alpha-value>)',
          400: 'rgb(var(--color-error-400)/<alpha-value>)',
          500: 'rgb(var(--color-error-500)/<alpha-value>)',
          600: 'rgb(var(--color-error-600)/<alpha-value>)',
          700: 'rgb(var(--color-error-700)/<alpha-value>)',
          800: 'rgb(var(--color-error-800)/<alpha-value>)',
          900: 'rgb(var(--color-error-900)/<alpha-value>)',
          950: 'rgb(var(--color-error-950)/<alpha-value>)',
        },
        success: {
          0: 'rgb(var(--color-success-0)/<alpha-value>)',
          50: 'rgb(var(--color-success-50)/<alpha-value>)',
          100: 'rgb(var(--color-success-100)/<alpha-value>)',
          200: 'rgb(var(--color-success-200)/<alpha-value>)',
          300: 'rgb(var(--color-success-300)/<alpha-value>)',
          400: 'rgb(var(--color-success-400)/<alpha-value>)',
          500: 'rgb(var(--color-success-500)/<alpha-value>)',
          600: 'rgb(var(--color-success-600)/<alpha-value>)',
          700: 'rgb(var(--color-success-700)/<alpha-value>)',
          800: 'rgb(var(--color-success-800)/<alpha-value>)',
          900: 'rgb(var(--color-success-900)/<alpha-value>)',
          950: 'rgb(var(--color-success-950)/<alpha-value>)',
        },
        warning: {
          0: 'rgb(var(--color-warning-0)/<alpha-value>)',
          50: 'rgb(var(--color-warning-50)/<alpha-value>)',
          100: 'rgb(var(--color-warning-100)/<alpha-value>)',
          200: 'rgb(var(--color-warning-200)/<alpha-value>)',
          300: 'rgb(var(--color-warning-300)/<alpha-value>)',
          400: 'rgb(var(--color-warning-400)/<alpha-value>)',
          500: 'rgb(var(--color-warning-500)/<alpha-value>)',
          600: 'rgb(var(--color-warning-600)/<alpha-value>)',
          700: 'rgb(var(--color-warning-700)/<alpha-value>)',
          800: 'rgb(var(--color-warning-800)/<alpha-value>)',
          900: 'rgb(var(--color-warning-900)/<alpha-value>)',
          950: 'rgb(var(--color-warning-950)/<alpha-value>)',
        },
        info: {
          0: 'rgb(var(--color-info-0)/<alpha-value>)',
          50: 'rgb(var(--color-info-50)/<alpha-value>)',
          100: 'rgb(var(--color-info-100)/<alpha-value>)',
          200: 'rgb(var(--color-info-200)/<alpha-value>)',
          300: 'rgb(var(--color-info-300)/<alpha-value>)',
          400: 'rgb(var(--color-info-400)/<alpha-value>)',
          500: 'rgb(var(--color-info-500)/<alpha-value>)',
          600: 'rgb(var(--color-info-600)/<alpha-value>)',
          700: 'rgb(var(--color-info-700)/<alpha-value>)',
          800: 'rgb(var(--color-info-800)/<alpha-value>)',
          900: 'rgb(var(--color-info-900)/<alpha-value>)',
          950: 'rgb(var(--color-info-950)/<alpha-value>)',
        },
        typography: {
          0: 'rgb(var(--color-typography-0)/<alpha-value>)',
          50: 'rgb(var(--color-typography-50)/<alpha-value>)',
          100: 'rgb(var(--color-typography-100)/<alpha-value>)',
          200: 'rgb(var(--color-typography-200)/<alpha-value>)',
          300: 'rgb(var(--color-typography-300)/<alpha-value>)',
          400: 'rgb(var(--color-typography-400)/<alpha-value>)',
          500: 'rgb(var(--color-typography-500)/<alpha-value>)',
          600: 'rgb(var(--color-typography-600)/<alpha-value>)',
          700: 'rgb(var(--color-typography-700)/<alpha-value>)',
          800: 'rgb(var(--color-typography-800)/<alpha-value>)',
          900: 'rgb(var(--color-typography-900)/<alpha-value>)',
          950: 'rgb(var(--color-typography-950)/<alpha-value>)',
          white: '#FFFFFF',
          gray: '#D4D4D4',
          black: '#181718',
        },
        outline: {
          0: 'rgb(var(--color-outline-0)/<alpha-value>)',
          50: 'rgb(var(--color-outline-50)/<alpha-value>)',
          100: 'rgb(var(--color-outline-100)/<alpha-value>)',
          200: 'rgb(var(--color-outline-200)/<alpha-value>)',
          300: 'rgb(var(--color-outline-300)/<alpha-value>)',
          400: 'rgb(var(--color-outline-400)/<alpha-value>)',
          500: 'rgb(var(--color-outline-500)/<alpha-value>)',
          600: 'rgb(var(--color-outline-600)/<alpha-value>)',
          700: 'rgb(var(--color-outline-700)/<alpha-value>)',
          800: 'rgb(var(--color-outline-800)/<alpha-value>)',
          900: 'rgb(var(--color-outline-900)/<alpha-value>)',
          950: 'rgb(var(--color-outline-950)/<alpha-value>)',
        },
        background: {
          0: 'rgb(var(--color-background-0)/<alpha-value>)',
          50: 'rgb(var(--color-background-50)/<alpha-value>)',
          100: 'rgb(var(--color-background-100)/<alpha-value>)',
          200: 'rgb(var(--color-background-200)/<alpha-value>)',
          300: 'rgb(var(--color-background-300)/<alpha-value>)',
          400: 'rgb(var(--color-background-400)/<alpha-value>)',
          500: 'rgb(var(--color-background-500)/<alpha-value>)',
          600: 'rgb(var(--color-background-600)/<alpha-value>)',
          700: 'rgb(var(--color-background-700)/<alpha-value>)',
          800: 'rgb(var(--color-background-800)/<alpha-value>)',
          900: 'rgb(var(--color-background-900)/<alpha-value>)',
          950: 'rgb(var(--color-background-950)/<alpha-value>)',
          error: 'rgb(var(--color-background-error)/<alpha-value>)',
          warning: 'rgb(var(--color-background-warning)/<alpha-value>)',
          muted: 'rgb(var(--color-background-muted)/<alpha-value>)',
          success: 'rgb(var(--color-background-success)/<alpha-value>)',
          info: 'rgb(var(--color-background-info)/<alpha-value>)',
          light: '#FBFBFB',
          dark: '#181719',
        },
        indicator: {
          primary: 'rgb(var(--color-indicator-primary)/<alpha-value>)',
          info: 'rgb(var(--color-indicator-info)/<alpha-value>)',
          error: 'rgb(var(--color-indicator-error)/<alpha-value>)',
        },
      },

      // Apple HIG Typography
      fontSize: {
        // iOS Typography Scale
        'large-title': [
          '34px',
          { lineHeight: '41px', letterSpacing: '0.37px', fontWeight: '700' },
        ],
        'title-1': [
          '28px',
          { lineHeight: '34px', letterSpacing: '0.36px', fontWeight: '700' },
        ],
        'title-2': [
          '22px',
          { lineHeight: '28px', letterSpacing: '0.35px', fontWeight: '700' },
        ],
        'title-3': [
          '20px',
          { lineHeight: '25px', letterSpacing: '0.38px', fontWeight: '600' },
        ],
        headline: [
          '17px',
          { lineHeight: '22px', letterSpacing: '-0.41px', fontWeight: '600' },
        ],
        body: [
          '17px',
          { lineHeight: '22px', letterSpacing: '-0.41px', fontWeight: '400' },
        ],
        callout: [
          '16px',
          { lineHeight: '21px', letterSpacing: '-0.32px', fontWeight: '400' },
        ],
        subhead: [
          '15px',
          { lineHeight: '20px', letterSpacing: '-0.24px', fontWeight: '400' },
        ],
        footnote: [
          '13px',
          { lineHeight: '18px', letterSpacing: '-0.08px', fontWeight: '400' },
        ],
        'caption-1': [
          '12px',
          { lineHeight: '16px', letterSpacing: '0px', fontWeight: '400' },
        ],
        'caption-2': [
          '11px',
          { lineHeight: '13px', letterSpacing: '0.07px', fontWeight: '400' },
        ],

        // Legacy sizes
        '2xs': '10px',
      },

      // Apple HIG Spacing (8pt grid)
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        xxxl: '64px',
      },

      // Apple HIG Border Radius
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        xxl: '24px',
      },

      fontFamily: {
        // iOS System Fonts
        system: ['system-ui', 'sans-serif'],
        'system-rounded': ['ui-rounded', 'system-ui', 'sans-serif'],
        'system-mono': ['ui-monospace', 'monospace'],

        // Legacy fonts
        heading: undefined,
        body: undefined,
        mono: undefined,
        jakarta: ['var(--font-plus-jakarta-sans)'],
        roboto: ['var(--font-roboto)'],
        code: ['var(--font-source-code-pro)'],
        inter: ['var(--font-inter)'],
        'space-mono': ['var(--font-space-mono)'],
      },

      fontWeight: {
        extrablack: '950',
      },

      // Apple HIG Shadows
      boxShadow: {
        // iOS-style shadows
        'ios-small': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'ios-medium': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'ios-large': '0 4px 8px rgba(0, 0, 0, 0.15)',
        'ios-card': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'ios-modal': '0 8px 16px rgba(0, 0, 0, 0.25)',

        // Legacy shadows
        'hard-1': '-2px 2px 8px 0px rgba(38, 38, 38, 0.20)',
        'hard-2': '0px 3px 10px 0px rgba(38, 38, 38, 0.20)',
        'hard-3': '2px 2px 8px 0px rgba(38, 38, 38, 0.20)',
        'hard-4': '0px -3px 10px 0px rgba(38, 38, 38, 0.20)',
        'hard-5': '0px 2px 10px 0px rgba(38, 38, 38, 0.10)',
        'soft-1': '0px 0px 10px rgba(38, 38, 38, 0.1)',
        'soft-2': '0px 0px 20px rgba(38, 38, 38, 0.2)',
        'soft-3': '0px 0px 30px rgba(38, 38, 38, 0.1)',
        'soft-4': '0px 0px 40px rgba(38, 38, 38, 0.1)',
      },

      // Animation timing
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },
    },
  },
}
