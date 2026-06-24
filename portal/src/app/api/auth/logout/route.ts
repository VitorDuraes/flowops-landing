import { clearSession } from "@/server/auth";
import { ok } from "@/server/http";

export async function POST() {
  await clearSession();
  return ok({ ok: true });
}
