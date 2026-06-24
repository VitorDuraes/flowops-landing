import "server-only";
import { env } from "./env";

// =============================================================================
// Adapter do Twenty CRM (sincronizacao one-way: portal -> Twenty).
// -----------------------------------------------------------------------------
// Espelha eventos do WaveOps Portal (pos-venda) no Twenty self-host. Igual aos
// outros adapters (Discord, Trello, Resend): server-only, degrada para log
// quando nao ha credencial e NUNCA quebra o fluxo principal. Uma falha aqui nao
// pode derrubar o checkout nem a abertura de chamado: tudo e try/catch + log.
//
// Os nomes de objeto/campo/relacao e o shape da API REST foram confirmados no
// OpenAPI do Twenty (/rest/open-api/core) e no modelo seedado em
// poc/model/seed-waveops-model.mjs. Resumo do que foi comprovado:
//   - Colecoes REST: /rest/companies, /rest/people, /rest/chamados,
//     /rest/assinaturas, /rest/faturas, /rest/followups.
//   - FK de relacao MANY_TO_ONE: empresaId (-> Company), planoId (-> plano),
//     assinaturaId (-> assinatura), faturaId (-> fatura). Person usa companyId.
//   - Criar registro: POST /rest/<colecao> devolve { data: { create<Singular>: { id } } }.
//   - Listar/filtrar: GET /rest/<colecao>?filter=campo[eq]:"valor" devolve
//     { data: { <colecao>: [...] }, totalCount }.
//   - CURRENCY: objeto { amountMicros, currencyCode }. amountMicros = centavos
//     * 10000 (o portal guarda centavos).
//   - SELECT: value ASCII MAIUSCULO (ex: pix -> PIX, aberto -> ABERTO).
//   - DATE_TIME: string ISO 8601.
// =============================================================================

// -----------------------------------------------------------------------------
// Config e helper HTTP. Bearer token. Timeout via AbortController. Nunca lanca:
// retorna { ok, status, body } e quem chama decide. Nao loga o token.
// -----------------------------------------------------------------------------
const TIMEOUT_MS = 8000;

function isEnabled(): boolean {
  return !!env.twenty.token;
}

async function api(
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const url = `${env.twenty.apiUrl}/rest${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${env.twenty.token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    let parsed: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { raw: text };
      }
    }
    return { ok: res.ok, status: res.status, body: parsed };
  } catch (e) {
    return { ok: false, status: 0, body: { error: (e as Error).message } };
  } finally {
    clearTimeout(timer);
  }
}

// Extrai o id do registro criado: { data: { create<Singular>: { id } } } ou
// variacoes ({ data: { record } } / { id }). Tolerante.
function extractCreatedId(body: unknown, singular: string): string | null {
  const data = (body as { data?: Record<string, unknown> })?.data ?? body;
  if (!data || typeof data !== "object") return null;
  const cap = singular.charAt(0).toUpperCase() + singular.slice(1);
  const rec =
    (data as Record<string, unknown>)[`create${cap}`] ??
    (data as Record<string, unknown>)[singular] ??
    (data as Record<string, unknown>).record ??
    data;
  const id = (rec as { id?: unknown })?.id;
  return typeof id === "string" ? id : null;
}

// Extrai o primeiro registro de uma listagem: { data: { <colecao>: [...] } }.
function extractFirst(body: unknown, collection: string): { id: string } | null {
  const data = (body as { data?: Record<string, unknown> })?.data;
  const list = data?.[collection];
  if (Array.isArray(list) && list.length > 0) {
    const id = (list[0] as { id?: unknown })?.id;
    if (typeof id === "string") return { id };
  }
  return null;
}

// Monta o valor de filtro REST: campo[eq]:"valor" (string sempre entre aspas).
function eqFilter(field: string, value: string): string {
  return `${field}[eq]:${JSON.stringify(value)}`;
}

// -----------------------------------------------------------------------------
// Mapeadores de enum: portal (lowercase/snake) -> Twenty (ASCII MAIUSCULO).
// Um lugar so. Default seguro quando o valor nao bate (evita 400 no Twenty).
// -----------------------------------------------------------------------------
const STATUS_CLIENTE: Record<string, string> = {
  lead: "LEAD",
  aguardando: "AGUARDANDO",
  ativo: "ATIVO",
  pendente: "PENDENTE",
  vencido: "VENCIDO",
  pausado: "PAUSADO",
  cancelado: "CANCELADO",
};

const STATUS_ASSINATURA: Record<string, string> = {
  ativo: "ATIVO",
  pendente: "PENDENTE",
  vencido: "VENCIDO",
  pausado: "PAUSADO",
  cancelado: "CANCELADO",
};

const STATUS_FATURA: Record<string, string> = {
  criada: "CRIADA",
  em_aberto: "EM_ABERTO",
  paga: "PAGA",
  vencida: "VENCIDA",
  cancelada: "CANCELADA",
  estornada: "ESTORNADA",
  reembolsada: "REEMBOLSADA",
};

const FORMA_PAGAMENTO: Record<string, string> = {
  pix: "PIX",
  cartao: "CARTAO",
  boleto: "BOLETO",
};

const PRIORIDADE: Record<string, string> = {
  baixa: "BAIXA",
  media: "MEDIA",
  alta: "ALTA",
};

const STATUS_CHAMADO: Record<string, string> = {
  aberto: "ABERTO",
  em_andamento: "EM_ANDAMENTO",
  resolvido: "RESOLVIDO",
  fechado: "FECHADO",
};

const FOLLOWUP_TIPO: Record<string, string> = {
  before_7_days: "BEFORE_7_DAYS",
  before_3_days: "BEFORE_3_DAYS",
  due_today: "DUE_TODAY",
  overdue_1_day: "OVERDUE_1_DAY",
  overdue_3_days: "OVERDUE_3_DAYS",
  overdue_7_days: "OVERDUE_7_DAYS",
};

const FOLLOWUP_CANAL: Record<string, string> = {
  whatsapp: "WHATSAPP",
  email: "EMAIL",
  discord: "DISCORD",
};

const FOLLOWUP_STATUS: Record<string, string> = {
  agendado: "AGENDADO",
  enviado: "ENVIADO",
  falhou: "FALHOU",
};

// Normaliza para casar com as chaves dos mapas (snake_case minusculo, sem acento
// e sem hifen: a UI as vezes usa "em-andamento" no lugar de "em_andamento").
function norm(v: string | null | undefined): string {
  return (v || "").toString().trim().toLowerCase().replace(/-/g, "_");
}

function mapEnum(map: Record<string, string>, value: string | null | undefined): string | undefined {
  return map[norm(value)];
}

// CURRENCY do Twenty a partir de centavos do portal.
function currency(centavos: number | null | undefined): { amountMicros: number; currencyCode: string } | undefined {
  if (centavos == null) return undefined;
  return { amountMicros: Math.round(centavos) * 10000, currencyCode: "BRL" };
}

// DATE_TIME ISO. Aceita Date ou string; descarta invalido.
function iso(d: Date | string | null | undefined): string | undefined {
  if (!d) return undefined;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// Documento (CNPJ/CPF) em forma canonica: so digitos. Invariante de unicidade
// (regra WaveOps): grava e busca sempre normalizado, para formatacao diferente
// ("12.345.678/0001-90" vs "12345678000190") nunca gerar Empresa duplicada.
function normalizeDoc(doc: string | null | undefined): string | undefined {
  if (!doc) return undefined;
  const digits = doc.replace(/\D/g, "");
  return digits.length ? digits : undefined;
}

// Remove chaves undefined do payload (o Twenty rejeita alguns null e nao precisa
// receber campo vazio).
function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

// Log padronizado do adapter. Sem PII crua: identifica por id/ref interno.
function logMock(action: string, ref: string): void {
  console.log(`[twenty:mock] ${action} ${ref} (sem TWENTY_API_TOKEN: apenas log)`);
}
function logErr(action: string, status: number, body: unknown): void {
  console.error(`[twenty] ${action} falhou (HTTP ${status})`, typeof body === "string" ? body : JSON.stringify(body));
}

// =============================================================================
// Tipos de entrada do adapter. Plain objects, desacoplados do Prisma, para
// manter o typecheck limpo e a fronteira clara. Quem chama monta a partir da
// row do Prisma (campos com mesmo nome) ou do DTO de UI.
// =============================================================================
export interface EmpresaInput {
  companyName: string;
  document?: string | null;
  planLabel?: string | null;
  monthlyAmountCents?: number | null;
  paymentMethod?: string | null; // pix | cartao | boleto
  gatewayCustomerId?: string | null;
  status?: string | null; // CustomerStatus do portal (lead, ativo, ...)
  nextDueDate?: Date | string | null;
  lastPaymentDate?: Date | string | null;
}

export interface PessoaInput {
  name?: string | null; // nome da pessoa de contato
  email?: string | null;
  phone?: string | null;
  document?: string | null;
}

export interface ChamadoInput {
  title: string;
  description?: string | null;
  priority?: string | null; // baixa | media | alta
  status?: string | null; // aberto | em_andamento | resolvido | fechado
  trelloCardId?: string | null;
}

export interface BriefingInput {
  goal: string; // objetivo (o que automatizar)
  currentTool?: string | null;
  pain?: string | null;
  volume?: string | null;
  companyName?: string | null; // usado no label "Briefing: <empresa>"
  trelloCardId?: string | null;
}

export interface AssinaturaInput {
  status?: string | null; // ativo | pendente | ...
  startDate?: Date | string | null;
  nextDueDate?: Date | string | null;
  canceledAt?: Date | string | null;
  pausedAt?: Date | string | null;
  gatewaySubscriptionId?: string | null;
}

export interface FaturaInput {
  amountCents?: number | null;
  dueDate?: Date | string | null;
  paidAt?: Date | string | null;
  status?: string | null; // criada | em_aberto | paga | ...
  paymentMethod?: string | null;
  paymentLink?: string | null;
  gatewayPaymentId?: string | null;
}

export interface FollowupInput {
  type?: string | null; // before_7_days | ...
  channel?: string | null; // whatsapp | email | discord
  message?: string | null;
  status?: string | null; // agendado | enviado | falhou
  sentAt?: Date | string | null;
  errorMessage?: string | null;
}

// =============================================================================
// upsertEmpresa: procura a Company por gatewayCustomerId; se nao houver, por
// documento; ultimo recurso, cria. Mapeia Customer -> Company. Idempotente por
// id externo. Retorna o id da Company ou null (sem token / erro).
// =============================================================================
export async function upsertEmpresa(input: EmpresaInput): Promise<string | null> {
  if (!isEnabled()) {
    logMock("upsertEmpresa", input.companyName);
    return null;
  }

  const docNorm = normalizeDoc(input.document);
  const fields = clean({
    name: input.companyName,
    documento: docNorm,
    planoAtual: input.planLabel ?? undefined,
    valorMensal: currency(input.monthlyAmountCents),
    formaDePagamento: mapEnum(FORMA_PAGAMENTO, input.paymentMethod),
    statusDoCliente: mapEnum(STATUS_CLIENTE, input.status),
    gatewayCustomerId: input.gatewayCustomerId ?? undefined,
    proximoVencimento: iso(input.nextDueDate),
    ultimoPagamento: iso(input.lastPaymentDate),
  });

  try {
    // 1. Procura por gatewayCustomerId (chave externa mais forte).
    let existingId: string | null = null;
    if (input.gatewayCustomerId) {
      const r = await api("GET", `/companies?filter=${encodeURIComponent(eqFilter("gatewayCustomerId", input.gatewayCustomerId))}&limit=1`);
      if (r.ok) existingId = extractFirst(r.body, "companies")?.id ?? null;
    }
    // 2. Fallback: procura por documento normalizado (so digitos).
    if (!existingId && docNorm) {
      const r = await api("GET", `/companies?filter=${encodeURIComponent(eqFilter("documento", docNorm))}&limit=1`);
      if (r.ok) existingId = extractFirst(r.body, "companies")?.id ?? null;
    }

    if (existingId) {
      const r = await api("PATCH", `/companies/${existingId}`, fields);
      if (!r.ok) logErr("upsertEmpresa(patch)", r.status, r.body);
      return existingId;
    }

    const r = await api("POST", "/companies", fields);
    if (!r.ok) {
      logErr("upsertEmpresa(create)", r.status, r.body);
      return null;
    }
    return extractCreatedId(r.body, "company");
  } catch (e) {
    console.error("[twenty] upsertEmpresa erro", (e as Error).message);
    return null;
  }
}

// =============================================================================
// upsertPessoa: cria/atualiza a Person (contato) ligada a Company. Casa por
// e-mail dentro da empresa; se nao houver, cria. Best-effort.
// =============================================================================
export async function upsertPessoa(input: PessoaInput, empresaId: string): Promise<string | null> {
  if (!isEnabled()) {
    logMock("upsertPessoa", empresaId);
    return null;
  }

  const parts = (input.name || "").trim().split(/\s+/);
  const firstName = parts.shift() || (input.email || "Contato");
  const lastName = parts.join(" ");

  const fields = clean({
    name: clean({ firstName, lastName: lastName || undefined }),
    emails: input.email ? { primaryEmail: input.email } : undefined,
    phones: input.phone ? { primaryPhoneNumber: input.phone } : undefined,
    documento: input.document ?? undefined,
    companyId: empresaId,
  });

  try {
    let existingId: string | null = null;
    if (input.email) {
      const r = await api(
        "GET",
        `/people?filter=${encodeURIComponent(eqFilter("emails.primaryEmail", input.email))}&limit=1`
      );
      if (r.ok) existingId = extractFirst(r.body, "people")?.id ?? null;
    }

    if (existingId) {
      const r = await api("PATCH", `/people/${existingId}`, fields);
      if (!r.ok) logErr("upsertPessoa(patch)", r.status, r.body);
      return existingId;
    }

    const r = await api("POST", "/people", fields);
    if (!r.ok) {
      logErr("upsertPessoa(create)", r.status, r.body);
      return null;
    }
    return extractCreatedId(r.body, "person");
  } catch (e) {
    console.error("[twenty] upsertPessoa erro", (e as Error).message);
    return null;
  }
}

// =============================================================================
// createChamado: cria o registro chamado ligado a empresa (empresaId). Este e o
// caso central. titulo = name (label-field nativo).
// =============================================================================
export async function createChamado(input: ChamadoInput, empresaId: string): Promise<string | null> {
  if (!isEnabled()) {
    logMock("createChamado", input.title);
    return null;
  }

  const fields = clean({
    name: input.title,
    descricao: input.description ?? undefined,
    prioridade: mapEnum(PRIORIDADE, input.priority) ?? "MEDIA",
    status: mapEnum(STATUS_CHAMADO, input.status) ?? "ABERTO",
    trelloCardId: input.trelloCardId ?? undefined,
    empresaId,
  });

  try {
    const r = await api("POST", "/chamados", fields);
    if (!r.ok) {
      logErr("createChamado", r.status, r.body);
      return null;
    }
    return extractCreatedId(r.body, "chamado");
  } catch (e) {
    console.error("[twenty] createChamado erro", (e as Error).message);
    return null;
  }
}

// =============================================================================
// createBriefing: ProjectBrief -> objeto Briefing no Twenty, ligado a empresa.
// O briefing do projeto tem casa propria no modelo (nao vira chamado).
// =============================================================================
export async function createBriefing(input: BriefingInput, empresaId: string): Promise<string | null> {
  if (!isEnabled()) {
    logMock("createBriefing", input.companyName || input.goal);
    return null;
  }

  const fields = clean({
    name: input.companyName ? `Briefing: ${input.companyName}` : "Briefing",
    objetivo: input.goal,
    ferramentaAtual: input.currentTool ?? undefined,
    dor: input.pain ?? undefined,
    volume: input.volume ?? undefined,
    trelloCardId: input.trelloCardId ?? undefined,
    empresaId,
  });

  try {
    const r = await api("POST", "/briefings", fields);
    if (!r.ok) {
      logErr("createBriefing", r.status, r.body);
      return null;
    }
    return extractCreatedId(r.body, "briefing");
  } catch (e) {
    console.error("[twenty] createBriefing erro", (e as Error).message);
    return null;
  }
}

// =============================================================================
// createAssinatura: Subscription -> assinatura, ligada a empresa e (opcional) ao
// plano (planoId).
// =============================================================================
export async function createAssinatura(
  input: AssinaturaInput,
  empresaId: string,
  planoId?: string | null
): Promise<string | null> {
  if (!isEnabled()) {
    logMock("createAssinatura", empresaId);
    return null;
  }

  const fields = clean({
    status: mapEnum(STATUS_ASSINATURA, input.status),
    dataDeInicio: iso(input.startDate),
    proximoVencimento: iso(input.nextDueDate),
    canceladaEm: iso(input.canceledAt),
    pausadaEm: iso(input.pausedAt),
    gatewaySubscriptionId: input.gatewaySubscriptionId ?? undefined,
    empresaId,
    planoId: planoId ?? undefined,
  });

  try {
    const r = await api("POST", "/assinaturas", fields);
    if (!r.ok) {
      logErr("createAssinatura", r.status, r.body);
      return null;
    }
    return extractCreatedId(r.body, "assinatura");
  } catch (e) {
    console.error("[twenty] createAssinatura erro", (e as Error).message);
    return null;
  }
}

// =============================================================================
// createFatura: Invoice -> fatura, ligada a empresa e (opcional) a assinatura.
// =============================================================================
export async function createFatura(
  input: FaturaInput,
  empresaId: string,
  assinaturaId?: string | null
): Promise<string | null> {
  if (!isEnabled()) {
    logMock("createFatura", empresaId);
    return null;
  }

  const fields = clean({
    valor: currency(input.amountCents),
    vencimento: iso(input.dueDate),
    pagoEm: iso(input.paidAt),
    status: mapEnum(STATUS_FATURA, input.status),
    formaDePagamento: mapEnum(FORMA_PAGAMENTO, input.paymentMethod),
    linkDePagamento: input.paymentLink ?? undefined,
    gatewayPaymentId: input.gatewayPaymentId ?? undefined,
    empresaId,
    assinaturaId: assinaturaId ?? undefined,
  });

  try {
    const r = await api("POST", "/faturas", fields);
    if (!r.ok) {
      logErr("createFatura", r.status, r.body);
      return null;
    }
    return extractCreatedId(r.body, "fatura");
  } catch (e) {
    console.error("[twenty] createFatura erro", (e as Error).message);
    return null;
  }
}

// =============================================================================
// createFollowup: Followup -> followup, ligado a empresa e (opcional) a fatura.
// =============================================================================
export async function createFollowup(
  input: FollowupInput,
  empresaId: string,
  faturaId?: string | null
): Promise<string | null> {
  if (!isEnabled()) {
    logMock("createFollowup", empresaId);
    return null;
  }

  const fields = clean({
    tipo: mapEnum(FOLLOWUP_TIPO, input.type),
    canal: mapEnum(FOLLOWUP_CANAL, input.channel),
    mensagem: input.message ?? undefined,
    status: mapEnum(FOLLOWUP_STATUS, input.status),
    enviadoEm: iso(input.sentAt),
    erro: input.errorMessage ?? undefined,
    empresaId,
    faturaId: faturaId ?? undefined,
  });

  try {
    const r = await api("POST", "/followups", fields);
    if (!r.ok) {
      logErr("createFollowup", r.status, r.body);
      return null;
    }
    return extractCreatedId(r.body, "followup");
  } catch (e) {
    console.error("[twenty] createFollowup erro", (e as Error).message);
    return null;
  }
}

// =============================================================================
// createOportunidade: cria a Oportunidade (pipeline/deal) no Twenty quando o
// cliente escolhe um plano e PAGA. Objeto nativo do Twenty (/rest/opportunities):
// name (label), amount (CURRENCY), closeDate, stage (SELECT) e relacoes
// companyId / pointOfContactId. O stage default vem do env (TWENTY_OPPORTUNITY_STAGE,
// padrao "NEW" = primeiro estagio do pipeline padrao do Twenty). Best-effort.
// =============================================================================
export interface OportunidadeInput {
  name: string; // ex.: "JS Consultoria · Pro"
  amountCents?: number | null;
  closeDate?: Date | string | null;
  stage?: string | null; // NEW | SCREENING | MEETING | PROPOSAL | CUSTOMER (default env)
}

export async function createOportunidade(
  input: OportunidadeInput,
  empresaId: string,
  pessoaId?: string | null
): Promise<string | null> {
  if (!isEnabled()) {
    logMock("createOportunidade", input.name);
    return null;
  }

  const fields = clean({
    name: input.name,
    amount: currency(input.amountCents),
    closeDate: iso(input.closeDate),
    stage: (input.stage || env.twenty.opportunityStage || "NEW").toUpperCase(),
    companyId: empresaId,
    pointOfContactId: pessoaId ?? undefined,
  });

  try {
    const r = await api("POST", "/opportunities", fields);
    if (!r.ok) {
      logErr("createOportunidade", r.status, r.body);
      return null;
    }
    return extractCreatedId(r.body, "opportunity");
  } catch (e) {
    console.error("[twenty] createOportunidade erro", (e as Error).message);
    return null;
  }
}

// =============================================================================
// updateEmpresaStatus: atualiza apenas o statusDoCliente da Company (best-effort).
// Localiza a empresa por gatewayCustomerId. Usado quando o status do cliente muda
// no portal.
// =============================================================================
export async function updateEmpresaStatus(gatewayCustomerId: string | null | undefined, status: string): Promise<void> {
  if (!isEnabled()) {
    logMock("updateEmpresaStatus", gatewayCustomerId || status);
    return;
  }
  const mapped = mapEnum(STATUS_CLIENTE, status);
  if (!mapped || !gatewayCustomerId) return;
  try {
    const r = await api(
      "GET",
      `/companies?filter=${encodeURIComponent(eqFilter("gatewayCustomerId", gatewayCustomerId))}&limit=1`
    );
    if (!r.ok) {
      logErr("updateEmpresaStatus(find)", r.status, r.body);
      return;
    }
    const found = extractFirst(r.body, "companies");
    if (!found) return;
    const p = await api("PATCH", `/companies/${found.id}`, { statusDoCliente: mapped });
    if (!p.ok) logErr("updateEmpresaStatus(patch)", p.status, p.body);
  } catch (e) {
    console.error("[twenty] updateEmpresaStatus erro", (e as Error).message);
  }
}

// =============================================================================
// fireAndForget: dispara uma sincronizacao em background sem bloquear nem deixar
// a falha vazar para o fluxo principal (checkout, ticket). Loga erro e segue.
// =============================================================================
export function fireAndForget(label: string, promise: Promise<unknown>): void {
  promise.catch((e) => {
    console.error(`[twenty] ${label} (background) erro`, (e as Error)?.message || e);
  });
}
