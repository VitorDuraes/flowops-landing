"use client";
import { useStore } from "@/components/providers/store";
import { Icon } from "@/components/icons";

export function ThemeToggle() {
  const { toggleTheme } = useStore();
  return (
    <button className="icon-btn" id="theme-toggle" title="Tema" aria-label="Alternar tema" onClick={toggleTheme}>
      <span className="ic-sun">
        <Icon name="sun" />
      </span>
      <span className="ic-moon">
        <Icon name="moon" />
      </span>
    </button>
  );
}
