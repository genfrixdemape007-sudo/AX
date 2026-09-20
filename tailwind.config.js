/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // sage (secondary accent — stayed close to its old self, still reads "natural/craft")
        olive: '#7C8B6F',
        // terracotta-deep (gradient partner for peach, darker hover states)
        clover: '#A85736',
        // pale warm tint — chip/badge backgrounds
        daisy: '#F6E3D3',
        // lighter terracotta — hover states
        blush: '#D98B67',
        // terracotta — primary accent, CTAs, links (was bright red)
        peach: '#C6714A',
        // mustard — secondary accent, stayed close to its old self
        gold: '#E0A458',
        // deep espresso — replaces the old near-black red for hero/nav dark surfaces
        noir: '#241C16',
        'noir-soft': '#332821',
        // warm paper background instead of near-white
        bg: '#FAF3E7',
        'bg-deep': '#F3E6D2',
        // warm cream surface instead of pure white
        surface: '#FFFDF8',
        'surface-soft': '#F6ECDD',
        ink: '#241C16',
        'ink-soft': '#8A7A6B',
      },
      fontFamily: {
        // bold rounded display font, matches the wordmark's chunky interlocking letterforms
        heading: ['"Baloo 2"', 'sans-serif'],
        body: ['Karla', 'sans-serif'],
        // handwritten accent — small tags, price badges, echoes the logo's "crochet" script
        accent: ['Caveat', 'cursive'],
      },
      borderRadius: {
        cozy: '1.25rem',
        stitch: '1.75rem',
      },
      boxShadow: {
        soft: '0 14px 34px -14px rgba(36, 28, 22, 0.35)',
        gentle: '0 4px 16px -6px rgba(36, 28, 22, 0.18)',
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 20px 50px -18px rgba(198, 113, 74, 0.45)',
        // chunky offset "sticker" shadow used on primary buttons — no blur, just a hard drop
        chunky: '0 5px 0 0 #A85736',
        'chunky-sm': '0 4px 0 0 rgba(36, 28, 22, 0.18)',
      },
      backgroundImage: {
        'peach-fade': 'radial-gradient(circle at 15% 0%, #F3E6D2 0%, #FAF3E7 45%, #FAF3E7 100%)',
        'blush-fade': 'linear-gradient(135deg, #C6714A 0%, #A85736 100%)',
        'noir-fade': 'radial-gradient(circle at 85% -10%, #3F3128 0%, #241C16 55%)',
        'noir-radial': 'radial-gradient(circle at 80% 20%, rgba(198,113,74,0.25) 0%, rgba(36,28,22,0) 55%)',
      },
    },
  },
  plugins: [],
}
