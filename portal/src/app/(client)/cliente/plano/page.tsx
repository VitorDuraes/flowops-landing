"use client";
// 05 . Meu Plano (/cliente/plano)
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useClientCtx } from "@/components/client/useClientCtx";
import { Loading, LoadError } from "@/components/ui/Loading";
import { plans } from "@/lib/data";
import { fmt } from "@/lib/format";
import { whatsappUrl } from "@/lib/contact";

export default function MeuPlanoPage() {
  const c = useClientCtx();

  // Upgrade/cancelamento sao tratados pelo WhatsApp (o cliente nao abre chamado no portal).
  function act(kind: "upgrade" | "cancel") {
    const msg = {
      upgrade: "Olá! Sou cliente WaveOps e quero fazer upgrade do meu plano.",
      cancel: "Olá! Sou cliente WaveOps e quero falar sobre o cancelamento da minha assinatura.",
    }[kind];
    window.open(whatsappUrl(msg), "_blank", "noopener");
  }

  if (c.loading) return <Loading />;
  if (c.error || !c.me)
    return <LoadError message={c.error || "Não foi possível carregar seu plano."} onRetry={c.reload} />;

  const m = c.me;
  const plan = plans.find((p) => p.id === m.planId) || plans[0];

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Meu Plano</h2>
          <div className="lead">Tudo sobre sua assinatura WaveOps.</div>
        </div>
        <StatusBadge status={c.statusKey} />
      </div>
      <div className="grid cols-2">
        <div>
          <div className="dl" style={{ marginBottom: 18 }}>
            <div className="di">
              <div className="dt">Plano</div>
              <div className="dd">{m.plan}</div>
            </div>
            <div className="di">
              <div className="dt">Valor</div>
              <div className="dd">
                {fmt(m.amount)}/{m.cycle}
              </div>
            </div>
            <div className="di">
              <div className="dt">Ciclo</div>
              <div className="dd">Mensal recorrente</div>
            </div>
            <div className="di">
              <div className="dt">Início</div>
              <div className="dd">{m.startDate}</div>
            </div>
            <div className="di">
              <div className="dt">Próx. vencimento</div>
              <div className="dd">{c.nextDue}</div>
            </div>
            <div className="di">
              <div className="dt">Pagamento</div>
              <div className="dd">{m.paymentMethod}</div>
            </div>
          </div>
          <div className="card">
            <div className="section-title">Ações</div>
            <div className="flex gap8 wrap">
              <button className="btn btn-ghost" onClick={() => act("upgrade")}>
                <Icon name="trend" /> Solicitar upgrade
              </button>
              <button className="btn btn-danger" onClick={() => act("cancel")}>
                Solicitar cancelamento
              </button>
            </div>
            <p className="hint" style={{ marginTop: 12 }}>
              Upgrade, downgrade e cancelamento: fale com a gente no WhatsApp e resolvemos com você.
            </p>
          </div>
        </div>
        <div className="card">
          <div className="section-title">O que está incluso</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 13 }}>
            {plan.benefits.map((b, i) => (
              <li className="flex gap12" key={i}>
                <span style={{ color: "var(--accent-strong)", flexShrink: 0 }}>
                  <Icon name="checkCircle" />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="alert ok" style={{ marginTop: 20 }}>
            <Icon name="flow" />
            <div className="body">
              <div className="at" style={{ fontSize: 13.5 }}>
                2 de 2 automações ativas
              </div>
              <div className="as">Distribuição de leads + follow-up de cobrança rodando.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
