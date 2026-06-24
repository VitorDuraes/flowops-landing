import { NextRequest } from "next/server";
import { ok, err } from "@/server/http";
import { env } from "@/server/env";
import { runDunning } from "@/server/jobs";

// Job diario da regua de cobranca. Proteja com CRON_SECRET (header Bearer ou ?secret=).
function authorized(req: NextRequest): boolean {
  const header = req.headers.get("authorization") || "";
  const bearer = header.replace(/^Bearer\s+/i, "");
  const query = new URL(req.url).searchParams.get("secret") || "";
  return (bearer || query) === env.cronSecret;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return err("Não autorizado", 401);
  return ok(await runDunning());
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return err("Não autorizado", 401);
  return ok(await runDunning());
}
