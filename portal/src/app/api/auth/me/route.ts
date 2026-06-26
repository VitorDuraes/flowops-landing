import { readSession } from "@/server/auth";
import { ok } from "@/server/http";

export async function GET() {
  return ok({ user: await readSession() });
}
