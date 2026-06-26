// Estados de carregamento e erro para as telas que leem da API.
// Visual alinhado aos cards/EmptyState ja usados no portal.
import { EmptyState } from "@/components/ui/EmptyState";

export function Loading({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="card">
      <div className="muted" style={{ padding: "28px 0", textAlign: "center", fontSize: 14 }}>
        {label}
      </div>
    </div>
  );
}

export function LoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card">
      <EmptyState icon="alert" title="Não foi possível carregar" desc={message} />
      {onRetry && (
        <div style={{ textAlign: "center", marginTop: 4, paddingBottom: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={onRetry}>
            Tentar de novo
          </button>
        </div>
      )}
    </div>
  );
}
