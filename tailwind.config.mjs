/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
	theme: {
		extend: {
      colors: {
        'accent': '#FFFF00', // A bright, vibrant yellow
        'silver-plat': '#C0C0C0', // Silver/Platinum color
      },
      gridTemplateRows: {
        '3-1fr': 'repeat(3, 1fr)',
      }
    },
	},
	plugins: [
    require('@tailwindcss/typography'),
  ],
}
