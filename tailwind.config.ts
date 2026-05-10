import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        card: "0 1px 2px rgba(23, 33, 27, 0.04), 0 1px 3px rgba(23, 33, 27, 0.06)",
      },
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
