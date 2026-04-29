/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        green:   "#00ff87",
        surface: "#0f0f0f",
        border:  "#1e1e1e",
      },
      fontFamily: {
        mono: ["var(--font-dm-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};