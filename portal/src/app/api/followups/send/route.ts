import { NextResponse } from "next/server";
import { guard, ok } from "@/server/http";
import { runDunning } from "@/server/jobs";

// Dispara a regua manualmente pelo painel admin.
export async function POST() {
  const u = await guard(["admin"]);
  if (u instanceof NextResponse) return u;
  return ok(await runDunning());
}
