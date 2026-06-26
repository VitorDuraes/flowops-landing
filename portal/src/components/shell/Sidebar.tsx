"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, BrandMark } from "@/components/icons";
import type { NavEntry, NavItem } from "@/lib/nav";

function isActive(path: string, item: NavItem) {
  if (path === item.href) return true;
  if (item.href === "/admin" || item.href === "/cliente") return false;
  return path.startsWith(item.href + "/");
}

export function Sidebar({
  nav,
  foot,
  open,
  onNavigate,
}: {
  nav: NavEntry[];
  foot: React.ReactNode;
  open: boolean;
  onNavigate: () => void;
}) {
  const path = usePathname();
  return (
    <aside className={"sidebar" + (open ? " open" : "")} id="sidebar">
      <div className="side-brand">
        <BrandMark size={34} />
        <span>
          Wave<span className="v">Ops</span>
        </span>
      </div>
      <nav className="side-nav">
        {nav.map((item, i) =>
          "sec" in item ? (
            <div key={"sec-" + i} className="side-sec">
              {item.sec}
            </div>
          ) : (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              className={"side-link" + (isActive(path, item) ? " active" : "")}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.count && <span className="count">{item.count}</span>}
            </Link>
          )
        )}
      </nav>
      <div className="side-foot">{foot}</div>
    </aside>
  );
}
