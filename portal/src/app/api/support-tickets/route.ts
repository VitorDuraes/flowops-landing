import { NextRequest, NextResponse } from "next/server";
import { guard, ok, err } from "@/server/http";
import { getRepo } from "@/server/repo";

// Suporte e ferramenta INTERNA do admin. O cliente/lead nao abre chamado pelo
// portal (o contato dele e somente por WhatsApp); por isso GET e POST sao admin-only.
export async function GET() {
  const u = await guard(["admin"]);
  if (u instanceof NextResponse) return u;
  return ok(await getRepo().listTickets());
}

export async function POST(req: NextRequest) {
  const u = await guard(["admin"]);
  if (u instanceof NextResponse) return u;
  const body = await req.json().catch(() => ({}) as Record<string, string>);
  if (!body.customerId) return err("Informe o cliente (customerId)");
  if (!body.title) return err("Informe o título do chamado");
  const ticket = await getRepo().createTicket({
    customerId: body.customerId,
    title: body.title,
    type: body.type || "Outro",
    priority: body.priority || "Média",
    description: body.description,
  });
  // O chamado e espelhado no WaveOps CRM (Twenty) automaticamente pelo repo (createTicket).
  return ok(ticket, 201);
}
