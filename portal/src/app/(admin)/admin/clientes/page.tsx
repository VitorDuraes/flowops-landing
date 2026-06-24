"use client";
// 11 . Clientes (/admin/clientes)
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { RowActions } from "@/components/admin/RowActions";
import { NewCustomerModalContent } from "@/components/admin/NewCustomerModal";
import { useModal } from "@/components/providers";
import { useApi } from "@/lib/useApi";
import { Loading, LoadError } from "@/components/ui/Loading";
import { fmt, initials } from "@/lib/format";
import type { Customer, Metrics, CustomerStatus } from "@/lib/types";

const FILTERS: [string, string][] = [
  ["todos", "Todos"],
  ["ativo", "Ativos"],
  ["pendente", "Pendentes"],
  ["vencido", "Vencidos"],
  ["pausado", "Pausados"],
  ["cancelado", "Cancelados"],
];

export default function ClientesPage() {
  const router = useRouter();
  const { openModal } = useModal();
  const [filter, setFilter] = useState("todos");
  const [query, setQuery] = useState("");
  const cReq = useApi<Customer[]>("/api/customers");
  const mReq = useApi<Metrics>("/api/metrics");

  if (cReq.loading || mReq.loading) return <Loading />;
  if (cReq.error || mReq.error || !cReq.data || !mReq.data)
    return (
      <LoadError
        message={cReq.error || mReq.error || "Não foi possível carregar os clientes."}
        onRetry={() => {
          cReq.reload();
          mReq.reload();
        }}
      />
    );

  const customers = cReq.data;
  const M = mReq.data;

  // Filtra por status (chips) e por texto da busca (nome, empresa, e-mail, documento, telefone).
  const q = query.trim().toLowerCase();
  const list = customers.filter((c) => {
    if (filter !== "todos" && c.status !== (filter as CustomerStatus)) return false;
    if (!q) return true;
    return [c.name, c.company, c.email, c.document, c.phone]
      .some((v) => (v || "").toLowerCase().includes(q));
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Clientes</h2>
          <div className="lead">
            {q || filter !== "todos"
              ? `${list.length} de ${customers.length} clientes`
              : `${customers.length} clientes · ${M.active} ativos`}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => openModal(<NewCustomerModalContent onCreated={cReq.reload} />)}>
          <Icon name="plus" /> Novo cliente
        </button>
      </div>
      <div className="toolbar">
        {FILTERS.map(([k, l]) => (
          <button key={k} className={"chip-filter " + (k === filter ? "active" : "")} onClick={() => setFilter(k)}>
            {l}
          </button>
        ))}
        <div className="sp" />
        <div
          className="search"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "8px 13px",
            display: "flex",
            alignItems: "center",
            gap: 9,
            color: "var(--muted)",
          }}
        >
          <Icon name="search" />
          <input
            placeholder="Buscar cliente..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ background: "none", border: "none", color: "var(--text)", outline: "none" }}
          />
        </div>
      </div>
      <div className="card flush">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Próx. venc.</th>
                <th>Valor</th>
                <th>Último pgto</th>
                <th className="right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.length ? (
                list.map((c) => (
                  <tr key={c.id} onClick={() => router.push(`/admin/clientes/${c.id}`)}>
                    <td>
                      <div className="cell-user">
                        <span className="avatar-sm">{initials(c.name)}</span>
                        <div>
                          <div className="cell-strong">{c.name}</div>
                          <div className="cell-sub">{c.company}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{c.plan}</div>
                      <div className="cell-sub">{c.method}</div>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="cell-strong">{c.nextDue}</td>
                    <td>{fmt(c.amount)}</td>
                    <td className="muted">{c.lastPay}</td>
                    <td>
                      <RowActions id={c.id} phone={c.phone} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon="users" title="Nenhum cliente aqui" desc="Não há clientes com esse filtro no momento." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
