# Observabilidade do WaveOps Portal

Objetivo: logs consultaveis e tracing do fluxo de pagamento (checkout -> Mercado
Pago -> webhook -> baixa da fatura), sem lock-in de fornecedor.

## Estado atual (implementado)

- **Logger estruturado**: `src/server/log.ts`. Cada linha e um JSON com `ts`,
  `level`, `msg` e campos extras. `log.debug/info/warn/error`.
- **Correlacao**: a referencia unica `wo_<uuid>` (gerada no checkout, em
  `external_reference` no Mercado Pago e gravada em `subscription.gatewaySubscriptionId`)
  aparece como campo `ref` nos logs de `checkout.iniciado`, `webhook.recebido` e
  `webhook.fatura_baixada`. Filtrar por uma `ref` reconstroi a transacao inteira.
  O `paymentId` do MP tambem e logado, ligando ao pagamento real.
- **LGPD**: `redact()` mascara e-mail, telefone e documento, e nunca loga
  token/cartao/segredo. Validar isso antes de qualquer envio externo de logs.

Eventos-chave ja instrumentados: `checkout.iniciado`, `checkout.falhou`,
`webhook.recebido`, `webhook.fatura_baixada`, `webhook.nao_aplicado`,
`mercadopago.preferencia_falhou`, `mercadopago.get_payment_falhou`.

## OpenTelemetry (a ligar no deploy)

O Next 15 tem suporte nativo via `instrumentation.ts`. Nao foi ligado ainda
porque precisa de um destino (backend) onde os traces caiam, e isso depende do
host. Quando o host estiver definido:

1. Instalar as dependencias:
   ```
   npm i @vercel/otel @opentelemetry/api
   # tracing de banco (opcional, recomendado):
   npm i @prisma/instrumentation
   ```
2. Criar `portal/instrumentation.ts`:
   ```ts
   import { registerOTel } from "@vercel/otel";
   export function register() {
     registerOTel({ serviceName: "waveops-portal" });
   }
   ```
   (O `@vercel/otel` ja auto-instrumenta `fetch`, entao as chamadas ao Mercado
   Pago aparecem como spans automaticamente. Para tracing do Prisma, habilitar a
   `previewFeatures = ["tracing"]` no schema e registrar `PrismaInstrumentation`.)
3. Variaveis de ambiente (exportador OTLP, padrao OTel):
   ```
   OTEL_EXPORTER_OTLP_ENDPOINT=<endpoint do backend>
   OTEL_EXPORTER_OTLP_HEADERS=authorization=<token>
   OTEL_SERVICE_NAME=waveops-portal
   ```

## Hospedagem + backend (decisao pendente)

O portal precisa de Node rodando continuamente (SSR + API + webhook + job de
cobranca). Hospedagem compartilhada (PHP/estatico) nao serve.

| Opcao | Esforco | Backend OTel sugerido | Custo |
|---|---|---|---|
| VPS (Hostinger VPS, Hetzner) + Docker | Medio | **SigNoz** self-hosted (OTel-nativo, traces+logs+metricas) | so o VPS |
| Railway / Render (gerenciado) | Baixo | Grafana Cloud (free) ou Axiom | free tier |
| Vercel | Minimo | `@vercel/otel` -> Grafana/Axiom | free, serverless complica Postgres/cron |

**Decisao (2026-06-21): Railway + Grafana Cloud (free).** Menos operacao de
servidor e OTel-nativo sem custo. Sem Datadog (nao e projeto Zouti). Passos de
deploy: ver `docs/deploy-railway.md`.

## Proximos passos

- [x] Definir host de producao: Railway + Grafana Cloud.
- [x] `instrumentation.ts` criado (`@vercel/otel`, registra OTel no boot e
      auto-instrumenta `fetch`). Deps adicionadas ao package.json
      (`@vercel/otel`, `@opentelemetry/api`). Falta `npm install` + deploy.
- [ ] No Railway: setar as `OTEL_*` da pagina OTLP do Grafana e fazer redeploy.
- [ ] (Opcional) Tracing do Prisma para ver latencia de query.
- [ ] (Depois) Enviar logs ao Loki do Grafana (hoje stdout via Railway log explorer).
- [ ] Alertas: `notifyDiscord` para alertas humanos; OTel/Grafana para RCA.
