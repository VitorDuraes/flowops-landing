import { initials } from "@/lib/format";
import { me } from "@/lib/data";
import { LogoutButton } from "./LogoutButton";

// Bloco do usuario no rodape da sidebar (cliente).
export function ClientFoot() {
  return (
    <div className="side-user">
      <div className="av">{initials(me.name)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="nm">{me.name}</div>
        <div className="em">{me.company}</div>
      </div>
      <LogoutButton to="/cliente/login" />
    </div>
  );
}

// Bloco da equipe no rodape da sidebar (admin).
export function AdminFoot() {
  return (
    <div className="side-user">
      <div className="av" style={{ background: "linear-gradient(140deg,#22c55e,#16a34a)" }}>
        WO
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="nm">Equipe WaveOps</div>
        <div className="em">Admin · financeiro</div>
      </div>
      <LogoutButton to="/admin/login" />
    </div>
  );
}
