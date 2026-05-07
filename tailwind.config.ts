import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        moss: "#536b4d",
        sand: "#f6f0e6",
      },
    },
  },
  plugins: [],
};

export default config;
