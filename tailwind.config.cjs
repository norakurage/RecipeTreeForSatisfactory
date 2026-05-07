/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        machine: {
          smelter:     '#f97316',
          constructor: '#3b82f6',
          assembler:   '#a855f7',
          manufacturer:'#eab308',
          refinery:    '#06b6d4',
          foundry:     '#ef4444',
          blender:     '#22c55e',
          packager:    '#ec4899',
          particle:    '#6366f1',
          quantum:     '#8b5cf6',
          converter:   '#14b8a6',
          raw:         '#6b7280',
        },
      },
    },
  },
  plugins: [],
}
