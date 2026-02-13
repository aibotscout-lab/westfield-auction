import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FEFDFB",
        coral: {
          DEFAULT: "#E07A5F",
          hover: "#C96A52",
          light: "#F4D1C7",
        },
        slate: {
          DEFAULT: "#2D3748",
          light: "#4A5568",
        },
        sage: {
          DEFAULT: "#81B29A",
          light: "#A8D5BA",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
