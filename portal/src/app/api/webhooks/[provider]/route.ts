import { NextRequest } from "next/server";
import { ok, err } from "@/server/http";
import { getGateway } from "@/server/payments";
import { getRepo } from "@/server/repo";
import { notifyDiscord, sendEmail, notifyTeamNewCustomer } from "@/server/integrations";
import { env } from "@/server/env";
import { log } from "@/server/log";

// Webhook do gateway: valida assinatura, normaliza o evento e registra.
// Em producao, aqui se atualiza fatura/assinatura/cliente (precisa de banco).
export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const gateway = getGateway();
  if (provider !== gateway.id) return err("Gateway não corresponde ao configurado", 400);

  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headers[k] = v;
  });
  const reqObj = { headers, rawBody, url: req.url };

  if (!(await gateway.verifyWebhook(reqObj))) return err("Assinatura inválida", 401);

  const event = await gateway.parseWebhook(reqObj);
  log.info("webhook.recebido", {
    provider: event.provider,
    kind: event.kind,
    status: event.status,
    paymentId: event.gatewayPaymentId,
    ref: event.gatewaySubscriptionId,
  });
  // Falha ao resolver o pagamento no MP (rede/5xx): responde 5xx para o MP reenviar,
  // em vez de 200 (que faria o MP parar de tentar e a fatura nunca baixar).
  if (event.unresolved) {
    log.warn("webhook.nao_resolvido", { paymentId: event.gatewayPaymentId });
    return err("Pagamento não resolvido, tente novamente", 503);
  }
  await notifyDiscord(`Webhook ${event.provider}: ${event.kind} · ${event.status}`);

  // Aplica o pagamento no banco (idempotente): marca a fatura paga e reativa o
  // cliente. So eventos de pagamento mexem em fatura; eventos de assinatura
  // ativam a assinatura. Em modo mock e no-op.
  let result: { applied: boolean; invoiceId?: string; customerId?: string } = { applied: false };
  if (event.kind === "payment" || event.kind === "subscription") {
    result = await getRepo().applyGatewayPayment({
      gatewayPaymentId: event.gatewayPaymentId,
      gatewaySubscriptionId: event.gatewaySubscriptionId,
      status: event.status,
      amountCents: event.amountCents,
    });
    if (result.applied && result.invoiceId) {
      log.info("webhook.fatura_baixada", {
        invoiceId: result.invoiceId,
        customerId: result.customerId,
        paymentId: event.gatewayPaymentId,
        ref: event.gatewaySubscriptionId,
      });
      await notifyDiscord(`Pagamento confirmado · fatura ${result.invoiceId} quitada e cliente reativado.`);
      // Onboarding: se o cliente ainda nao tem senha, envia o e-mail de ativacao
      // (link para definir a senha) ancorado no e-mail do cadastro.
      if (result.customerId) {
        const target = await getRepo().getActivationTarget(result.customerId);
        if (target) {
          // Fluxo: cliente acessa a ativacao, informa o e-mail, recebe o codigo e cria a senha.
          const link = new URL("/cliente/ativar", env.appUrl).toString();
          await sendEmail(
            target.email,
            "Pagamento confirmado · ative sua conta WaveOps",
            `Recebemos seu pagamento. Crie sua senha de acesso em: ${link}`
          );
          log.info("ativacao.email_enviado", { customerId: result.customerId, email: target.email });
          // Onboarding manual: avisa o time com os dados + link wa.me pronto para
          // abrir a conversa e ja falar do projeto (so no primeiro pagamento).
          const cust = await getRepo().getCustomerById(result.customerId);
          if (cust) {
            await notifyTeamNewCustomer({
              name: cust.name,
              company: cust.company,
              plan: cust.plan,
              amountReais: cust.amount,
              phone: cust.phone,
              email: cust.email,
            });
            log.info("onboarding.time_notificado", { customerId: result.customerId });
          }
        }
      }
    } else {
      // Nao aplicou: pode ser status nao-aprovado, reenvio idempotente ou sem match.
      log.info("webhook.nao_aplicado", {
        kind: event.kind,
        status: event.status,
        paymentId: event.gatewayPaymentId,
        ref: event.gatewaySubscriptionId,
      });
    }
  }
  return ok({ received: true, kind: event.kind, status: event.status, applied: result.applied });
}
