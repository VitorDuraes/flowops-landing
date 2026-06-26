"use client";
// Store de tema/densidade/estado-demo (fonte unica de verdade no client).
// Equivalente ao theme-store.js do prototipo. Persiste em localStorage.
import * as React from "react";
import type { Theme, Density, DemoState } from "@/lib/types";

const KEY = "waveops:portal:v1";

interface State {
  theme: Theme;
  density: Density;
  demo: DemoState;
}

const DEFAULTS: State = { theme: "dark", density: "comfortable", demo: "em-dia" };

type Ctx = State & {
  set: (patch: Partial<State>) => void;
  toggleTheme: () => void;
};

const StoreCtx = React.createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<State>(DEFAULTS);

  // Hidrata do localStorage apos montar (mantem o primeiro render igual ao do servidor).
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
      if (saved && typeof saved === "object") setState((p) => ({ ...p, ...saved }));
    } catch {
      /* ignora */
    }
  }, []);

  // Aplica atributos no <html> e persiste a cada mudanca.
  React.useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-theme", state.theme);
    el.setAttribute("data-density", state.density);
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignora */
    }
  }, [state]);

  const set = React.useCallback((patch: Partial<State>) => {
    setState((p) => ({ ...p, ...patch }));
  }, []);

  const toggleTheme = React.useCallback(() => {
    setState((p) => ({ ...p, theme: p.theme === "dark" ? "light" : "dark" }));
  }, []);

  return <StoreCtx.Provider value={{ ...state, set, toggleTheme }}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = React.useContext(StoreCtx);
  if (!c) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return c;
}
