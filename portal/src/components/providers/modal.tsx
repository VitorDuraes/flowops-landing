"use client";
// Modal com scrim + blur, animado por CSS (montagem controlada por estado).
// Quando fechado, o scrim fica com pointer-events:none e opacity:0, entao NUNCA
// trava a tela mesmo se algo der errado. (framer-motion fica para transicoes de
// pagina/stagger; aqui CSS e mais robusto para overlay.)
import * as React from "react";

type Ctx = {
  openModal: (node: React.ReactNode) => void;
  closeModal: () => void;
};
const ModalCtx = React.createContext<Ctx | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [node, setNode] = React.useState<React.ReactNode>(null);
  const [open, setOpen] = React.useState(false);

  const openModal = React.useCallback((n: React.ReactNode) => {
    setNode(n);
    requestAnimationFrame(() => setOpen(true));
  }, []);

  const closeModal = React.useCallback(() => {
    setOpen(false);
    window.setTimeout(() => setNode(null), 200);
  }, []);

  return (
    <ModalCtx.Provider value={{ openModal, closeModal }}>
      {children}
      {node !== null && (
        <div
          className={"scrim" + (open ? " open" : "")}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal">{node}</div>
        </div>
      )}
    </ModalCtx.Provider>
  );
}

export function useModal() {
  const c = React.useContext(ModalCtx);
  if (!c) throw new Error("useModal precisa estar dentro de <ModalProvider>");
  return c;
}
