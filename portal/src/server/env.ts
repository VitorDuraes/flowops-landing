import "server-only";

// Leitura central de variaveis de ambiente do servidor. Tudo tem fallback de
// desenvolvimento para o app rodar sem nenhuma credencial (modo mock).
function get(key: string): string {
  return process.env[key] || "";
}

// Defaults de DESENVOLVIMENTO. Sao publicos (estao no repo), entao NUNCA podem
// valer em producao: assertProdEnv() aborta o boot se algum deles vazar para prod.
const DEV_SESSION_SECRET = "dev-insecure-session-secret-troque-em-producao-min-32";
const DEV_ADMIN_PASSWORD = "waveops-admin";
const DEV_CRON_SECRET = "dev-cron-secret";

export const env = {
  // banco
  databaseUrl: get("DATABASE_URL"),

  // sessao / auth
  sessionSecret: get("SESSION_SECRET") || DEV_SESSION_SECRET,
  // Em producao SEMPRE exige login (ignora AUTH_ENFORCED=false herdado de dev).
  authEnforced: process.env.NODE_ENV === "production" ? true : (get("AUTH_ENFORCED") || "true") !== "false",
  adminEmail: get("ADMIN_EMAIL") || "financeiro@waveops.com.br",
  adminPassword: get("ADMIN_PASSWORD") || DEV_ADMIN_PASSWORD,
  // Cliente usado nas areas logadas quando AUTH_ENFORCED=false (demo sem login).
  demoCustomerEmail: get("DEMO_CUSTOMER_EMAIL") || "joao@jsconsultoria.com.br",

  // gateway de pagamento: mock | mercadopago | asaas
  paymentGateway: (get("PAYMENT_GATEWAY") || "mock") as "mock" | "mercadopago" | "asaas",
  appUrl: get("APP_URL") || get("NEXT_PUBLIC_APP_URL") || "http://localhost:3000",

  mercadopago: {
    accessToken: get("MERCADOPAGO_ACCESS_TOKEN"),
    webhookSecret: get("MERCADOPAGO_WEBHOOK_SECRET"),
    // Forca o checkout sandbox mesmo com token APP_USR- (conta de teste do MP
    // gera token sem prefixo TEST-). Default detecta pelo prefixo TEST-.
    sandbox: get("MERCADOPAGO_SANDBOX") === "true",
  },
  asaas: {
    apiKey: get("ASAAS_API_KEY"),
    baseUrl: get("ASAAS_BASE_URL") || "https://api.asaas.com/v3",
    webhookToken: get("ASAAS_WEBHOOK_TOKEN"),
  },

  // integracoes
  resendKey: get("RESEND_API_KEY"),
  emailFrom: get("EMAIL_FROM") || "WaveOps <nao-responder@waveops.com.br>",
  // Para onde vai o alerta interno de "novo cliente pagou" (o time fala no WhatsApp).
  teamNotifyEmail: get("TEAM_NOTIFY_EMAIL") || get("ADMIN_EMAIL") || "financeiro@waveops.com.br",
  discordWebhook: get("DISCORD_WEBHOOK_URL"),
  // WaveOps CRM = Twenty (sincronizacao one-way portal -> Twenty). Sem token = modo log.
  // Substitui o Trello: empresas, contatos, pipeline (oportunidades), chamados, etc.
  twenty: {
    apiUrl: (get("TWENTY_API_URL") || "http://localhost:3009").replace(/\/+$/, ""),
    token: get("TWENTY_API_TOKEN"),
    // Estagio do pipeline em que a oportunidade nasce no pagamento (SELECT do Twenty).
    opportunityStage: get("TWENTY_OPPORTUNITY_STAGE") || "NEW",
  },

  // jobs
  cronSecret: get("CRON_SECRET") || DEV_CRON_SECRET,

  get isProd() {
    return process.env.NODE_ENV === "production";
  },
  hasDb(): boolean {
    return !!this.databaseUrl;
  },
};

// Fail-fast: em producao, segredos ausentes ou iguais ao default sao falha grave
// (forja de sessao admin, login admin com senha publica, dunning aberto). Aborta o
// boot com mensagem clara em vez de subir um app inseguro silenciosamente.
function assertProdEnv(): void {
  if (process.env.NODE_ENV !== "production") return;
  // O `next build` roda em NODE_ENV=production, mas os segredos de runtime ainda nao
  // estao presentes nessa fase. So validamos em runtime real (server/request), nao no build.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const problems: string[] = [];
  if (!env.sessionSecret || env.sessionSecret === DEV_SESSION_SECRET || env.sessionSecret.length < 32) {
    problems.push("SESSION_SECRET ausente, igual ao padrao ou com menos de 32 caracteres");
  }
  if (!get("ADMIN_PASSWORD") || env.adminPassword === DEV_ADMIN_PASSWORD) {
    problems.push("ADMIN_PASSWORD ausente ou igual ao padrao");
  }
  if (!get("CRON_SECRET") || env.cronSecret === DEV_CRON_SECRET) {
    problems.push("CRON_SECRET ausente ou igual ao padrao");
  }
  if (env.paymentGateway === "mercadopago" && !env.mercadopago.webhookSecret) {
    problems.push("MERCADOPAGO_WEBHOOK_SECRET ausente (webhooks serao rejeitados em producao)");
  }
  if (problems.length) {
    throw new Error("[env] Configuracao insegura em producao:\n- " + problems.join("\n- "));
  }
}
assertProdEnv();
