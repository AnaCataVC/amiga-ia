/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./**/*.html", "./**/*.js"],
  darkMode: 'class',
  theme: {
      extend: {
          fontFamily: {
              sans: ['Outfit', 'Inter', 'sans-serif'],
          },
          colors: {
              brand: {
                  purple: '#8E24AA',
                  orange: '#D97757'
              }
          },
          animation: {
              'fade-in': 'fadeIn 0.8s ease-out forwards',
              'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
          },
          keyframes: {
              fadeIn: {
                  '0%': { opacity: '0' },
                  '100%': { opacity: '1' },
              },
              fadeInUp: {
                  '0%': { opacity: '0', transform: 'translateY(20px)' },
                  '100%': { opacity: '1', transform: 'translateY(0)' },
              }
          }
      }
  },
  plugins: [],
}
