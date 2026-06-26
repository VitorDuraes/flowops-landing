import { NextResponse } from "next/server";
import { guard, ok, err } from "@/server/http";
import { getRepo } from "@/server/repo";

// Detalhe do cliente para o painel admin: dados + faturas + follow-ups num payload.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await guard(["admin"]);
  if (u instanceof NextResponse) return u;
  const { id } = await params;
  const repo = getRepo();
  const customer = await repo.getCustomerById(id);
  if (!customer) return err("Cliente não encontrado", 404);
  const [invoices, followups, brief, tickets] = await Promise.all([
    repo.listInvoicesForCustomer(id),
    repo.listFollowupsForCustomer(id),
    repo.getBriefForCustomer(id),
    repo.listTickets(id),
  ]);
  return ok({ customer, invoices, followups, brief, tickets });
}
