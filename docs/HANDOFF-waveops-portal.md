# Handoff — WaveOps Portal

Documento de passagem de conhecimento do **WaveOps Portal** (área do cliente + painel admin de assinaturas) e da integração com a landing page existente. Cobre o que já foi construído, o estado atual, o roadmap futuro e todas as regras e decisões aplicadas.

Última atualização: 2026-06-21 (leituras ligadas à API, ciclo de cobrança completo no código, ações de escrita reais e animações).

---

## 1. Visão geral

O repositório `FlowOps` contém **dois produtos WaveOps**:

1. **Landing page** (raiz do repo): site comercial em HTML/CSS/JS estático, servido no GitHub Pages. Continua existindo e "vende".
2. **WaveOps Portal** (`portal/`): aplicação Next.js que "assina, cobra e gerencia o cliente". Tem área do cliente e painel administrativo.

Divisão de responsabilidades acordada:
- A **landing** vende e capta.
- O **portal** faz assinatura, cobrança, área do cliente e painel admin.
- A **área do cliente** mostra plano, status, vencimento, faturas e botão de pagamento.
- O **painel admin** mostra clientes, faturas, inadimplentes, follow-ups e métricas.

---

## 2. Arquitetura

```
FlowOps/
  index.html              landing CANÔNICA (estática, GitHub Pages)
  assets/                 css/js/fontes da landing (fonte de verdade)
  portal/                 app Next.js (este é o produto novo)
    scripts/sync-landing.mjs   copia index.html + assets/ para portal/public/
    public/landing.html        cópia gerada (gitignored)
    public/assets/             cópia gerada (gitignored)
  docs/HANDOFF-...md       este documento
```

- **Integração na mesma origem (feita em 2026-06-21):** o Next do portal serve a landing em `/`. Um rewrite em `next.config.mjs` (`beforeFiles: /  ->  /landing.html`) entrega a landing; `scripts/sync-landing.mjs` (rodado automaticamente no `predev`/`prebuild`) copia a landing canônica da raiz para `portal/public/`. Resultado: `/` = landing, `/checkout`, `/cliente`, `/admin` = portal, tudo na MESMA origem. A raiz do repo continua sendo a fonte de verdade da landing (as cópias em `public/` são geradas e gitignored).
- A landing já usa links raiz-relativos: "Assinar agora" rola até `#pacotes`, cada plano vai para `/checkout?plano=<id>`, "Já sou cliente" vai para `/cliente/login`, e "Voltar aos planos" do checkout volta para `/#pacotes`. Com a integração acima, todos funcionam de ponta a ponta.
- A landing da raiz segue publicável no GitHub Pages como antes (independente do portal). Quando o portal for para um host Node, a landing servida por ele já é a mesma (via sync), cumprindo a unificação 1:1 sem duplicar conteúdo no git.

---

## 3. Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 3.4** com tokens via CSS variables (`portal/src/app/globals.css`)
- **lucide-react** + ícones próprios da marca
- **Prisma 6** + **PostgreSQL** (Docker)
- **jose** (sessão JWT) para autenticação
- **npm** como gerenciador
- Pagamento: **Mercado Pago** (principal), Asaas (secundário), mock (dev) — agnóstico via porta
- Sem dependência de SDK de pagamento (chamadas REST diretas)

---

## 4. O que já foi feito

### 4.1 Frontend do portal (15 telas)
Todas em PT-BR, recriadas fielmente a partir do protótipo, com tema claro/escuro e densidade:
- Públicas: `/checkout`, `/checkout/sucesso` (a página de planos vive na landing)
- Auth: `/cliente/login` (e-mail + código OTP), `/admin/login` (e-mail + senha)
- Cliente: `/cliente`, `/cliente/plano`, `/cliente/faturas`, `/cliente/pagamento`, `/cliente/suporte`
- Admin: `/admin`, `/admin/clientes`, `/admin/clientes/[id]`, `/admin/faturas`, `/admin/followups`, `/admin/planos`, `/admin/configuracoes`
- `/` redireciona para `/cliente/login`

### 4.2 Design system / tema
- Todos os tokens do handoff (cores escuro/claro, status, raios, sombras, fontes) em `globals.css`.
- Tema escuro (padrão) + claro, densidade confortável/compacta, persistidos em `localStorage` (`waveops:portal:v1`), com script anti-flash antes do paint.
- Componentes: Sidebar, Topbar, AppShell, Modal, Toast, StatusBadge, Metric, EmptyState, etc.
- Fontes via `next/font`: Space Grotesk, Hanken Grotesk, Space Mono.

### 4.3 Integração com a landing
- Botões "Assinar agora" e "Já sou cliente" no topo e no menu mobile.
- CTAs dos 4 planos apontando para o `/checkout?plano=<id>` do portal.
- Sem reescrever a landing; apenas edições pontuais no `index.html`.

### 4.4 Backend
Roda **em modo mock por padrão** (sem nenhuma credencial). Tudo configurável por env.
- **Camada de dados** (`portal/src/server/repo.ts`): interface única, com implementação mock (em memória) e Prisma (quando há `DATABASE_URL`).
- **Auth** (`portal/src/server/auth.ts` + `portal/src/middleware.ts`): login do cliente por código (OTP 4 dígitos, stateless via cookie assinado), login admin por e-mail+senha, sessão em cookie JWT httpOnly (jose), middleware protegendo `/cliente` e `/admin`. Em dev o código volta na resposta (`devCode`); em produção iria por e-mail. `AUTH_ENFORCED=false` libera as áreas para demonstração.
- **Pagamento** (`portal/src/server/payments.ts`): porta única + adapters `mercadopago`, `asaas`, `mock`. Webhook em `/api/webhooks/[provider]` com validação de assinatura (HMAC no MP, token no Asaas).
- **Integrações** (`portal/src/server/integrations.ts`): Discord (alertas), Trello (tarefas), Resend (e-mail). Degradam para log quando sem credencial.
- **Jobs** (`portal/src/server/jobs.ts`): régua de cobrança (6 janelas) + pausa por inadimplência (> 7 dias), em `/api/jobs/dunning`, protegido por `CRON_SECRET`.
- **20 rotas de API** (ver seção 11).
- Fluxos de **escrita já ligados à API**: login do cliente, login admin, checkout, abrir chamado, logout.
- **Leituras das telas ligadas à API (2026-06-21):** todos os dashboards (cliente e admin) agora leem do backend via um hook `useApi`. Detalhes:
  - `guard()` (`src/server/http.ts`) sintetiza um usuário-padrão quando `AUTH_ENFORCED=false`: cliente demo (`DEMO_CUSTOMER_EMAIL`, padrão João) ou admin, conforme o papel exigido pela rota. Sem isso, com login desligado os dashboards levavam 401. Com `AUTH_ENFORCED=true` o comportamento volta a exigir sessão.
  - `Me` ganhou o campo `status` (vem do banco), então o estado do cliente é **real**. O antigo toggle de demonstração (`em-dia/vencido/pausado`) saiu do `useClientCtx`: agora ele busca `/api/me` + `/api/me/invoices` e deriva status, fatura em aberto e alerta dos dados.
  - Front: `src/lib/api.ts` (`apiGet` + `ApiError`), `src/lib/useApi.ts` (`useApi<T>` com `{ data, loading, error, reload }`), `src/components/ui/Loading.tsx` (`Loading`/`LoadError`). Toda tela trata carregamento e erro de forma consistente.
  - `plans` e `reguaSteps` seguem importados de `src/lib/data.ts` (config estática, servida igual pela API).

### 4.5 Banco de dados (Docker + Prisma)
- `portal/docker-compose.yml`: PostgreSQL 16 na porta **55432** do host (5432/5433 estavam ocupadas na máquina de dev).
- Schema completo em `portal/prisma/schema.prisma` (modelo da seção 10 do handoff original).
- `prisma migrate` criou as tabelas; `prisma db seed` (`portal/prisma/seed.ts`) populou a partir do `src/lib/data.ts`.
- `DATABASE_URL` no `portal/.env` (lido por Prisma e Next).
- Paridade de dados: adicionados ao `Customer` os campos de exibição (nome da pessoa, plano, valor, vencimento, último pagamento, forma), para o banco devolver o mesmo que o mock mostrava.

### 4.6 Pagamento (decisão Mercado Pago)
- Decisão: **Mercado Pago** como gateway principal (escolha do usuário). Asaas implementado como alternativa (mais barato/nativo para recorrência B2B). Mock como padrão de dev.
- Troca por env `PAYMENT_GATEWAY`.
- O adapter do MP, sem `MERCADOPAGO_ACCESS_TOKEN`, degrada para checkout simulado (para o fluxo continuar visível). Com o token, vira real (assinatura via `preapproval`).

### 4.7 Verificações feitas
- `tsc --noEmit` limpo e `next build` limpo (todas as páginas + 20 rotas + middleware).
- Runtime com banco real: proteção de rotas (307 sem login), login OTP do cliente, login admin, `/api/customers` (12, nomes certos), `/api/me` (João), `/api/metrics` (computado do banco), `/api/jobs/dunning` (401 sem secret), webhook (valida gateway), criação de chamado gravando no banco.

---

## 5. Estado atual (funciona vs. pendente)

| Item | Estado |
|---|---|
| UI completa (15 telas), tema, responsivo | Pronto |
| Landing integrada (links para o portal) | Pronto |
| Backend (auth, APIs, jobs, webhook, integrações) | Pronto (modo mock por padrão) |
| Banco PostgreSQL em Docker + migrate + seed | Pronto, app conectado |
| Repositório Prisma servindo dados reais nas APIs | Pronto e verificado |
| Fluxos de escrita (login, checkout, suporte, logout) | Ligados à API |
| Leituras das telas (dashboards) | Ligadas à API (cliente e admin), com loading/erro. Status do cliente derivado dos dados reais |
| `guard()` com usuário-padrão em modo demo (`AUTH_ENFORCED=false`) | Pronto |
| Histórico de faturas do cliente no banco | Pronto (seed enriquecido: 5 pagas + 1 em aberto para o João, datas ancoradas em "agora") |
| Ações de escrita reais (marcar paga, reenviar, novo cliente, rodar régua, pausar/cancelar, upgrade/cancelar via chamado) | Pronto, ligadas à API com refresh |
| Ciclo de cobrança no código (checkout persiste → webhook confirma → cliente reativa) | Pronto (DB mode); falta só o token real do MP para virar live |
| Animações (portal: framer-motion; landing: CSS/Web Animations) | Pronto, com `prefers-reduced-motion` |
| Token real do Mercado Pago (vira pagamento live) | Pendente (você fornece) |
| Integrações reais (Resend/Discord/Trello) | Pendente (credenciais) |
| Deploy (host Node + Postgres gerenciado + domínio) e `AUTH_ENFORCED=true` | Pendente (você decide/provê) |
| Migração da landing para o Next | Não feita (decisão: fase de host Node) |

---

## 6. Decisões de produto e de arquitetura (fixadas na conversa)

1. Portal em `portal/`, app Next.js **separado** da landing.
2. Stack: Next + TS + Tailwind + Prisma/PostgreSQL + npm.
3. MVP: **frontend com dados mock primeiro**, depois backend/banco/pagamento.
4. Interface 100% **PT-BR**; tema escuro padrão + claro.
5. **Planos ficam na landing** (seção `#pacotes`); o portal entra a partir do `/checkout`. A página `/assinar` do portal foi removida.
6. **Discord no lugar do Slack** (alertas internos) e **Trello no lugar do ClickUp** (onboarding/suporte).
7. **Mercado Pago** como gateway (Asaas como alternativa pronta).
8. Banco **no Docker** (Postgres), porta 55432.
9. **Migração da landing para o Next** fica para quando sair do GitHub Pages para host Node (com o backend). Ao migrar, portar o HTML/CSS 1:1 para manter o mesmo visual.
10. Antes de codar tarefas grandes, gerar plano e só então implementar (pedido do usuário).

---

## 7. Roadmap / o que falta (futuro)

### Curto prazo (CONCLUÍDO em 2026-06-21)
1. ~~Enriquecer o seed com o histórico de faturas do cliente.~~ Feito: seed reescrito com histórico do João e datas ancoradas no momento do seed (status vencido/pausado e métricas por mês ficam coerentes em qualquer data).
2. ~~Ligar as leituras das telas à API e transformar o estado de exemplo em status real.~~ Feito: 9 telas convertidas (cliente: dashboard, plano, faturas, suporte; admin: dashboard, clientes, detalhe, faturas, follow-ups). Status do cliente vem de `me.status`.
3. ~~Expor um `guard()` que devolva usuário padrão quando `AUTH_ENFORCED=false`.~~ Feito em `src/server/http.ts`.

Verificado: `tsc --noEmit` e `next build` limpos; smoke test em runtime (modo mock, `AUTH_ENFORCED=false`) confirmou `/api/me` (João, status), `/api/me/invoices` (6), `/api/customers` (12), `/api/customers/[id]` (payload completo), `/api/metrics`, `/api/followups` (7).

Próximo passo natural: rodar o seed no Postgres (Docker) para ver os números computados do banco (datas ancoradas), e seguir para o médio prazo.

### Médio prazo (produção)
4. **Mercado Pago real:** o código já está pronto. O checkout persiste cliente + assinatura + 1ª fatura (`recordCheckout`), e o webhook `/api/webhooks/mercadopago` já **aplica o pagamento no banco** (`applyGatewayPayment`: marca a fatura paga e reativa o cliente, idempotente). Falta só: colar `MERCADOPAGO_ACCESS_TOKEN` + `MERCADOPAGO_WEBHOOK_SECRET` e cadastrar a URL do webhook no painel do MP. Sem o token, o checkout roda simulado e o webhook responde mas não há cobrança real.
5. **Integrações reais:** `RESEND_API_KEY` (e-mail do OTP e avisos), `DISCORD_WEBHOOK_URL`, `TRELLO_*`. Código pronto, degrada para log sem credencial.
6. **Cron diário** chamando `/api/jobs/dunning` com `Authorization: Bearer <CRON_SECRET>`.
7. **Auth real ligado** (`AUTH_ENFORCED=true`), `SESSION_SECRET` forte e `ADMIN_PASSWORD` próprio (já há um `.env.local` com segredos gerados em dev).
8. **Deploy:** sair do GitHub Pages para host Node (Vercel ou similar), Postgres gerenciado, e então decidir o domínio (mesma origem `waveops.com.br/...` ou subdomínio `portal.waveops.com.br`).

### Longo prazo
9. **Unificar a landing no Next** (portar 1:1), eliminando o problema de "dois visuais" e tendo um sistema só.
10. Itens da fase 2/3 do escopo: cancelamento/upgrade pelo portal, retentativa inteligente, relatórios financeiros, área de documentos/contratos, etc.

---

## 8. Como rodar

```bash
cd portal
npm install

# banco local (Docker)
docker compose up -d        # Postgres na porta 55432
npm run db:migrate          # cria as tabelas
npm run db:seed             # popula os dados de exemplo

npm run dev                 # http://localhost:3000 (predev sincroniza a landing)
# build/produção
npm run build && npm run start
npm run typecheck
docker compose down         # para o banco (use -v para apagar dados)
```

**Testar o fluxo completo (landing + portal na mesma origem):** abra `http://localhost:3000/` (landing). O `npm run dev` roda o sync da landing antes de subir. Caminho de teste: landing `/` -> clicar num plano -> `/checkout?plano=<id>` -> enviar (gateway simulado sem token) -> `/checkout/sucesso` -> "Já sou cliente" -> `/cliente/login` -> (em dev o código OTP aparece na tela) -> `/cliente`. Admin em `/admin/login` (`financeiro@waveops.com.br` / `waveops-admin`) ou direto em `/admin` (com `AUTH_ENFORCED=false`). Se editar a landing, rode `npm run sync:landing` (ou apenas reinicie o `npm run dev`).

Sem `DATABASE_URL` (ou sem o container), o app cai automaticamente no modo mock (dados em memória), e tudo continua funcionando.

Credenciais de demonstração: admin `financeiro@waveops.com.br` / `waveops-admin`; cliente qualquer e-mail (em dev o código de 4 dígitos aparece na tela).

---

## 9. Variáveis de ambiente

Ver `portal/.env.example` (modelo) e `portal/.env` / `portal/.env.local` (locais, gitignored).

- `DATABASE_URL` — Postgres (vazio = mock)
- `SESSION_SECRET` — segredo da sessão JWT (gerado em dev)
- `AUTH_ENFORCED` — `true` exige login; `false` libera para demo
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- `PAYMENT_GATEWAY` — `mock` | `mercadopago` | `asaas`
- `MERCADOPAGO_ACCESS_TOKEN` / `MERCADOPAGO_WEBHOOK_SECRET`
- `ASAAS_API_KEY` / `ASAAS_BASE_URL` / `ASAAS_WEBHOOK_TOKEN`
- `RESEND_API_KEY` / `EMAIL_FROM`
- `DISCORD_WEBHOOK_URL`
- `TRELLO_API_KEY` / `TRELLO_TOKEN` / `TRELLO_LIST_ID`
- `CRON_SECRET` — protege `/api/jobs/dunning`
- `APP_URL` — URL pública (back_url do gateway, links)

---

## 10. Estrutura de pastas (portal)

```
portal/
  prisma/
    schema.prisma         modelo de dados
    seed.ts               popula o banco a partir de src/lib/data.ts
    migrations/           migrações geradas
  docker-compose.yml      Postgres local (porta 55432)
  src/
    app/
      layout.tsx          fontes, providers, anti-flash de tema
      page.tsx            redirect -> /cliente/login
      globals.css         design system completo
      (public)/           /checkout, /checkout/sucesso
      (auth)/             logins cliente e admin
      (client)/           área do cliente (shell)
      (admin)/            painel admin (shell)
      api/                rotas de API (ver seção 11)
    components/
      icons.tsx           ícones (marca, UI, WhatsApp, PIX, Discord, Trello)
      providers/          tema/densidade/demo, toast, modal
      shell/              Sidebar, Topbar, AppShell, navs, rodapés, logout
      ui/                 StatusBadge, Metric, EmptyState, ThemeToggle
      admin/              ações de linha, modal de novo cliente
      client/             contexto de status, modal de pagamento
    lib/
      data.ts             dados mock (fonte do seed)
      types.ts            tipos
      format.ts           fmt, fmtFull, initials, statusMeta
      nav.ts              navegação e metadados de página
    server/               SOMENTE servidor (import "server-only")
      env.ts              leitura de env
      db.ts               PrismaClient (lazy)
      repo.ts             repositório (mock + Prisma)
      auth.ts             sessão JWT + OTP
      http.ts             helpers de resposta + guard
      payments.ts         porta + adapters MP/Asaas/mock
      integrations.ts     Discord/Trello/Resend
      jobs.ts             régua de cobrança + pausa
    middleware.ts         protege /cliente e /admin (edge)
```

---

## 11. APIs

```
Auth      POST /api/auth/request-code · /verify-code · /admin-login · /logout · GET /me
Cliente   GET /api/me · GET /api/me/invoices
Planos    GET /api/plans
Clientes  GET /api/customers · GET /api/customers/[id] (devolve { customer, invoices, followups }) · POST /api/customers · POST /api/customers/[id]/status (pausar/cancelar/reativar)
Faturas   GET /api/invoices · POST /api/invoices/[id]/mark-as-paid (marca paga + reativa o cliente) · /resend-payment-link (envia e-mail com o link)
Followups GET /api/followups · POST /api/followups/send (roda a régua pelo painel admin)
Suporte   GET/POST /api/support-tickets
Métricas  GET /api/metrics
Checkout  POST /api/checkout            (cria assinatura no gateway + persiste cliente/assinatura/1ª fatura, devolve checkoutUrl)
Webhook   POST /api/webhooks/[provider] (valida assinatura, normaliza E aplica o pagamento no banco)
Jobs      GET/POST /api/jobs/dunning    (protegido por CRON_SECRET)
```

---

## 12. Regras aplicadas

### 12.1 Regras de escrita (PT-BR)
- Tudo (interface, mensagens, comentários, explicações) em **português do Brasil** com acentuação correta.
- **Sem em dash nem en dash**; usar ponto, vírgula, dois-pontos ou o middot "·".
- Frases curtas, sem floreio.

### 12.2 Regras de negócio (do escopo)
- Cliente só fica **ativo** após confirmação de pagamento; primeira cobrança não paga = **aguardando**.
- Fatura vencida → cliente **vencido**; vencida > 7 dias → pode ser **pausado**.
- Cliente **pausado mantém acesso de leitura** ao portal e regulariza pagando.
- Régua de cobrança: 7 e 3 dias antes, no dia, +1, +3, +7 dias (este último avisa de pausa).
- Evitar follow-up duplicado (mesma fatura + mesmo tipo); registrar falhas de envio.
- Todo evento financeiro vira histórico; nenhum webhook apaga dados.
- O cliente sempre tem um botão claro de pagamento.
- Status do cliente: lead, aguardando, ativo, pendente, vencido, pausado, cancelado.
- Status da fatura: criada, em-aberto, paga, vencida, cancelada, estornada, reembolsada.

### 12.3 Regras de segurança
- **Nenhum segredo hardcoded.** Tokens/segredos só em `.env`/`.env.local` (gitignored).
- O portal **não processa cartão**; dados sensíveis ficam no gateway.
- Webhook **valida assinatura** (HMAC no Mercado Pago, token no Asaas) antes de processar.
- Sessão em **cookie httpOnly** assinado (JWT/jose); rotas protegidas por middleware.
- `/api/jobs/dunning` protegido por `CRON_SECRET`.
- Módulos de servidor marcados com `import "server-only"` para não vazarem para o client.
- `devCode` do OTP só é devolvido fora de produção.

### 12.4 Convenções técnicas
- Pagamento **agnóstico de gateway** (porta + adapters), trocável por env.
- Camada de dados via **repositório** (mock e Prisma atrás da mesma interface), trocável por env.
- App **roda sem nenhuma credencial** (degrada para mock/log), facilitando dev e demo.
- App Router do Next: `params` é Promise (await); `cookies()` é async.
- Sem reescrever a landing; apenas integração por links.

### 12.5 Decisões fixadas com o usuário
Ver seção 6. Resumo: portal separado, MVP mock-first, planos na landing, Discord/Trello, Mercado Pago, banco no Docker, migração da landing adiada, planejar antes de codar.

---

## 13. Gotchas / pontos de atenção

- **Porta do Postgres 55432** (não 5432): 5432 e 5433 estavam ocupadas na máquina de dev. Ajustável no `docker-compose.yml` + `.env`.
- **DB fora do ar em dev cai para mock automaticamente.** Se `DATABASE_URL` estiver setado mas o Postgres não responder, em desenvolvimento o repositório (`src/server/repo.ts`, `resilientRepo`) degrada para o mock com um aviso no console, em vez de estourar 500. A primeira chamada demora ~5s (timeout de conexão do Prisma) e depois fica em mock até reiniciar o `npm run dev`. Em produção o erro continua propagando de propósito. Para usar dados reais: suba o Postgres (`docker compose up -d` + `npm run db:seed`) e reinicie o dev.
- **Servir a landing: use o portal, não o Live Server.** A landing integrada vive em `http://localhost:3000/` (Next). O Live Server do VS Code (`127.0.0.1:5500`) só serve estático e dá "Cannot GET /cliente/login", "Cannot GET /checkout" etc. nos links do portal.
- **Acesse por `127.0.0.1`, não `localhost`.** Em máquinas com WSL2, o `wslrelay.exe` escuta no `localhost` IPv6 (`::1`) de portas como 3000 e sequestra o `localhost`, redirecionando tudo para um `/login` de outro app. Use `http://127.0.0.1:<porta>/` (IPv4) para bater direto no portal.
- **`.scrim` é compartilhado (modal + menu mobile do AppShell).** O `AppShell` mantém um `div.scrim` SEMPRE no DOM (overlay do drawer mobile). A regra CSS `.scrim` fechada PRECISA ter `opacity:0; pointer-events:none` (só `.scrim.open` ativa). Se tirar isso, a tela inteira fica embaçada e não clicável. Por isso modal e toast usam animação CSS (montagem por estado), não framer-motion (que pode deixar o overlay preso). framer-motion fica só em transição de página, stagger e hover.
- **Erro `Cannot find module './vendor-chunks/motion-dom.js'` (ou chunks órfãos) no dev:** cache `.next` velho depois de instalar/trocar dependência com o dev rodando. Solução: pare o dev, `Remove-Item -Recurse -Force .next`, `npm run dev`. O `next build` de produção sempre regenera limpo.
- **Prisma no Windows (EPERM):** `prisma generate` pode falhar ao trocar o `query_engine-windows.dll.node` se houver processo node segurando o lock. Solução: matar processos node órfãos do portal (workers do `next` que não morrem junto) e rodar de novo. O `TaskStop`/encerrar o terminal nem sempre mata os filhos.
- **`next start` roda em `NODE_ENV=production`:** nesse modo o `devCode` do OTP não volta na resposta (correto). Para testar OTP sem e-mail, use `npm run dev`.
- **Links landing→portal só funcionam na mesma origem.** RESOLVIDO para teste/produção: o portal serve a landing em `/` (rewrite + `sync-landing.mjs`), então rodar `npm run dev` no portal e abrir `http://localhost:3000/` já testa tudo na mesma origem. Abrir a landing isolada no Live Server (porta diferente) continua quebrando os links do portal: use o portal como servidor. Se um dia separar em subdomínio, trocar para a URL absoluta (comentário no `index.html`).
- **Modo demo depende de `AUTH_ENFORCED=false` + `guard()`.** Com login desligado, `guard()` devolve um usuário-padrão (cliente João ou admin). Se ligar `AUTH_ENFORCED=true`, os dashboards passam a exigir sessão real (login) para as APIs responderem. Trocável por env; cliente demo via `DEMO_CUSTOMER_EMAIL`.
- **Seed com datas ancoradas em "agora".** `prisma/seed.ts` calcula vencimentos/pagamentos relativos à data do seed (não usa mais datas fixas). Re-seedar muda as datas. As métricas de "recebido/a receber do mês" (`getMetrics`) são escopadas ao mês corrente; rode o app no mesmo mês do seed para ver números cheios.
- **Em modo mock (sem `DATABASE_URL`)**, as leituras das telas funcionam: o repositório mock devolve João + histórico; clientes que não são o João têm faturas vazias (no banco real, todos têm). Útil para rodar sem Docker.
- **Identificadores não renomeados de propósito:** `localStorage` `waveops:portal:v1` e a marca/temas. Na landing, a chave `flowops:tweaks:v1` e o path do webhook n8n `flowops-lead` permanecem (renomear quebra coisas vivas).

---

## 14. Referências

- `portal/README.md` — guia de execução do portal.
- `portal/.env.example` — todas as variáveis de ambiente.
- `portal/prisma/schema.prisma` — modelo de dados.
- Memória do projeto: `~/.claude/projects/.../memory/waveops-portal-architecture.md`.
- Comparativo de gateways (pesquisa): Mercado Pago (assinaturas/preapproval, webhook assinado) vs. Asaas (recorrência B2B nativa, mais barato em PIX/boleto).
