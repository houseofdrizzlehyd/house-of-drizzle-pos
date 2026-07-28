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
        cream: "#F7F2E8",
        chocolate: "#4A2C1D",
        gold: "#C8A45D",
        mocha: "#6B4A35",
        vanilla: "#E8DCC8",
        espresso: "#2B2B2B",
        blueberry: "#4B4FA1",
        strawberry: "#E84C6A",
        mango: "#F4A300",
        belgian: "#5A3422",
        oreo: "#3A3A3A",
        lotus: "#B86A3C",
        pistachio: "#7A9E48",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
