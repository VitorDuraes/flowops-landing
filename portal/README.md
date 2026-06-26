# WaveOps Portal

Área do cliente e painel administrativo de assinaturas da WaveOps. App separado da landing page (que continua em HTML estático na raiz do repositório).

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 3.4 (tokens via CSS variables em `src/app/globals.css`)
- lucide-react (ícones) + ícones próprios da marca
- Prisma + PostgreSQL: schema em `prisma/schema.prisma` + seed em `prisma/seed.ts`. Sem `DATABASE_URL`, roda em modo mock (dados em memória)
- Auth por sessão JWT (jose) + OTP por e-mail; `/cliente` e `/admin` protegidos por middleware
- Pagamento agnóstico de gateway (`src/server/payments.ts`): adapters Mercado Pago, Asaas e mock

## Rodar

```bash
cd portal
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producao
npm run start    # serve o build
npm run typecheck
```

A home (`/`) redireciona para `/cliente/login`. A escolha de plano fica na landing (`index.html`, seção `#pacotes`); o portal entra a partir do checkout.

### Banco local (Docker)

O `docker-compose.yml` sobe um PostgreSQL (porta **55432** no host, para não conflitar com um Postgres já existente em 5432). A `DATABASE_URL` fica no `.env` (lido pelo Prisma e pelo Next).

```bash
docker compose up -d      # sobe o Postgres
npm run db:migrate        # cria as tabelas
npm run db:seed           # popula com os dados de exemplo
npm run dev               # app usando o banco real
docker compose down       # para o banco (use -v para apagar os dados)
```

Sem `DATABASE_URL` (ou sem o container), o app cai automaticamente no modo mock (dados em memória).

## Rotas

| Rota | Tela |
|---|---|
| `/checkout` | Checkout |
| `/cliente/login` | Login do cliente (e-mail + código) |
| `/cliente` | Dashboard do cliente |
| `/cliente/plano` | Meu Plano |
| `/cliente/faturas` | Faturas |
| `/cliente/pagamento` | Pagamento |
| `/cliente/suporte` | Suporte |
| `/admin/login` | Login admin |
| `/admin` | Dashboard admin |
| `/admin/clientes` | Lista de clientes |
| `/admin/clientes/[id]` | Detalhe do cliente (abas) |
| `/admin/faturas` | Faturas (todas) |
| `/admin/followups` | Follow-ups + régua |
| `/admin/planos` | Planos |
| `/admin/configuracoes` | Configurações (integrações/equipe/régua) |

## Estrutura

```
src/
  app/
    layout.tsx            layout raiz (fontes, providers, anti-flash de tema)
    page.tsx              redirect -> /assinar
    globals.css           design system completo (tokens, componentes)
    (public)/             /assinar, /checkout
    (auth)/               logins cliente e admin
    (client)/             area do cliente (shell com sidebar)
    (admin)/              painel admin (shell com sidebar + busca + sino)
  components/
    icons.tsx             conjunto de icones (marca, UI, WhatsApp, PIX, Discord, Trello)
    providers/            tema/densidade/estado-demo, toast, modal
    shell/                Sidebar, Topbar, AppShell, navs publica/auth, rodapes
    ui/                   StatusBadge, Metric, EmptyState, ThemeToggle
    admin/                acoes de linha, modal de novo cliente
    client/               contexto de estado-demo, modal de pagamento
  lib/
    data.ts               dados mockados (planos, clientes, faturas, follow-ups...)
    types.ts              tipos da camada de dados
    format.ts             fmt, fmtFull, initials, statusMeta
    nav.ts                navegacao e metadados de pagina
prisma/
  schema.prisma           modelo de dados (preparado, nao conectado)
```

## Tema e densidade

- Tema escuro (padrão) + claro, alternados pelo botão sol/lua. Persistido em `localStorage` (`waveops:portal:v1`), aplicado antes do paint para evitar flash.
- Densidade confortável/compacta via `data-density` no `<html>`.
- **Estado de exemplo** da área do cliente (`em-dia` / `vencido` / `pausado`) também fica no store; o padrão é `em-dia`. Útil para validar cada cenário do dashboard, faturas e alertas.

## Backend (roda em modo mock por padrão)

O backend já existe e funciona sem nenhuma credencial: sem `DATABASE_URL` usa um repositório em memória, com `PAYMENT_GATEWAY=mock` simula o pagamento, e as integrações apenas logam. Tudo configurável por env (ver `.env.example`).

- **Dados** (`src/server/repo.ts`): interface única com implementação mock (padrão) e Prisma (quando há `DATABASE_URL`).
- **Auth** (`src/server/auth.ts` + `src/middleware.ts`): login do cliente por código (OTP) e admin por e-mail+senha; sessão em cookie JWT httpOnly; middleware protege `/cliente` e `/admin`. Em dev o código OTP volta na resposta (`devCode`); em produção vai por e-mail. `AUTH_ENFORCED=false` libera as áreas para demonstração.
- **Pagamento** (`src/server/payments.ts`): porta única + adapters `mercadopago`, `asaas` e `mock`. Webhook em `/api/webhooks/[provider]` (valida assinatura). Escolha por `PAYMENT_GATEWAY`.
- **Jobs** (`src/server/jobs.ts`): régua de cobrança + pausa por inadimplência em `/api/jobs/dunning` (protegido por `CRON_SECRET`).
- **Integrações** (`src/server/integrations.ts`): Discord (alertas), Trello (tarefas), Resend (e-mail).

### APIs

`/api/auth/{request-code,verify-code,admin-login,logout,me}` · `/api/me` · `/api/me/invoices` · `/api/plans` · `/api/customers` (+`/[id]`) · `/api/invoices` (+`/[id]/mark-as-paid`, `/[id]/resend-payment-link`) · `/api/followups` (+`/send`) · `/api/support-tickets` · `/api/metrics` · `/api/checkout` · `/api/webhooks/[provider]` · `/api/jobs/dunning`

Os fluxos de **escrita** (login do cliente e admin, checkout, abrir chamado, logout) já chamam a API. As telas de **leitura** (dashboards) ainda leem de `src/lib/data.ts`; as APIs equivalentes já existem para migrar cada tela para `fetch` quando quiser.

## Próximos passos (ir para produção, precisa de credenciais)

1. `DATABASE_URL` (Postgres) + `npm run db:migrate` + `npm run db:seed`.
2. `PAYMENT_GATEWAY=mercadopago` (ou `asaas`) + tokens; apontar o webhook do gateway para `/api/webhooks/<gateway>`.
3. `RESEND_API_KEY` (e-mail do OTP e avisos), `DISCORD_WEBHOOK_URL`, `TWENTY_API_URL`/`TWENTY_API_TOKEN` (WaveOps CRM).
4. `SESSION_SECRET` forte e `ADMIN_PASSWORD` próprio.
5. Agendar um cron diário chamando `/api/jobs/dunning` com header `Authorization: Bearer <CRON_SECRET>`.

## Integração com a landing

A landing (raiz do repo) já aponta para o portal:
- "Assinar agora" -> rola até a seção de planos da landing (`#pacotes`)
- CTAs dos planos -> `/checkout?plano=<id>`
- "Já sou cliente" -> `/cliente/login`

Os links são raiz-relativos (mesma origem, ex. `waveops.com.br/checkout`). Se o portal for servido em subdomínio, troque para `https://portal.waveops.com.br/...` na landing (`index.html`, há um comentário marcando o ponto).
