import { NextRequest, NextResponse } from "next/server";
import { guard, ok, err } from "@/server/http";
import { getRepo } from "@/server/repo";
import { notifyDiscord } from "@/server/integrations";
import type { CustomerStatus } from "@/lib/types";

// Mudanca manual de status do cliente pelo painel admin (pausar/cancelar/reativar).
const ALLOWED: CustomerStatus[] = ["ativo", "pausado", "cancelado"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = await guard(["admin"]);
  if (u instanceof NextResponse) return u;
  const { id } = await params;
  const body = await req.json().catch(() => ({}) as { status?: string });
  const status = body.status as CustomerStatus;
  if (!status || !ALLOWED.includes(status)) {
    return err("Status inválido. Use: ativo, pausado ou cancelado.");
  }

  const customer = await getRepo().getCustomerById(id);
  if (!customer) return err("Cliente não encontrado", 404);

  await getRepo().setCustomerStatus(id, status);
  await notifyDiscord(`Cliente ${customer.company} alterado para "${status}" por ${u.email}.`);
  return ok({ ok: true, id, status });
}
