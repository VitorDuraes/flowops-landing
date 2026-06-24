"use client";
// Transicao de pagina do painel admin. Anima so o conteudo da pagina; o shell
// (sidebar/topbar) permanece estatico entre navegacoes.
import { PageTransition } from "@/components/motion";

export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
