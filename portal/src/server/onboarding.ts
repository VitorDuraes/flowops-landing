import "server-only";
import { getRepo } from "./repo";
import { notifyDiscord, sendEmail, notifyTeamNewCustomer } from "./integrations";
import { env } from "./env";
import { log } from "./log";

export interface AppliedPayment {
  applied: boolean;
  invoiceId?: string;
  customerId?: string;
}

// Efeitos colaterais de um pagamento aplicado: aviso no Discord, e-mail de ativacao
// (so no 1o pagamento, quando o cliente ainda nao tem senha) e alerta do time para o
// onboarding manual por WhatsApp. Chamado pelo WEBHOOK e pelo job de RECONCILIACAO,
// por isso e idempotente: getActivationTarget devolve null depois que a senha existe,
// entao reprocessar o mesmo pagamento nao reenvia e-mail nem realerta o time.
export async function onPaymentApplied(result: AppliedPayment, source: "webhook" | "reconcile"): Promise<void> {
  if (!(result.applied && result.invoiceId)) return;
  await notifyDiscord(`Pagamento confirmado (${source}) · fatura ${result.invoiceId} quitada e cliente reativado.`);
  if (!result.customerId) return;

  const target = await getRepo().getActivationTarget(result.customerId);
  if (!target) return; // ja ativou (tem senha): nada a fazer

  // Fluxo: cliente acessa a ativacao, informa o e-mail, recebe o codigo e cria a senha.
  const link = new URL("/cliente/ativar", env.appUrl).toString();
  await sendEmail(
    target.email,
    "Pagamento confirmado · ative sua conta WaveOps",
    `Recebemos seu pagamento. Crie sua senha de acesso em: ${link}`
  );
  log.info("ativacao.email_enviado", { customerId: result.customerId, email: target.email, source });

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
    log.info("onboarding.time_notificado", { customerId: result.customerId, source });
  }
}
