/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // New neutral dark theme palette
        'primary': '#6366f1', // Indigo for primary actions
        'primary-light': '#818cf8',
        'primary-dark': '#4f46e5',
        'secondary': '#8b5cf6', // Violet for secondary elements
        'accent': '#10b981', // Emerald for accents and highlights
        'dark': '#121212', // Very dark gray, almost black
        'dark-lighter': '#1e1e1e', // Slightly lighter dark
        'dark-lightest': '#2d2d2d', // Even lighter dark for cards
        'light': '#f9fafb', // Very light gray, almost white
        'light-darker': '#e5e7eb', // Slightly darker light
        'text-primary': '#f3f4f6', // Light text for dark backgrounds
        'text-secondary': '#9ca3af', // Muted text for dark backgrounds
        'border': '#374151', // Border color for dark theme
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
