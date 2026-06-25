# WaveOps — Modelo de pacotes, add-ons e margem

Junho de 2026. Este documento define os pacotes da WaveOps, a tabela de add-ons, a taxa de implantação e a política de uso justo. Fecha a margem sem espantar o lead. Foi construído com benchmark de empresas do mesmo segmento e validado com três testes adversariais de margem nos piores casos.

## Princípio central

O preço fixo carrega só o que **dilui** entre clientes: servidor, banco, n8n, monitoramento, manutenção e 1 número de WhatsApp por plano. Esse custo fica em torno de R$20 a R$40 por mês por cliente leve, rateado num servidor barato, e é o verdadeiro diferencial: "você não cuida de servidor nem credencial".

Tudo que **escala por unidade** sai do fixo e vira add-on transparente: número extra de WhatsApp, consumo de IA em volume, disparo de marketing e implantação de construção do zero. O cliente vê o custo do canal e a nossa gestão em linhas separadas. Nada é ilimitado, e isso é proposital.

## Pacotes (decididos)

| Plano | Mensal | Anual (por mês) | Para quem | Inclui de novo |
|---|---|---|---|---|
| Operação | R$397 | R$327 | Manter de pé o que já existe | 1 número de WhatsApp incluso, cap de 2 automações, sem IA |
| Essencial | R$697 | R$577 | Quem evolui todo mês | Até 5 automações, 1 evolução por mês, suporte prioritário |
| Pro | R$1.297 | R$1.067 | Quem constrói algo novo | Sistema, dashboard ou agente de IA, piso da IA (Haiku incluso até 10 mil chamadas) |
| Empresarial | a partir de R$2.497 | a partir de R$2.097 | Operação dimensionada em contrato | Múltiplos números como canal dedicado, SLA, contato dedicado |

Mudanças em relação ao anterior:

- **Operação** intacto no preço (R$397 / R$327). É o que segura o lead PME que compra pelo WhatsApp. Ganha cap explícito (2 automações, sem agente de IA) e preço marginal por automação extra, virando upsell em vez de trabalho grátis.
- **Essencial** sai de R$497 (colado no Operação) e sobe para R$697 / R$577. O gap de R$100 que não justificava um tier vira R$300 com valor real: 1 evolução por mês inclusa.
- **Pro** sai de R$997 para R$1.297 / R$1.067 e passa a ser o piso explícito da IA. Agente de IA com LLM econômico (Claude Haiku) incluso até 10 mil chamadas por mês. Ganha cap de 12 automações mais 1 sistema ou agente, fechando o escopo aberto que corroía a margem. Mantém o selo "Mais escolhido".
- **Empresarial** deixa de ter preço fixo (R$1.997) e passa a "a partir de R$2.497", dimensionado em contrato. Frota de números e disparo de marketing cotados como canal à parte. É onde o caso das 10 instâncias mora, fora do fixo.

## Tabela de add-ons (nova)

A WaveOps não tinha nenhum add-on. Esta é a primeira tabela.

| Add-on | Preço ao cliente | Custo real | Regra de margem |
|---|---|---|---|
| Número WhatsApp extra (Cloud API oficial) | R$89/mês por número | BSP ~R$280/mês para a conta inteira, número sem mensalidade, atendimento R$0 | Padrão para 3 números ou mais. Margem alta |
| Número WhatsApp extra (sessão Z-API) | R$149/mês por número | R$99,99/instância (Ultimate) | 33% fora do Partner. Nunca vender a R$99 fora do Partner: dá prejuízo |
| Consumo de IA acima do incluso | a partir de R$169/mês, dimensionado no briefing | R$105 a R$520 conforme tokens e modelo | Cobrado por faixa de uso, classificado no briefing. Ver regra de tokens abaixo |
| Disparo de marketing | saldo pré-pago, a partir de R$0,55/mensagem (mínimo R$300) | tarifa Meta R$0,31 a R$0,38 | Consumo, nunca mensalidade fixa. Atendimento (service) continua R$0 |
| Automação adicional | R$120 (Operação) ou R$110 (demais) por automação | R$5 a R$15 de custo marginal | Acima de 2 extras, recomendar upgrade de plano |
| Sistema ou agente adicional | a partir de R$497/mês por unidade | manutenção R$15 a R$30 mais consumo de LLM à parte | Cliente com 2 ou mais sistemas vai para o Empresarial |
| Implantação (construção do zero) | R$0 sobre base existente; R$697 (Essencial), R$1.297 (Pro), a partir de R$2.497 (Empresarial) | trabalho de build e migração | Taxa única. Cobre o prêmio de risco do ambiente que não montamos |

## Política de uso justo

Cada plano cobre um número definido de automações, de evoluções por mês e de uso, combinados na ativação. Medimos pelo percentil 95 dos últimos 30 dias, ou seja, pelo uso normal, ignorando picos isolados. Se o uso real passar do teto de forma constante, avisamos antes, mostramos o número e propomos o add-on ou o upgrade. Nunca cobramos surpresa. A evolução inclusa segue uma fila: o pedido do mês entra na vez, o pedido a mais entra no mês seguinte.

Enforcement começa manual (relatório mensal mais linha na fatura) e só vira texto de contrato depois de medir os 2 ou 3 primeiros fechamentos reais.

## O caso das 10 instâncias (resolvido)

Um cliente que quer 1 automação simples mas precisa de 10 números de WhatsApp custa de R$550 a R$1.000 por mês só de Z-API. Dentro de um plano de R$397 isso é prejuízo de até 159%. A regra é dura: número nunca entra no fixo.

Caminho correto, atendimento: migrar os 10 números para a Cloud API oficial da Meta via BSP de mensalidade fixa. Número não tem mensalidade e a conversa de atendimento custa R$0. Receita de Empresarial mais R$89 por número, custo de cerca de R$310 para a conta inteira, margem em torno de 90%.

Caminho Z-API, disparo de marketing: cobrar R$149 por número e entrar no programa Partner da Z-API para o custo unitário cair. Sempre Empresarial, nunca Operação.

## Regras internas de margem (achadas na verificação adversarial)

A estrutura protege a margem, mas três pontos dependem de disciplina operacional. Eles não vão na landing. São regra interna.

1. **Cloud API é o padrão, não a recomendação.** Para qualquer caso de 3 números ou mais de atendimento, abrir no canal oficial da Meta por padrão. É o único caminho com folga real de margem e elimina o risco de ban da sessão não-oficial. Z-API multi-número só quando o cliente exige função que a Cloud API não cobre, cotado como canal à parte. No checkout e no CRM, bloquear a venda de mais de 1 a 2 números extras dentro de Operação e Essencial, forçando o roteamento para Empresarial.

2. **IA é cobrada por token, não por chamada.** O bloco de R$169 por 10 mil chamadas vale só para uso leve (Haiku, até cerca de 1 mil tokens de entrada por chamada). Acima disso, reclassificar como bloco pesado. Internamente, precificar por faixa de tokens, com cerca de 30% sobre o custo real. Agente pesado (muitos tokens ou Sonnet) não é caso de Pro com add-on: é Empresarial, com linha de consumo de LLM repassada com markup fixo (custo mais 30%), nunca preço fechado. Nenhuma credencial de LLM é provisionada nos planos Operação e Essencial, tornando IA pesada tecnicamente impossível ali, não só proibida por texto. O modelo do agente (Haiku ou Sonnet) e o volume são classificados no briefing pós-pagamento, antes do go-live.

3. **Cobrar no ato, não no relatório do mês seguinte.** O custo de LLM dispara rápido (de R$130 para R$520) e a média de 30 dias detecta tarde demais. Medir o consumo de LLM em tempo quase real, com gatilho automático de aviso em 80% do teto, dentro do mesmo ciclo. Trocar o modelo do agente para Sonnet exige assinar o add-on antes de ativar. Número extra dispara a linha de cobrança no dia em que conecta, porque o custo da Z-API incide assim que o número conecta.

## Benchmark de empresas do segmento

Levantamento de como empresas como a WaveOps empacotam, usado para calibrar os pacotes.

| Empresa | Modelo | Mensalidade | Como tratam número e IA |
|---|---|---|---|
| Rollin Host (BR) | Assinatura gerenciada de agente de IA WhatsApp | R$299/mês, setup incluso em 7 dias | Número (Uazapi R$38) e OpenAI (pay-per-use ~R$50) FORA da mensalidade |
| Hora de Codar (BR, guia de mercado) | Manutenção mensal n8n | R$200 a R$400 (básico), R$500 a R$900 (intermediário), R$1.200+ (avançado) | Hospedagem e licenças repassadas |
| Justam (BR) | Implementação mais retainer | Implementação R$8k a R$80k, retainer R$1.500 a R$8.000 | Infra e ferramentas embutidas no retainer |
| Clint (BR) | SaaS por módulo mais consumo | Base R$523, módulo de automação R$299 (1 agente), agente adicional R$99 | Custo por interação R$0,05 a R$0,38, Meta repassada |
| FiqOn / SocialHub / Manychat (BR) | SaaS por volume | R$24,90 a R$399 | Custo por mensagem R$0,06 a R$0,12 |

Padrões que confirmaram o desenho:

- Dois modelos coexistem no Brasil: assinatura gerenciada pura (Rollin Host, faixas da Hora de Codar) e projeto mais retainer (Justam). A WaveOps está na assinatura gerenciada, mais alinhada à PME e à receita recorrente.
- Separar número e IA da mensalidade é prática estabelecida (Rollin Host e Clint fazem). Embutir tudo (Justam) só funciona com ticket de retainer alto, de R$1.500 para cima.
- Taxa de setup não é universal. Quem vende assinatura gerenciada de entrada tende a não cobrar setup sobre base existente, e cobra só na construção do zero. Foi exatamente a decisão da WaveOps.
- Cobrar por agente adicional (Clint, R$99) e por número conectado é legível para o cliente. O add-on da WaveOps não soa abusivo.

## Por que protege a margem

Cinco frentes, validadas contra os custos reais:

1. O fixo só carrega custo que dilui (R$20 a R$40 por cliente leve). R$397 fecha no Operação.
2. IA pesada fica travada acima do Operação. Com piso no Pro e classificação no briefing, o custo de LLM é coberto antes de o cliente assinar.
3. O que escala por unidade saiu do fixo. Número extra cobre a instância Z-API com 33% de margem. IA em volume vira bloco com cerca de 30%. Disparo de marketing é saldo pré-pago, nunca mensalidade.
4. Caps explícitos fecham o escopo aberto. Teto de 2, 5 e 12 automações, teto de 1 sistema no Pro e teto de IA transformam "só mais uma coisinha" em add-on recorrente.
5. A implantação one-time cobre o prêmio de risco do ambiente que não montamos, sem barrar a entrada, já que é zero sobre base existente.

O maior vetor de prejuízo, as 10 instâncias, vira o canal de maior margem ao migrar para a Cloud API oficial.
