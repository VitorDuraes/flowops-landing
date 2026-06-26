import { NextRequest } from "next/server";
import { ok, err } from "@/server/http";
import { getRepo } from "@/server/repo";
import { getGateway } from "@/server/payments";
import { notifyDiscord } from "@/server/integrations";
import { log } from "@/server/log";

// Publica: inicia a assinatura no gateway e devolve a URL de pagamento.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}) as Record<string, string>);
  const { planId, name, company, email, phone, document, method } = body;
  if (!email || !name) return err("Nome e e-mail são obrigatórios");

  const plans = await getRepo().listPlans();
  const plan = plans.find((p) => p.id === planId) || plans[0];
  const gateway = getGateway();

  // A UI usa "card"; o gateway e o enum do banco usam "cartao". Normaliza aqui.
  const methodMap: Record<string, "pix" | "cartao" | "boleto"> = {
    pix: "pix",
    card: "cartao",
    cartao: "cartao",
    boleto: "boleto",
  };
  const pay = methodMap[String(method || "").toLowerCase()] || "pix";
  try {
    const result = await gateway.createSubscription({
      customer: { name, email, phone, document },
      planId: plan.id,
      planName: plan.name,
      amount: plan.monthly,
      method: pay,
    });
    // Persiste cliente (aguardando) + assinatura (pendente) + primeira fatura
    // (em aberto). Em modo mock e no-op; no Postgres, e o que o webhook confirma.
    await getRepo().recordCheckout({
      name,
      company,
      email,
      phone,
      document,
      planId: plan.id,
      method: pay,
      provider: result.provider,
      gatewayCustomerId: result.gatewayCustomerId,
      gatewaySubscriptionId: result.gatewaySubscriptionId,
    });
    log.info("checkout.iniciado", {
      ref: result.gatewaySubscriptionId,
      plano: plan.id,
      metodo: pay,
      provider: result.provider,
      email,
    });
    await notifyDiscord(`Nova assinatura iniciada: ${company || name} · Plano ${plan.name} · via ${result.provider}`);
    return ok({ checkoutUrl: result.checkoutUrl, provider: result.provider });
  } catch (e) {
    log.error("checkout.falhou", { plano: plan.id, metodo: pay, erro: (e as Error).message });
    return err((e as Error).message || "Falha ao iniciar o pagamento", 502);
  }
}
