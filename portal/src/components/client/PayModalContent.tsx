"use client";
// Conteudo do modal de pagamento. O conteudo e o botao mudam conforme a forma:
// PIX (QR + copia codigo), Cartao (vai pro gateway, portal nao guarda cartao),
// Boleto (gera e envia por e-mail). No MVP e visual/mock; o pagamento real passa
// pelo gateway (Mercado Pago).
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/providers";
import { fmtFull } from "@/lib/format";
import type { ClientInvoice } from "@/lib/types";

type Method = "pix" | "card" | "boleto";

export function PayModalContent({
  inv,
  onClose,
  onCopy,
}: {
  inv: ClientInvoice;
  onClose: () => void;
  onCopy: () => void;
}) {
  const [m, setM] = useState<Method>("pix");
  const toast = useToast();
  const methods: { m: Method; icon: "pix" | "card" | "barcode"; label: string }[] = [
    { m: "pix", icon: "pix", label: "PIX" },
    { m: "card", icon: "card", label: "Cartão" },
    { m: "boleto", icon: "barcode", label: "Boleto" },
  ];

  return (
    <>
      <div className="modal-head">
        <h3>Pagar fatura {inv.id}</h3>
        <button className="act" onClick={onClose} aria-label="Fechar">
          <Icon name="close" />
        </button>
      </div>
      <div className="modal-body">
        <div className="flex between" style={{ marginBottom: 16 }}>
          <span className="muted">Valor</span>
          <span className="big-amount" style={{ fontSize: 22 }}>
            {fmtFull(inv.amount)}
          </span>
        </div>
        <div className="field">
          <label>Forma de pagamento</label>
          <div className="pay-methods">
            {methods.map((o) => (
              <div key={o.m} className={"pay-opt" + (m === o.m ? " active" : "")} onClick={() => setM(o.m)}>
                <Icon name={o.icon} />
                <div className="pl">{o.label}</div>
              </div>
            ))}
          </div>
        </div>

        {m === "pix" && (
          <div className="card" style={{ background: "var(--surface-2)", textAlign: "center", marginTop: 14 }}>
            <div
              style={{
                width: 140,
                height: 140,
                margin: "6px auto",
                borderRadius: 12,
                background: "#fff",
                display: "grid",
                placeItems: "center",
              }}
            >
              <div
                style={{
                  width: 108,
                  height: 108,
                  background: "repeating-conic-gradient(#15131c 0 25%, #fff 0 50%) 50%/16px 16px",
                }}
              />
            </div>
            <div className="hint">Aponte a câmera ou copie o código PIX</div>
          </div>
        )}

        {m === "card" && (
          <div className="alert ok" style={{ marginTop: 14 }}>
            <Icon name="card" />
            <div className="body">
              <div className="at" style={{ fontSize: 13.5 }}>
                Pagamento no cartão
              </div>
              <div className="as">
                Você vai para o ambiente seguro do gateway para concluir. A WaveOps não armazena os dados do seu cartão.
              </div>
            </div>
          </div>
        )}

        {m === "boleto" && (
          <div className="alert ok" style={{ marginTop: 14 }}>
            <Icon name="barcode" />
            <div className="body">
              <div className="at" style={{ fontSize: 13.5 }}>
                Pagamento por boleto
              </div>
              <div className="as">
                Geramos o boleto e enviamos para o seu e-mail. A compensação leva de 1 a 3 dias úteis.
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        {m === "pix" && (
          <button className="btn btn-primary" onClick={onCopy}>
            <Icon name="copy" /> Copiar código PIX
          </button>
        )}
        {m === "card" && (
          <button
            className="btn btn-primary"
            onClick={() => {
              onClose();
              toast("Abrindo o ambiente seguro do gateway...", "info");
            }}
          >
            <Icon name="card" /> Ir para o pagamento
          </button>
        )}
        {m === "boleto" && (
          <button
            className="btn btn-primary"
            onClick={() => {
              onClose();
              toast("Boleto gerado e enviado para o seu e-mail");
            }}
          >
            <Icon name="barcode" /> Gerar boleto
          </button>
        )}
      </div>
    </>
  );
}
