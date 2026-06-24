import Link from "next/link";
import { Icon } from "@/components/icons";
import { PublicNav } from "@/components/shell/PublicNav";

// Retorno do checkout em modo mock (sem gateway real configurado).
export default function CheckoutSucessoPage() {
  return (
    <>
      <PublicNav />
      <div className="pub-wrap" style={{ maxWidth: 560 }}>
        <div className="card center" style={{ padding: 40 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 18px",
              borderRadius: 18,
              display: "grid",
              placeItems: "center",
              background: "var(--ok-bg)",
              color: "var(--ok)",
            }}
          >
            <Icon name="checkCircle" />
          </div>
          <h1 style={{ fontSize: 26 }}>Assinatura iniciada</h1>
          <p className="muted" style={{ marginTop: 10 }}>
            Em produção, aqui você seria levado ao pagamento do gateway. Assim que o pagamento for confirmado, sua área do
            cliente é liberada.
          </p>
          <div className="flex gap12" style={{ justifyContent: "center", marginTop: 22 }}>
            <Link className="btn btn-primary btn-lg" href="/cliente/login">
              Acessar área do cliente
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
