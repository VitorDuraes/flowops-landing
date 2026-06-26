import { NextResponse } from "next/server";
import { guard, ok } from "@/server/http";
import { getRepo } from "@/server/repo";

export async function GET() {
  const u = await guard(["admin"]);
  if (u instanceof NextResponse) return u;
  return ok(await getRepo().getMetrics());
}
