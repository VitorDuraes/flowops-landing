"use client";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { useAdminActions } from "./useAdminActions";

// Acoes por linha de cliente: WhatsApp (abre o chat) e ver detalhes.
// O reenvio de cobranca fica na tela de Faturas e no detalhe do cliente, onde
// existe a fatura especifica.
export function RowActions({ id, phone }: { id: string; phone?: string }) {
  const { wa } = useAdminActions();
  return (
    <div className="row-actions">
      <button
        className="act"
        title="WhatsApp"
        onClick={(e) => {
          e.stopPropagation();
          wa(phone);
        }}
      >
        <Icon name="whatsapp" />
      </button>
      <Link className="act" title="Ver detalhes" href={`/admin/clientes/${id}`} onClick={(e) => e.stopPropagation()}>
        <Icon name="eye" />
      </Link>
    </div>
  );
}
