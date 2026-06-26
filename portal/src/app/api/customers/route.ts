import { NextRequest, NextResponse } from "next/server";
import { guard, ok, err } from "@/server/http";
import { getRepo } from "@/server/repo";
import { notifyDiscord } from "@/server/integrations";

export async function GET() {
  const u = await guard(["admin"]);
  if (u instanceof NextResponse) return u;
  return ok(await getRepo().listCustomers());
}

export async function POST(req: NextRequest) {
  const u = await guard(["admin"]);
  if (u instanceof NextResponse) return u;
  const body = await req.json().catch(() => ({}) as Record<string, string>);
  if (!body.name || !body.email) return err("Nome e e-mail são obrigatórios");
  const customer = await getRepo().createCustomer({
    name: body.name,
    company: body.company || body.name,
    email: body.email,
    phone: body.phone,
    planId: body.planId || "operacao",
  });
  await notifyDiscord(`Novo cliente criado: ${customer.company} (${customer.email})`);
  return ok(customer, 201);
}
