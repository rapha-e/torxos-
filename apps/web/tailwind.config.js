/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System Evorix Luxury Off-White
        canvas: "#F9F9F7",
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F3F3EF",
          hover: "#FAFAF8",
        },
        border: {
          DEFAULT: "rgba(28, 25, 23, 0.07)",
          micro: "rgba(28, 25, 23, 0.06)",
          subtle: "#E7E7E2",
          darker: "#DDDCD6",
        },
        content: {
          primary: "#1C1C1A",
          secondary: "#71716C",
          muted: "#A1A19B",
        },
        brand: {
          DEFAULT: "#181816",
          hover: "#2D2D29",
          muted: "#EBEAE5",
        },
        emerald: {
          DEFAULT: "#15803D",
          light: "#DCFCE7",
          border: "#BBF7D0",
        },
        risk: {
          DEFAULT: "#B91C1C",
          light: "#FEE2E2",
          border: "#FECACA",
        },
        amber: {
          DEFAULT: "#B45309",
          light: "#FEF3C7",
          border: "#FDE68A",
        },
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        card: "0px 1px 2px rgba(0, 0, 0, 0.02), 0px 4px 16px -2px rgba(0, 0, 0, 0.04)",
        cardHover: "0px 2px 4px rgba(0, 0, 0, 0.02), 0px 8px 24px -4px rgba(0, 0, 0, 0.07)",
        elevated: "0px 12px 32px -4px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
