"use client";
// 14 . Follow-ups (/admin/followups)
import { Icon, type IconName } from "@/components/icons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Loading, LoadError } from "@/components/ui/Loading";
import { useApi } from "@/lib/useApi";
import { useAdminActions } from "@/components/admin/useAdminActions";
import { reguaSteps } from "@/lib/data";
import { initials } from "@/lib/format";
import type { Followup, FollowupChannel } from "@/lib/types";

// Canal -> cor + icone. Discord substitui o Slack.
function ChannelCell({ ch }: { ch: FollowupChannel }) {
  const map: Record<string, [string, IconName]> = {
    WhatsApp: ["#22c55e", "whatsapp"],
    "E-mail": ["var(--info)", "mail"],
    Discord: ["var(--accent-strong)", "discord"],
  };
  const [col, icon] = map[ch] || ["var(--muted)", "bell"];
  return (
    <span className="cell-ch" style={{ color: col }}>
      <Icon name={icon} />
      <span style={{ color: "var(--text)" }}>{ch}</span>
    </span>
  );
}

export default function FollowupsPage() {
  const { runDunning } = useAdminActions();
  const req = useApi<Followup[]>("/api/followups");

  if (req.loading) return <Loading />;
  if (req.error || !req.data)
    return <LoadError message={req.error || "Não foi possível carregar os follow-ups."} onRetry={req.reload} />;

  const followups = req.data;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Follow-ups</h2>
          <div className="lead">Régua automática de cobrança, antes e depois do vencimento.</div>
        </div>
        <button className="btn btn-primary" onClick={() => runDunning(req.reload)}>
          <Icon name="bell" /> Rodar régua agora
        </button>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="section-title">Régua de cobrança</div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
          {reguaSteps.map((s) => (
            <div key={s.key} className="card" style={{ background: "var(--surface-2)", padding: 14, textAlign: "center" }}>
              <div className={"badge " + s.tone} style={{ marginBottom: 8 }}>
                <span className="d" />
                {s.when}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <p className="hint" style={{ marginTop: 14 }}>
          Enviada por WhatsApp e e-mail. O sistema evita duplicar o mesmo follow-up para a mesma fatura. Acima de 7 dias,
          o cliente é pausado.
        </p>
      </div>

      <div className="card flush">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Canal</th>
                <th>Enviado</th>
                <th>Status</th>
                <th>Fatura</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {followups.map((f) => (
                <tr key={f.id}>
                  <td>
                    <div className="cell-user">
                      <span className="avatar-sm">{initials(f.customer)}</span>
                      <div className="cell-strong">{f.customer}</div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={
                        "badge " + (f.label.includes("Vencido") ? "danger" : f.label.includes("antes") ? "info" : "warn")
                      }
                    >
                      <span className="d" />
                      {f.label}
                    </span>
                  </td>
                  <td>
                    <ChannelCell ch={f.channel} />
                  </td>
                  <td className="cell-mono">{f.sentAt}</td>
                  <td>
                    <StatusBadge status={f.status} />
                  </td>
                  <td className="cell-mono">{f.invoice}</td>
                  <td className="muted">{f.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
