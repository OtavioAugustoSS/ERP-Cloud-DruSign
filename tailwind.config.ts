import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#22d3ee", // Cyan 400
                "primary-hover": "#06b6d4", // Cyan 500
                "background-light": "#f8fafc",
                "background-dark": "#020617", // Slate 950 (Black/Blue tint)
                "surface-dark": "#0f172a", // Slate 900
                "surface-darker": "#020617", // Slate 950
                "panel-dark": "#1e293b", // Slate 800
            },
            fontFamily: {
                display: ["Spline Sans", "sans-serif"],
                mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
            },
            borderRadius: {
                DEFAULT: "1rem",
                lg: "2rem",
                xl: "3rem",
            },
            backgroundImage: {
                "grid-pattern":
                    "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
            },
        },
    },
    plugins: [],
};
export default config;
