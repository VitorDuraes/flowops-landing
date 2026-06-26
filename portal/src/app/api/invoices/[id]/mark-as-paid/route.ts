import { NextResponse } from "next/server";
import { guard, ok } from "@/server/http";
import { getRepo } from "@/server/repo";
import { notifyDiscord } from "@/server/integrations";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await guard(["admin"]);
  if (u instanceof NextResponse) return u;
  const { id } = await params;
  await getRepo().markInvoicePaid(id);
  await notifyDiscord(`Fatura ${id} marcada como paga manualmente por ${u.email}.`);
  return ok({ ok: true, invoice: id });
}
