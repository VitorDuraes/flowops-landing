import { NextRequest } from "next/server";
import { issueOtp } from "@/server/auth";
import { sendEmail } from "@/server/integrations";
import { env } from "@/server/env";
import { ok, err } from "@/server/http";
import { rateLimit, clientIp } from "@/server/ratelimit";

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}) as { email?: string });
  if (!email) return err("Informe o e-mail");
  // Anti email-bombing: 3 codigos por e-mail/min e 10 por IP/min.
  const ip = clientIp(req.headers);
  if (!rateLimit(`otp-req:${email.toLowerCase()}`, 3, 60_000) || !rateLimit(`otp-req-ip:${ip}`, 10, 60_000)) {
    return err("Muitas solicitações. Aguarde um minuto e tente novamente.", 429);
  }
  const code = await issueOtp(email);
  await sendEmail(email, "Seu código de acesso WaveOps", `Seu código é ${code}. Expira em 10 minutos.`);
  // Em desenvolvimento (sem provedor de e-mail), devolve o codigo para facilitar o teste.
  return ok({ sent: true, devCode: env.isProd ? undefined : code });
}
