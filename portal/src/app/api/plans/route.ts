import { getRepo } from "@/server/repo";
import { ok } from "@/server/http";

export async function GET() {
  return ok(await getRepo().listPlans());
}
