import Link from "next/link";
import { BrandMark } from "@/components/icons";

// Nav das paginas publicas do portal (hoje so o checkout).
// Os planos ficam na landing (index.html, secao #pacotes). A marca volta para a
// home do site; "Ver planos" leva a secao de planos da landing.
export function PublicNav() {
  return (
    <nav className="pub-nav">
      <Link className="brand" href="/">
        <BrandMark size={32} />{" "}
        <span>
          Wave<span className="v">Ops</span>
        </span>
      </Link>
      <div className="sp" />
      <Link className="btn btn-quiet" href="/#pacotes">
        Ver planos
      </Link>
      <Link className="btn btn-primary" href="/cliente/login">
        Já sou cliente
      </Link>
    </nav>
  );
}
