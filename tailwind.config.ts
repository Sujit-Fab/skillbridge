import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#d8efff",
          500: "#0ea5e9",
          700: "#0369a1",
          950: "#082f49",
        },
      },
    },
  },
  plugins: [],
};

export default config;
