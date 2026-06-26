"use client";
import * as React from "react";
import { MotionConfig } from "framer-motion";
import { StoreProvider } from "./store";
import { ToastProvider } from "./toast";
import { ModalProvider } from "./modal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <ToastProvider>
          <ModalProvider>{children}</ModalProvider>
        </ToastProvider>
      </StoreProvider>
    </MotionConfig>
  );
}

// Script anti-flash: aplica tema/densidade salvos antes do primeiro paint.
// Inserido no <head> do layout raiz.
export const themeInitScript = `(function(){try{var s=JSON.parse(localStorage.getItem('waveops:portal:v1')||'{}');var t=s.theme==='light'?'light':'dark';var d=s.density==='compact'?'compact':'comfortable';var e=document.documentElement;e.setAttribute('data-theme',t);e.setAttribute('data-density',d);}catch(e){}})();`;

export { useStore } from "./store";
export { useToast } from "./toast";
export { useModal } from "./modal";
