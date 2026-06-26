import { NextResponse } from "next/server";
import { guard, ok, err } from "@/server/http";
import { getRepo } from "@/server/repo";

export async function GET() {
  const u = await guard(["customer", "admin"]);
  if (u instanceof NextResponse) return u;
  const me = await getRepo().getMe(u.email);
  if (!me) return err("Conta não encontrada", 404);
  return ok(me);
}
