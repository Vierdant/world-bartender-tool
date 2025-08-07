import scrollbar from 'tailwind-scrollbar';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}', // make sure this matches your project structure
  ],
  theme: {
    extend: {},
  },
  plugins: [
    scrollbar,
  ],
}