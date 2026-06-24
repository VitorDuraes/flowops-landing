import { NextRequest } from "next/server";
import { verifyPassword, createSession } from "@/server/auth";
import { getRepo } from "@/server/repo";
import { ok, err } from "@/server/http";
import { rateLimit, clientIp } from "@/server/ratelimit";

// Login por e-mail OU CPF/CNPJ + senha. So clientes ja ativados (com senha definida).
export async function POST(req: NextRequest) {
  if (!rateLimit(`login-ip:${clientIp(req.headers)}`, 10, 60_000)) {
    return err("Muitas tentativas. Aguarde um minuto e tente novamente.", 429);
  }
  const { identifier, password } = await req
    .json()
    .catch(() => ({}) as { identifier?: string; password?: string });
  if (!identifier || !password) return err("Informe e-mail/CPF e senha");

  const cust = await getRepo().findCustomerForLogin(identifier.trim());
  // Mensagem generica (nao revela se a conta existe). verifyPassword retorna false
  // para hash nulo (conta sem senha definida ainda) em tempo constante.
  if (!cust || !verifyPassword(password, cust.passwordHash)) {
    return err("E-mail/CPF ou senha inválidos", 401);
  }
  await createSession({ sub: cust.id, role: "customer", email: cust.email });
  return ok({ ok: true });
}
