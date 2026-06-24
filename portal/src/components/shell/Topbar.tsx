"use client";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PAGE_META } from "@/lib/nav";

function resolveMeta(path: string): { title: string; crumb: string } {
  if (PAGE_META[path]) return PAGE_META[path];
  const m = path.match(/^\/admin\/clientes\/(.+)$/);
  if (m) {
    return { title: "Cliente", crumb: "Admin · Clientes · " + m[1] };
  }
  return { title: "WaveOps", crumb: "" };
}

export function Topbar({
  onHamb,
  bell,
  search = true,
}: {
  onHamb: () => void;
  bell?: boolean;
  search?: boolean;
}) {
  const path = usePathname();
  const meta = resolveMeta(path);
  return (
    <header className="topbar">
      <button className="icon-btn hamb" onClick={onHamb} aria-label="Abrir menu">
        <Icon name="menu" />
      </button>
      <div>
        <h1>{meta.title}</h1>
        {meta.crumb && <div className="crumb">{meta.crumb}</div>}
      </div>
      <div className="sp" />
      {search && (
        <div className="search">
          <Icon name="search" />
          <input placeholder="Buscar..." />
        </div>
      )}
      {bell && (
        <button className="icon-btn" title="Notificações" aria-label="Notificações">
          <Icon name="bell" />
          <span className="dotred" />
        </button>
      )}
      <ThemeToggle />
    </header>
  );
}
