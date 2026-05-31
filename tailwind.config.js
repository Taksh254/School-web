/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pistachio: "#B7C9A8",
        cream: "#F7F2E8",
        beige: "#E8D8C3",
        olive: "#5F6B55",
        sage: {
          DEFAULT: "#9CAF88",
          light: "#B7C9A8",
          dark: "#6B7F5A",
        },
        "soft-white": "#FCFBF8",
        navy: {
          DEFAULT: "#3D4F5F",
          light: "#5A6F7F",
        },
        terracotta: "#C4785A",
        wood: {
          DEFAULT: "#A0896A",
          dark: "#7D6A50",
        },
      },
      fontFamily: {
        display: ["var(--font-nunito)", "ui-sans-serif", "sans-serif"],
        body: ["var(--font-inter)", "ui-sans-serif", "sans-serif"],
        hand: ["var(--font-caveat)", "cursive"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(90, 100, 80, 0.06), 0 2px 8px rgba(90, 100, 80, 0.04)",
        card: "0 8px 32px rgba(90, 100, 80, 0.08), 0 2px 8px rgba(90, 100, 80, 0.04)",
        lift: "0 12px 40px rgba(90, 100, 80, 0.12), 0 4px 12px rgba(90, 100, 80, 0.06)",
        glow: "0 0 0 3px rgba(183, 201, 168, 0.15)",
      },
    },
  },
  plugins: [],
};
