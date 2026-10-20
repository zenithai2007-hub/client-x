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
          bg: "#E9EDF4",
          surface: "#FBFCFE",
          ink: "#111827",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        /* Soft 3D / neumorphic system — cool diffused shadows + white highlights.
           Raised surfaces sit on the #E9EDF4 page background. */
        "cx-card":
          "5px 5px 12px rgba(163,177,198,0.38), -5px -5px 12px rgba(255,255,255,0.85), inset 1px 1px 1px rgba(255,255,255,0.55)",
        "cx-card-hover":
          "8px 8px 20px rgba(163,177,198,0.46), -8px -8px 20px rgba(255,255,255,0.92), inset 1px 1px 1px rgba(255,255,255,0.6)",
        "cx-raised-sm":
          "3px 3px 8px rgba(163,177,198,0.4), -3px -3px 8px rgba(255,255,255,0.9)",
        "cx-pop":
          "0 18px 44px rgba(31,41,55,0.16), 8px 8px 20px rgba(163,177,198,0.35), -4px -4px 14px rgba(255,255,255,0.5)",
        "cx-inset":
          "inset 4px 4px 9px rgba(163,177,198,0.42), inset -4px -4px 9px rgba(255,255,255,0.9)",
        "cx-inset-sm":
          "inset 2px 2px 5px rgba(163,177,198,0.45), inset -2px -2px 5px rgba(255,255,255,0.9)",
        "cx-btn":
          "4px 4px 10px rgba(163,177,198,0.45), -4px -4px 10px rgba(255,255,255,0.9), inset 1px 1px 1px rgba(255,255,255,0.7)",
        "cx-btn-press":
          "inset 3px 3px 7px rgba(163,177,198,0.5), inset -3px -3px 7px rgba(255,255,255,0.85)",
      },
      borderRadius: {
        cx: "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
