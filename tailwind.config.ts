import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cx: {
          purple: "#7C3AED",
          purpleDark: "#6D28D9",
          purpleLight: "#EDE9FE",
          orange: "#FF7A18",
          orangeDark: "#E56A0B",
          orangeLight: "#FFF1E5",
          bg: "#F7F8FC",
          ink: "#111827",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "cx-card": "0 2px 16px rgba(17,24,39,0.06)",
        "cx-card-hover": "0 6px 24px rgba(17,24,39,0.09)",
        "cx-pop": "0 12px 40px rgba(17,24,39,0.14)",
      },
      borderRadius: {
        "cx": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
