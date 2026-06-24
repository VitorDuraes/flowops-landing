"use client";
// 16 . Configuracoes (/admin/configuracoes)
import { Icon, type IconName } from "@/components/icons";
import { initials } from "@/lib/format";

// Discord substitui o Slack; o WaveOps CRM (Twenty) substitui o Trello/ClickUp.
const INTEGRATIONS: [IconName, string, string, "ok" | "warn", string][] = [
  ["money", "Mercado Pago", "Gateway de pagamento: checkout, cobranças e webhooks", "ok", "Conectado"],
  ["whatsapp", "WhatsApp (Z-API)", "Envio de follow-ups e avisos de cobrança", "ok", "Conectado"],
  ["mail", "Resend", "E-mails transacionais e login por código", "ok", "Conectado"],
  ["discord", "Discord", "Alertas internos de pagamento e inadimplência", "ok", "Conectado"],
  ["users", "WaveOps CRM (Twenty)", "Empresas, contatos, pipeline (oportunidades) e chamados", "warn", "Configurar"],
];

const TEAM: [string, string, string][] = [
  ["Equipe WaveOps", "financeiro@waveops.com.br", "Admin"],
  ["Suporte", "suporte@waveops.com.br", "Suporte"],
  ["Comercial", "comercial@waveops.com.br", "Comercial"],
];

export default function ConfiguracoesPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h2>Configurações</h2>
          <div className="lead">Integrações, equipe e régua de cobrança.</div>
        </div>
      </div>
      <div className="grid cols-2">
        <div className="card">
          <div className="section-title">Integrações</div>
          {INTEGRATIONS.map(([ic, nm, ds, tone, lbl]) => (
            <div className="lrow" key={nm}>
              <div className="ic" style={ic === "whatsapp" ? { color: "#22c55e" } : undefined}>
                <Icon name={ic} />
              </div>
              <div className="gr">
                <div className="t">{nm}</div>
                <div className="s">{ds}</div>
              </div>
              <span className={"badge " + tone}>
                <span className="d" />
                {lbl}
              </span>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 10 }}>
                {tone === "ok" ? "Gerenciar" : "Conectar"}
              </button>
            </div>
          ))}
        </div>
        <div>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="section-title">Equipe</div>
            {TEAM.map(([n, e, r]) => (
              <div className="lrow" key={e}>
                <div
                  className="avatar-sm"
                  style={{ background: "linear-gradient(140deg,var(--accent-strong),var(--accent-press))" }}
                >
                  {initials(n)}
                </div>
                <div className="gr">
                  <div className="t">{n}</div>
                  <div className="s">{e}</div>
                </div>
                <span className="badge accent">{r}</span>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}>
              <Icon name="plus" /> Convidar membro
            </button>
          </div>
          <div className="card">
            <div className="section-title">Régua de cobrança</div>
            <div className="flex between" style={{ padding: "8px 0" }}>
              <span>Pausar após atraso de</span>
              <span className="cell-strong">7 dias</span>
            </div>
            <div className="flex between" style={{ padding: "8px 0" }}>
              <span>Canal principal</span>
              <span className="cell-strong">WhatsApp</span>
            </div>
            <div className="flex between" style={{ padding: "8px 0" }}>
              <span>Horário de envio</span>
              <span className="cell-strong">08:00</span>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
              <Icon name="edit" /> Editar régua
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
