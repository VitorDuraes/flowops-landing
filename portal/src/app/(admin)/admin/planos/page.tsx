"use client";
// 15 . Planos (/admin/planos)
import { Icon } from "@/components/icons";
import { useToast } from "@/components/providers";
import { plans } from "@/lib/data";
import { fmt } from "@/lib/format";

const counts: Record<string, number> = { operacao: 6, essencial: 2, pro: 1, business: 1 };

export default function PlanosAdminPage() {
  const toast = useToast();
  const totalSubs = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Planos</h2>
          <div className="lead">
            {plans.length} planos · {totalSubs} assinantes ativos.
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => toast("Novo plano...", "info")}>
          <Icon name="plus" /> Novo plano
        </button>
      </div>

      <div className="grid cols-4">
        {plans.map((p) => (
          <div className="card" key={p.id}>
            <div className="flex between">
              <div className="cell-strong" style={{ fontFamily: "var(--font-display)", fontSize: 17 }}>
                {p.name}
              </div>
              {p.featured && <span className="badge accent">Mais escolhido</span>}
            </div>
            <div className="muted" style={{ fontSize: 13.5, marginTop: 6, minHeight: 38 }}>
              {p.desc}
            </div>
            <div className="big-amount" style={{ fontSize: 28, margin: "14px 0 0" }}>
              {fmt(p.monthly)}
              <span style={{ fontSize: 14, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>/mês</span>
            </div>
            <div className="cell-sub mono">ou {fmt(p.annual)}/mês no anual</div>
            <div
              className="flex between"
              style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}
            >
              <span className="muted" style={{ fontSize: 13 }}>
                {counts[p.id]} assinante{counts[p.id] === 1 ? "" : "s"}
              </span>
              <div className="flex gap8">
                <button className="act" onClick={() => toast("Editar plano...", "info")}>
                  <Icon name="edit" />
                </button>
                <span className="badge ok">
                  <span className="d" />
                  Ativo
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <div className="section-title">Distribuição por plano</div>
        {plans.map((p) => {
          const w = Math.round((counts[p.id] / totalSubs) * 100);
          return (
            <div key={p.id}>
              <div className="flex between" style={{ padding: "6px 0" }}>
                <span>
                  {p.name} · {counts[p.id]} cliente{counts[p.id] === 1 ? "" : "s"}
                </span>
                <span className="cell-strong">{fmt(p.monthly * counts[p.id])}/mês</span>
              </div>
              <div className="bar" style={{ margin: "6px 0 12px" }}>
                <i style={{ width: w + "%", ...(p.featured ? { background: "var(--accent-strong)" } : {}) }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
