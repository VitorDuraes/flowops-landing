import type { Config } from "tailwindcss";

// Tokens da secao 9 do handoff expostos como utilitarios do Tailwind.
// As cores apontam para CSS variables definidas em globals.css, entao o tema
// claro/escuro (via [data-theme]) e a densidade (via [data-density]) continuam
// valendo automaticamente. O design system principal vive em globals.css; o
// Tailwind fica disponivel para layout e ajustes pontuais.
const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-2": "var(--bg-2)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        hover: "var(--hover)",
        border: "var(--border)",
        "border-2": "var(--border-2)",
        text: "var(--text)",
        "text-2": "var(--text-2)",
        muted: "var(--muted)",
        dim: "var(--dim)",
        accent: "var(--accent)",
        "accent-strong": "var(--accent-strong)",
        "accent-press": "var(--accent-press)",
        "accent-ink": "var(--accent-ink)",
        "accent-soft": "var(--accent-soft)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        danger: "var(--danger)",
        info: "var(--info)",
        paused: "var(--paused)",
        neutral: "var(--neutral)",
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
        mono: "var(--font-mono)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "var(--radius-sm)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        lg: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};

export default config;
