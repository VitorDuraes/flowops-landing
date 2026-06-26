import { NextRequest } from "next/server";
import { ok, err } from "@/server/http";
import { env } from "@/server/env";
import { runReconcile } from "@/server/jobs";

// Reconciliacao do gateway: rede de seguranca quando o webhook nao chega (banco
// pausado, app dormindo, 5xx). Busca pagamentos aprovados recentes e aplica os que
// faltam. Idempotente. Proteja com CRON_SECRET (header Bearer ou ?secret=).
function authorized(req: NextRequest): boolean {
  const header = req.headers.get("authorization") || "";
  const bearer = header.replace(/^Bearer\s+/i, "");
  const query = new URL(req.url).searchParams.get("secret") || "";
  return (bearer || query) === env.cronSecret;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return err("Não autorizado", 401);
  return ok(await runReconcile());
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return err("Não autorizado", 401);
  return ok(await runReconcile());
}
