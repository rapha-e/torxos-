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
          base: "#0A0A0C",
          card: "#121216",
          overlay: "#18181F",
          border: "rgba(255, 255, 255, 0.08)",
          "border-highlight": "rgba(255, 255, 255, 0.16)",
        },
        border: {
          DEFAULT: "rgba(28, 25, 23, 0.07)",
          micro: "rgba(28, 25, 23, 0.06)",
          subtle: "#E7E7E2",
          darker: "#DDDCD6",
        },
        content: {
          primary: "#F4F4F5",   // zinc-100 (Alto contraste para títulos/corpo)
          secondary: "#A1A1AA", // zinc-400 (Mínimo 4.5:1 sobre o fundo)
          muted: "#71717A",     // zinc-500 (Apenas metadados secundários)
        },
        brand: {
          DEFAULT: "#181816",
          hover: "#2D2D29",
          muted: "#EBEAE5",
          amber: "#F59E0B",
          "amber-hover": "#D97706",
          "amber-muted": "rgba(245, 158, 11, 0.12)",
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
