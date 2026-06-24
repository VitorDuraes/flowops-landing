"use client";
// 08 . Fale com a gente (/cliente/suporte)
// O cliente/lead NAO abre chamado no portal: o contato e somente por WhatsApp.
// O sistema de tickets (suporte) e uma ferramenta interna do admin.
import Link from "next/link";
import { Icon } from "@/components/icons";
import { whatsappUrl } from "@/lib/contact";

export default function FaleComAGentePage() {
  const url = whatsappUrl("Olá! Sou cliente WaveOps e preciso de ajuda.");
  return (
    <>
      <div className="page-head">
        <div>
          <h2>Fale com a gente</h2>
          <div className="lead">Dúvidas, ajustes ou cobrança: a gente resolve com você no WhatsApp.</div>
        </div>
        <a className="btn btn-primary btn-lg" href={url} target="_blank" rel="noopener">
          <Icon name="whatsapp" /> Abrir o WhatsApp
        </a>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="section-title">Atendimento no WhatsApp</div>
          <p className="muted" style={{ marginTop: -4 }}>
            Resposta no mesmo dia útil. Fale com a gente para ajustes nas automações, dúvidas de cobrança ou
            qualquer coisa do seu plano. É o canal direto com a equipe.
          </p>
          <a className="btn btn-primary" href={url} target="_blank" rel="noopener" style={{ marginTop: 8 }}>
            <Icon name="whatsapp" /> Falar agora
          </a>
        </div>

        <div className="card">
          <div className="section-title">Atalhos</div>
          <div className="lrow">
            <div className="ic">
              <Icon name="invoice" />
            </div>
            <div className="gr">
              <div className="t">Faturas e pagamento</div>
              <div className="s">Veja e pague suas faturas na hora</div>
            </div>
            <Link className="btn btn-ghost btn-sm" href="/cliente/faturas">
              Abrir
            </Link>
          </div>
          <div className="lrow">
            <div className="ic">
              <Icon name="plan" />
            </div>
            <div className="gr">
              <div className="t">Meu plano</div>
              <div className="s">Detalhes e benefícios</div>
            </div>
            <Link className="btn btn-ghost btn-sm" href="/cliente/plano">
              Abrir
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
