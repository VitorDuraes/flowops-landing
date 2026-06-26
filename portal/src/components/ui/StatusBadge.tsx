// Badge de status (mapeia status -> tom + rotulo). Pode ser usado em qualquer lugar.
import { statusMeta } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  const [tone, label] = statusMeta(status);
  return (
    <span className={"badge " + tone}>
      <span className="d" />
      {label}
    </span>
  );
}
