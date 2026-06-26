import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { createSession } from "@/server/auth";
import { env } from "@/server/env";
import { ok, err } from "@/server/http";
import { rateLimit, clientIp } from "@/server/ratelimit";

// Comparacao em tempo constante (evita timing attack na senha do admin).
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  // Anti brute-force: 5 tentativas por IP por minuto (a conta de maior privilegio).
  if (!rateLimit(`admin-login-ip:${clientIp(req.headers)}`, 5, 60_000)) {
    return err("Muitas tentativas. Aguarde um minuto e tente novamente.", 429);
  }
  const { email, password } = await req.json().catch(() => ({}) as { email?: string; password?: string });
  const emailOk = typeof email === "string" && safeEqual(email.toLowerCase(), env.adminEmail.toLowerCase());
  const passOk = typeof password === "string" && safeEqual(password, env.adminPassword);
  if (!emailOk || !passOk) {
    return err("Credenciais inválidas", 401);
  }
  await createSession({ sub: "admin", role: "admin", email: env.adminEmail });
  return ok({ ok: true });
}
