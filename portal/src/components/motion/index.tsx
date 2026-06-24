"use client";
// Primitivas de animacao do portal (framer-motion). Movimentos curtos, ease-out
// ao entrar. A acessibilidade (prefers-reduced-motion) e tratada globalmente pelo
// <MotionConfig reducedMotion="user"> em components/providers, que desliga os
// transforms quando o usuario pede menos movimento.
import { motion, type Variants, type Transition } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

// ease-out suave (entrada). Duracoes curtas conforme as diretrizes (150-320ms).
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const ENTER: Transition = { duration: 0.3, ease: EASE_OUT };

// Transicao de pagina (usada nos template.tsx das areas logadas).
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: ENTER },
};

// Container com stagger + item, para entrada encadeada de grids/listas.
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE_OUT } },
};

interface WrapProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={pageVariants} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

// Grupo com entrada encadeada. Use StaggerItem nos filhos diretos.
export function Stagger({ children, className, style }: WrapProps) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className={className} style={style}>
      {children}
    </motion.div>
  );
}

// Item do Stagger. Substitui um <div className="..."> mantendo a mesma classe,
// para nao quebrar grids (o motion.div vira o filho direto do grid).
export function StaggerItem({ children, className, style }: WrapProps) {
  return (
    <motion.div variants={staggerItem} className={className} style={style}>
      {children}
    </motion.div>
  );
}
