"use client";
// 07 . Pagamento (/cliente/pagamento)
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/providers";

type Method = "pix" | "card" | "boleto";

export default function PagamentoPage() {
  const toast = useToast();
  const [m, setM] = useState<Method>("pix");
  const methods: { m: Method; icon: "pix" | "card" | "barcode"; label: string }[] = [
    { m: "pix", icon: "pix", label: "PIX" },
    { m: "card", icon: "card", label: "Cartão" },
    { m: "boleto", icon: "barcode", label: "Boleto" },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Pagamento</h2>
          <div className="lead">Gerencie como você paga a WaveOps.</div>
        </div>
      </div>
      <div className="grid cols-2">
        <div className="card">
          <div className="section-title">Forma de pagamento atual</div>
          <div className="lrow" style={{ border: "none", paddingTop: 0 }}>
            <div className="ic" style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}>
              <Icon name="pix" />
            </div>
            <div className="gr">
              <div className="t">PIX recorrente</div>
              <div className="s">Cobrança automática todo dia 20</div>
            </div>
            <span className="badge ok">
              <span className="d" />
              Ativo
            </span>
          </div>
          <div className="flex gap8 wrap" style={{ marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => toast("Abrindo ambiente seguro do gateway...", "info")}>
              <Icon name="edit" /> Atualizar pagamento
            </button>
            <button className="btn btn-ghost" onClick={() => toast("Nova cobrança gerada")}>
              <Icon name="refresh" /> Gerar nova cobrança
            </button>
          </div>
        </div>
        <div className="card">
          <div className="section-title">Trocar método</div>
          <div className="pay-methods">
            {methods.map((o) => (
              <div key={o.m} className={"pay-opt" + (m === o.m ? " active" : "")} onClick={() => setM(o.m)}>
                <Icon name={o.icon} />
                <div className="pl">{o.label}</div>
              </div>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 14 }}>
            Ao trocar para cartão, você é levado ao ambiente seguro do gateway. A WaveOps não guarda os dados do seu
            cartão.
          </p>
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 14 }}
            onClick={() => toast("Forma de pagamento atualizada")}
          >
            Salvar forma de pagamento
          </button>
        </div>
      </div>
    </>
  );
}
