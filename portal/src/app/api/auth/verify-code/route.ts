import { NextRequest } from "next/server";
import { verifyOtp, createSession } from "@/server/auth";
import { getRepo } from "@/server/repo";
import { ok, err } from "@/server/http";
import { rateLimit, clientIp } from "@/server/ratelimit";

export async function POST(req: NextRequest) {
  const { email, code } = await req.json().catch(() => ({}) as { email?: string; code?: string });
  if (!email || !code) return err("Informe e-mail e código");
  // Anti brute-force por IP (complementa o limite de tentativas do proprio OTP).
  if (!rateLimit(`otp-vrf-ip:${clientIp(req.headers)}`, 15, 60_000)) {
    return err("Muitas tentativas. Aguarde um minuto e tente novamente.", 429);
  }
  if (!(await verifyOtp(email, code))) return err("Código inválido ou expirado", 401);
  const customer = await getRepo().getCustomerByEmail(email);
  // So emite sessao para cliente existente. Mesma mensagem do OTP invalido para nao
  // revelar quais e-mails sao clientes. Evita conta-fantasma (sub = e-mail) que
  // abria IDOR cross-tenant e quebrava FKs.
  if (!customer) return err("Código inválido ou expirado", 401);
  await createSession({ sub: customer.id, role: "customer", email });
  return ok({ ok: true });
}
