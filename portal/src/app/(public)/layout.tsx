// Grupo publico (/checkout): sem shell, a propria tela traz a nav.
// Os planos ficam na landing (index.html, secao #pacotes), nao no portal.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
