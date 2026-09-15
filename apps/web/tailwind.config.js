/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C1B1A",
        cream: "#FBF9F6",
        sand: "#F1ECE4",
        primary: {
          50: "#F1F0FE",
          100: "#E3E1FD",
          300: "#B4AFF8",
          500: "#5B4FE8",
          600: "#4A3EDB",
          700: "#3C31B0",
        },
        accent: {
          50: "#FFF4ED",
          200: "#FFD9BE",
          500: "#F2764B",
          600: "#E0602F",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,27,26,0.04), 0 8px 24px rgba(28,27,26,0.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
