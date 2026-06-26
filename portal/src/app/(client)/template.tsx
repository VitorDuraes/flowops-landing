"use client";
// Transicao de pagina da area do cliente. O template remonta a cada navegacao,
// entao o conteudo entra suavemente sem mexer no shell (sidebar/topbar ficam fixos).
import { PageTransition } from "@/components/motion";

export default function ClientTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
