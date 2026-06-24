import { NextResponse } from "next/server";
import { guard, ok, err } from "@/server/http";
import { getRepo } from "@/server/repo";
import { sendEmail } from "@/server/integrations";
import { env } from "@/server/env";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await guard(["admin"]);
  if (u instanceof NextResponse) return u;
  const { id } = await params;

  const inv = await getRepo().getInvoiceWithCustomer(id);
  if (!inv) return err("Fatura não encontrada", 404);

  const link = inv.paymentLink || new URL("/cliente/faturas", env.appUrl).toString();
  const subject = "WaveOps · link de pagamento da sua fatura";
  const html = `Olá, ${inv.companyName}. Aqui está o link para pagar a fatura ${inv.id}: ${link}`;
  // Em modo sem credencial o envio degrada para log; com RESEND_API_KEY vai por e-mail.
  await sendEmail(inv.email, subject, html);

  return ok({ ok: true, invoice: id, sentTo: inv.email });
}
