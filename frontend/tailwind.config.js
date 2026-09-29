/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0F19',
          card: '#111827',
          surface: '#1E293B',
          border: '#1F2937',
        },
        brand: {
          primary: '#6366F1', // Indigo
          accent: '#06B6D4',  // Cyan
          success: '#10B981', // Emerald
          warning: '#F59E0B', // Amber
          danger: '#EF4444',  // Rose
        }
      }
    },
  },
  plugins: [],
}
