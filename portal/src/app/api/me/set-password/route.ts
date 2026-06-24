import { NextResponse } from "next/server";
import { guard, ok, err } from "@/server/http";
import { getRepo } from "@/server/repo";
import { hashPassword } from "@/server/auth";
import { log } from "@/server/log";

// Define a senha do cliente AUTENTICADO (sessao criada apos o codigo por e-mail na
// ativacao). Fluxo pos-pagamento: e-mail -> codigo (verify-code cria a sessao) -> senha.
export async function POST(req: Request) {
  const u = await guard(["customer"]);
  if (u instanceof NextResponse) return u;
  const { password } = await req.json().catch(() => ({}) as { password?: string });
  if (!password || password.length < 8) {
    return err("A senha precisa ter ao menos 8 caracteres");
  }
  await getRepo().setCustomerPassword(u.sub, hashPassword(password));
  log.info("senha.definida", { customerId: u.sub });
  return ok({ ok: true });
}
