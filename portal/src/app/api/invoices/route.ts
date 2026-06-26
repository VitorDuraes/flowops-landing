import { NextResponse } from "next/server";
import { guard, ok } from "@/server/http";
import { getRepo } from "@/server/repo";

export async function GET() {
  const u = await guard(["customer", "admin"]);
  if (u instanceof NextResponse) return u;
  const repo = getRepo();
  if (u.role === "admin") return ok(await repo.listAllInvoices());
  const me = await repo.getMe(u.email);
  return ok(me ? await repo.listInvoicesForCustomer(me.id) : []);
}
