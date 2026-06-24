import { NextRequest, NextResponse } from "next/server";
import { guard, ok, err } from "@/server/http";
import { getRepo } from "@/server/repo";
import { notifyDiscord } from "@/server/integrations";
import { rateLimit, clientIp } from "@/server/ratelimit";
import { log } from "@/server/log";

// Briefing do projeto do cliente AUTENTICADO. GET devolve o briefing atual (ou null);
// POST salva/atualiza (upsert) e abre um card de projeto no Trello + alerta no Discord.
export async function GET() {
  const u = await guard(["customer"]);
  if (u instanceof NextResponse) return u;
  const brief = await getRepo().getBriefForCustomer(u.sub);
  return ok({ brief });
}

export async function POST(req: NextRequest) {
  const u = await guard(["customer"]);
  if (u instanceof NextResponse) return u;
  if (!rateLimit(`brief:${clientIp(req.headers)}`, 20, 60_000)) {
    return err("Muitas tentativas. Aguarde um minuto e tente novamente.", 429);
  }
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const goal = typeof body.goal === "string" ? body.goal.trim() : "";
  if (goal.length < 10) {
    return err("Conte com um pouco mais de detalhe o que você quer automatizar (mínimo 10 caracteres).");
  }
  const input = {
    goal: goal.slice(0, 2000),
    currentTool: str(body.currentTool),
    pain: str(body.pain),
    volume: str(body.volume),
  };

  const repo = getRepo();
  const isNew = !(await repo.getBriefForCustomer(u.sub));
  const brief = await repo.saveBrief(u.sub, input);
  log.info("briefing.salvo", { customerId: u.sub, novo: isNew });

  // Alerta interno apenas no primeiro envio (evita duplicar a cada edicao). O briefing
  // e espelhado no WaveOps CRM (Twenty) pelo repo (saveBrief), como registro Briefing.
  if (isNew) {
    const cust = await repo.getCustomerById(u.sub);
    const empresa = cust?.company || cust?.name || "Cliente";
    await notifyDiscord(`Briefing recebido · ${empresa}\nO que automatizar: ${input.goal}`);
    log.info("briefing.recebido", { customerId: u.sub });
  }

  return ok({ brief });
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim().slice(0, 1000) : "";
}
