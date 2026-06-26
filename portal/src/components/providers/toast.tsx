"use client";
// Toasts (canto inferior direito, auto-dismiss ~2,6s). Animado por CSS (entra com
// keyframe, sai com a classe .leaving). Robusto: nao depende de animacao JS.
import * as React from "react";
import { Icon } from "@/components/icons";

type ToastType = "ok" | "info";
interface ToastItem {
  id: number;
  msg: string;
  type: ToastType;
  leaving?: boolean;
}

type Ctx = { toast: (msg: string, type?: ToastType) => void };
const ToastCtx = React.createContext<Ctx | null>(null);
let _id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((msg: string, type: ToastType = "ok") => {
    const id = ++_id;
    setItems((p) => [...p, { id, msg, type }]);
    window.setTimeout(() => {
      setItems((p) => p.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      window.setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 300);
    }, 2600);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="toasts">
        {items.map((t) => (
          <div key={t.id} className={"toast " + t.type + (t.leaving ? " leaving" : "")}>
            <span className="ti">
              <Icon name={t.type === "info" ? "bell" : "check"} />
            </span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const c = React.useContext(ToastCtx);
  if (!c) throw new Error("useToast precisa estar dentro de <ToastProvider>");
  return c.toast;
}
