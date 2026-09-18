# Auditoria e padronização de placeholders

Inventário registrado antes de alterar o código produtivo. Unidade de contagem: definição de campo no código, incluindo controles nativos `select`; linhas dinâmicas e grupos de variáveis contam uma vez por definição, independentemente do número de instâncias. Wrappers não são contados novamente. O Address do Flex conta uma definição com variantes.

## Inventário

- Campos analisados: 47
- Campos com placeholder: 36
- Placeholders alterados: 21
- Placeholders mantidos: 15
- Campos sem placeholder: 11
- Constantes de placeholder alteradas: 21

| Arquivo | Campo | Label / título visual | Placeholder atual | Contexto funcional | Placeholder proposto |
|---|---|---|---|---|---|
| components/contact-input.tsx:172 | nameInputId | Nome | Nome do contato | Nome usado para salvar um telefone como contato no autocomplete | João Silva |
| features/contacts/components/contacts-manager.tsx:54 | contact-name | Nome | ex: João Silva | Cadastro/edição do nome de um contato | João Silva |
| features/contacts/components/contacts-manager.tsx:65 | contact-phone | Número (DDD + número) | ex: 1187654321 | Cadastro/edição do telefone de um contato: DDD + número | 11999999999 |
| features/conversations/components/close-form.tsx:292 | phone | Números de telefone (label visual do grupo, sem associação individual) | 11987654321 | Encerramento por telefone nacional com prefixo fixo whatsapp:+55 | 11999999999 |
| features/conversations/components/conversation-form.tsx:72 | conversation-sid | Conversation SID | CHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | Consulta de detalhes e mensagens por Conversation SID | CHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| features/conversations/components/conversation-messages.tsx:59 | message-content-search | Buscar no conteúdo | Digite um trecho da mensagem | Filtro textual sobre o corpo das mensagens carregadas | Busque por conteúdo da mensagem |
| features/conversations/components/conversation-messages.tsx:73 | message-author-filter | Autor | — | Filtro por autor entre os autores das mensagens carregadas | — |
| features/conversations/components/conversation-messages.tsx:93 | message-start-date | Data inicial | — | Limite inicial do período das mensagens | — |
| features/conversations/components/conversation-messages.tsx:105 | message-end-date | Data final | — | Limite final do período das mensagens | — |
| features/conversations/components/fetch-by-participant-form.tsx:303 | phone | Número de telefone | 1187654321 | Busca de Conversations por telefone nacional com prefixo fixo whatsapp:+55 | 11999999999 |
| features/environments/components/environment-form.tsx:139 | env-name | Nome do ambiente | ex: Produção, Homologação | Cadastro/edição do nome de um ambiente Twilio | Homologação |
| features/environments/components/environment-form.tsx:155 | env-sid | Account SID | ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | Account SID da conta usada pelo ambiente | ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| features/environments/components/environment-form.tsx:179 | env-token | Auth Token | 32 caracteres | Auth Token do ambiente: exatamente 32 caracteres | 32 caracteres |
| features/flex/components/create-address-config-form.tsx:274 | addressType | Tipo de endereço | — | Seleção do canal de entrada no Flex | — |
| features/flex/components/create-address-config-form.tsx:301 | address | Número WhatsApp / Número de telefone / ID do Messenger / ID Google Business Messages / E-mail / Número RCS / ID Apple Business Chat / ID do Chat | +5511999999999 (WhatsApp/SMS); vazio (demais canais) | Address específico do canal: número WhatsApp/SMS ou identificador dos demais canais | +5511999999999 (WhatsApp/SMS); vazio (demais canais) |
| features/flex/components/create-address-config-form.tsx:319 | friendlyName | Nome amigável do endereço | — | Nome opcional para identificar a configuração de Address | — |
| features/flex/components/create-address-config-form.tsx:350 | integrationType | Tipo de integração | — | Seleção da integração Studio/Webhook/Padrão | — |
| features/flex/components/create-address-config-form.tsx:374 | studioFlowSid | Studio Flow | Selecionar um Flow | SID enviado como autoCreationStudioFlowSid | FWxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| features/flex/components/create-address-config-form.tsx:397 | webhookUrl | Webhook URL | https://example.com/webhook | URL enviada como autoCreationWebhookUrl | https://exemplo.com/webhook |
| features/flex/components/create-address-config-form.tsx:408 | webhookMethod | Método HTTP | — | Seleção do método HTTP do Webhook | — |
| features/numbers/components/list-numbers-form.tsx:328 | search | Sem label associada | Buscar por nome ou número... | Filtro local por friendlyName ou phoneNumber dos Senders | Busque por nome ou número |
| features/taskrouter/components/add-particular-filter-form.tsx:379 | workspaceSid | Workspace SID | WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | Workspace SID no qual a operação do formulário é executada | WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| features/taskrouter/components/add-particular-filter-form.tsx:401 | filterName | Nome da regra de negócio | ex: PARTICULAR | Nome da regra adicionada ao roteamento dos Workflows | PARTICULAR |
| features/taskrouter/components/add-particular-filter-form.tsx:437 | row.workflowSid | Workflow SID (título visual, sem associação programática) | WWxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | Workflow SID de cada par dinâmico de roteamento | WWxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| features/taskrouter/components/add-particular-filter-form.tsx:456 | row.taskQueueSid | Task Queue SID (título visual, sem associação programática) | WQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | Task Queue SID de cada par dinâmico de roteamento | WQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| features/taskrouter/components/assign-workers-form.tsx:319 | workspaceSid | Workspace SID | WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | Workspace SID no qual a operação do formulário é executada | WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| features/taskrouter/components/assign-workers-form.tsx:352 | `skill-worker-${index}` | Worker 1 … Worker 10 (label dinâmica) | WK seguido de 32 caracteres ou e-mail do Worker | Identificador de cada Worker para atribuição de skill | WKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ou agente@exemplo.com |
| features/taskrouter/components/assign-workers-form.tsx:398 | skill | Nome da skill (fila) | ex: suporte-tecnico | Nome literal da skill a adicionar nos atributos de roteamento | suporte-tecnico |
| features/taskrouter/components/assign-workers-form.tsx:418 | level | Nível | ex: 5 | Nível numérico opcional da skill | 5 |
| features/taskrouter/components/cancel-queue-tasks-form.tsx:302 | workspaceSid | Workspace SID | WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | Workspace SID no qual a operação do formulário é executada | WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| features/taskrouter/components/cancel-queue-tasks-form.tsx:331 | taskQueueName | Nome da fila (Task Queue) | ex: SANTA_LUZIA_WHATSAPP | Nome literal da Task Queue cujas Tasks serão encerradas | SUPORTE_WHATSAPP |
| features/taskrouter/components/cancel-queue-tasks-form.tsx:348 | closeMessage | Mensagem enviada ao cliente antes de fechar | — | Mensagem editável enviada antes de encerrar a Conversation; já possui valor padrão | — |
| features/taskrouter/components/create-workflow-form.tsx:294 | workspaceSid | Workspace SID | WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | Workspace SID no qual a operação do formulário é executada | WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| features/taskrouter/components/create-workflow-form.tsx:316 | workflowName | Nome do Workflow | ex: Roteamento Principal | Nome do Workflow criado a partir do CSV | Roteamento principal |
| features/taskrouter/components/create-workflow-form.tsx:333 | csvFile | Arquivo CSV | — | Seleção de arquivo CSV por controle nativo de upload | — |
| features/taskrouter/components/fetch-worker-form.tsx:251 | workspaceSid | Workspace SID | WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | Workspace SID no qual a operação do formulário é executada | WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| features/taskrouter/components/fetch-worker-form.tsx:273 | identifier | Worker SID ou e-mail | WKxxxxx... ou agente@empresa.com | Consulta de Worker por SID, e-mail ou nome | WKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ou agente@exemplo.com |
| features/taskrouter/components/search-tasks-form.tsx:505 | workspaceSid | Workspace SID | WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | Workspace SID no qual a operação do formulário é executada | WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| features/taskrouter/components/search-tasks-form.tsx:535 | taskSid | Task SID | WTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | Consulta por Task SID | WTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| features/taskrouter/components/search-tasks-form.tsx:579 | phone | Número de telefone | +5511999999999 | Consulta de Tasks pelo telefone com DDI; normaliza + e whatsapp: | +5511999999999 |
| features/taskrouter/components/update-worker-feature-form.tsx:108 | feature-workspace | SID do Workspace | WS seguido de 32 caracteres hexadecimais | Workspace SID para configuração do plugin | WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| features/taskrouter/components/update-worker-feature-form.tsx:127 | `feature-worker-${index}` | Worker 1 … Worker 10 (label dinâmica) | WK seguido de 32 caracteres ou e-mail do Worker | Identificador de cada Worker para configuração do plugin | WKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ou agente@exemplo.com |
| features/taskrouter/components/update-worker-feature-form.tsx:167 | feature-name | Nome do plugin | dasa_cdc_integration | Chave literal do plugin em config_overrides.features | dasa_cdc_integration |
| features/taskrouter/components/update-worker-feature-form.tsx:181 | feature-enabled | Estado do plugin | — | Seleção do booleano enabled do plugin | — |
| features/taskrouter/components/worker-management-form.tsx:86 | worker-management-workspace | Workspace SID | WS seguido de 32 caracteres hexadecimais | Workspace SID compartilhado pelas abas de gerenciamento de Workers | WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| features/variables/components/variables-manager.tsx:116 | state.addValue | Valor (label visual, sem associação programática) | Digite o valor... | Inclusão de valor de autocomplete no grupo selecionado | Digite um valor |
| features/variables/components/variables-manager.tsx:156 | state.editValue | Sem label associada na edição | — | Edição de valor já salvo no grupo de autocomplete | — |

## Encaminhamento e cobertura

- components/contact-input.tsx:100: input encaminha placeholder via placeholder
- components/stored-input.tsx:85: input encaminha placeholder via placeholder
- components/stored-textarea.tsx:54: textarea encaminha placeholder via placeholder
- components/ui/input.tsx:7: input encaminha placeholder via ...props

Busca global por atributos literais e expressões, tipos de props, spreads, objetos/configurações, inputs nativos e wrappers. Não há combobox ou CommandInput adicional. Todos os placeholders não vazios resolvem para `lib/strings.ts`. Nenhum campo recebe placeholder novo.

## Alterações

- Campo: `common.placeholders.localPhone`
  - Antes: "1187654321"
  - Depois: "11999999999"
  - Motivo: Uniformizar DDD + número, sem duplicar o prefixo fixo +55
- Campo: `common.placeholders.closePhone`
  - Antes: "11987654321"
  - Depois: "11999999999"
  - Motivo: Uniformizar DDD + número, sem duplicar o prefixo fixo +55
- Campo: `common.placeholders.worker`
  - Antes: "WKxxxxx... ou agente@empresa.com"
  - Depois: "WKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ou agente@exemplo.com"
  - Motivo: Uniformizar os identificadores de Worker com SID completo e e-mail fictício
- Campo: `common.placeholders.queue`
  - Antes: "ex: SANTA_LUZIA_WHATSAPP"
  - Depois: "SUPORTE_WHATSAPP"
  - Motivo: Remover prefixos redundantes/reticências e apresentar exemplo ou instrução curta
- Campo: `common.placeholders.skill`
  - Antes: "ex: suporte-tecnico"
  - Depois: "suporte-tecnico"
  - Motivo: Remover prefixos redundantes/reticências e apresentar exemplo ou instrução curta
- Campo: `common.placeholders.level`
  - Antes: "ex: 5"
  - Depois: "5"
  - Motivo: Remover prefixos redundantes/reticências e apresentar exemplo ou instrução curta
- Campo: `common.placeholders.workflow`
  - Antes: "ex: Roteamento Principal"
  - Depois: "Roteamento principal"
  - Motivo: Remover prefixos redundantes/reticências e apresentar exemplo ou instrução curta
- Campo: `common.placeholders.webhook`
  - Antes: "https://example.com/webhook"
  - Depois: "https://exemplo.com/webhook"
  - Motivo: Usar URL fictícia no padrão solicitado
- Campo: `conversations.history.filters.contentPlaceholder`
  - Antes: "Digite um trecho da mensagem"
  - Depois: "Busque por conteúdo da mensagem"
  - Motivo: Uniformizar buscas com verbo no imperativo e indicar o conteúdo pesquisável
- Campo: `flex.createAddressConfig.studioFlowPlaceholder`
  - Antes: "Selecionar um Flow"
  - Depois: "FWxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  - Motivo: Mostrar o prefixo e o comprimento do SID aceito pelo campo
- Campo: `taskrouter.workerManagement.workspacePlaceholder`
  - Antes: "WS seguido de 32 caracteres hexadecimais"
  - Depois: "WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  - Motivo: Mostrar o prefixo e o comprimento do SID aceito pelo campo
- Campo: `taskrouter.updateWorkerFeature.workspacePlaceholder`
  - Antes: "WS seguido de 32 caracteres hexadecimais"
  - Depois: "WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  - Motivo: Mostrar o prefixo e o comprimento do SID aceito pelo campo
- Campo: `taskrouter.updateWorkerFeature.workersPlaceholder`
  - Antes: "WK seguido de 32 caracteres ou e-mail do Worker"
  - Depois: "WKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ou agente@exemplo.com"
  - Motivo: Uniformizar os identificadores de Worker com SID completo e e-mail fictício
- Campo: `taskrouter.assignWorkers.workerPlaceholder`
  - Antes: "WK seguido de 32 caracteres ou e-mail do Worker"
  - Depois: "WKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ou agente@exemplo.com"
  - Motivo: Uniformizar os identificadores de Worker com SID completo e e-mail fictício
- Campo: `taskrouter.addParticularFilter.filterNamePlaceholder`
  - Antes: "ex: PARTICULAR"
  - Depois: "PARTICULAR"
  - Motivo: Remover prefixos redundantes/reticências e apresentar exemplo ou instrução curta
- Campo: `contacts.input.namePlaceholder`
  - Antes: "Nome do contato"
  - Depois: "João Silva"
  - Motivo: Remover prefixos redundantes/reticências e apresentar exemplo ou instrução curta
- Campo: `contacts.form.namePlaceholder`
  - Antes: "ex: João Silva"
  - Depois: "João Silva"
  - Motivo: Remover prefixos redundantes/reticências e apresentar exemplo ou instrução curta
- Campo: `contacts.form.phonePlaceholder`
  - Antes: "ex: 1187654321"
  - Depois: "11999999999"
  - Motivo: Uniformizar DDD + número, sem duplicar o prefixo fixo +55
- Campo: `variables.manager.valuePlaceholder`
  - Antes: "Digite o valor..."
  - Depois: "Digite um valor"
  - Motivo: Remover prefixos redundantes/reticências e apresentar exemplo ou instrução curta
- Campo: `environments.form.namePlaceholder`
  - Antes: "ex: Produção, Homologação"
  - Depois: "Homologação"
  - Motivo: Remover prefixos redundantes/reticências e apresentar exemplo ou instrução curta
- Campo: `numbers.list.table.searchPlaceholder`
  - Antes: "Buscar por nome ou número..."
  - Depois: "Busque por nome ou número"
  - Motivo: Uniformizar buscas com verbo no imperativo e indicar o conteúdo pesquisável

## Convenção adotada

- Instruções em pt-BR, frase natural iniciada com maiúscula, sem ponto final, reticências ou prefixo “ex:”.
- Buscas começam com “Busque por” e indicam somente os campos efetivamente filtrados: corpo da mensagem; nome ou número do Sender.
- SIDs usam prefixo específico e 32 caracteres “x”: AC, WS, WW, WQ, WT, WK, CH e FW. Conferidos nas validações, no resolver de Workers, nos payloads e no hint existente do Studio Flow. Os “x” demonstram formato; não são SIDs válidos para submissão.
- Telefones mostram o mesmo número: +5511999999999 com DDI e 11999999999 para DDD + número. Nos formulários de Conversations, whatsapp:+55 já aparece como prefixo fixo e não deve ser repetido. Contatos validam apenas preenchimento, mas sua label define DDD + número. A consulta de Tasks normaliza números com/sem + e prefixo whatsapp:. O Flex encaminha o Address; não foi adicionada validação E.164.
- URLs e e-mails usam exemplo.com, conforme o padrão fictício solicitado.
- JSON: não há campo de entrada de JSON com placeholder neste projeto; atributos são exibidos em blocos de leitura. Nenhum exemplo ou estrutura JSON foi criado ou alterado.
- Terminologia Twilio preservada. Identificadores literais de skill, regra, fila e plugin mantêm a capitalização apropriada ao exemplo.

## Mantidos

Os 15 campos mantidos incluem seis Workspaces já no formato WS + 32 x; Account SID (AC), Workflow SID (WW), Task Queue SID (WQ), Task SID (WT), Conversation SID (CH), dois campos de telefone com DDI, o Auth Token e a chave de plugin.

- "+5511999999999" foi preservado na consulta de Tasks e no Address do Flex para WhatsApp/SMS. A diferença em relação ao exemplo nacional é intencional: representa o mesmo telefone com DDI.
- "32 caracteres" foi preservado para Auth Token: descreve o comprimento aceito sem sugerir um segredo fictício.
- "dasa_cdc_integration" foi preservado: é um exemplo técnico de chave literal de plugin, não uma instrução em inglês nem um nome que deva ser traduzido.
- Os 11 campos sem placeholder permanecem assim: cinco selects com opções/seleção suficientes (autor, canal, integração, método HTTP e estado do plugin); duas datas com controle especializado; nome amigável opcional suficientemente definido pela label; upload de CSV nativo; mensagem de encerramento já preenchida; edição de variável já preenchida.
- As variantes não WhatsApp/SMS do Address permanecem com placeholder vazio. A label muda para o identificador específico do canal. Não foi introduzido exemplo de formato sem contrato local que o confirme.

## Achados fora do escopo

- A busca de Senders em features/numbers/components/list-numbers-form.tsx:328 não tem label associada nem aria-label. O placeholder continua sendo apenas uma orientação.
- A inclusão de variável em features/variables/components/variables-manager.tsx:114 tem Label visual sem htmlFor/id; a edição em :156 não tem label associada.
- As colunas Workflow SID e Task Queue SID em features/taskrouter/components/add-particular-filter-form.tsx:422 e :425 têm Label visual sem vínculo aos inputs dinâmicos em :437 e :456.
- O grupo de telefones de encerramento em features/conversations/components/close-form.tsx:282 tem Label visual sem vínculo individual aos ContactInputs dinâmicos em :292.
- O resolver de Workers também aceita nome, enquanto as labels e os exemplos focam SID/e-mail. As labels e hints foram preservados por estarem fora do escopo.
- O exemplo completo de Worker com alternativa de e-mail tem 55 caracteres e pode aparecer parcialmente em campos estreitos. Foi preservada a alternativa aceita nos três formulários, sem abreviar o SID com reticências. Não foi alterado layout.

## Validação

- npm run typecheck: passou, sem erros.
- npm test: 94 testes passaram; zero falhas, cancelamentos ou skips. Este checkout tem 94 testes, diferente dos 103 informados no pedido.
- npm run lint: 17 erros preexistentes e 0 warnings. A execução anterior às alterações já tinha 17 erros, diferente dos 15 informados. Comparação dos JSONs de ESLint confirmou igualdade de arquivo, regra, severidade, linha, coluna e mensagem de todos os diagnósticos. Nenhum erro foi corrigido nesta rodada.
- npm run build: passou, 42/42 páginas. A primeira tentativa falhou por restrição de rede ao baixar Geist/Geist Mono; a repetição autorizada com acesso à rede concluiu sem warnings.
- git diff --check: passou.
- Segunda passagem textual: capitalização, imperativo nas buscas, ausência de pontuação decorativa, consistência transversal de SIDs, telefones, URLs e nomes de contato conferidas. Todos os exemplos de SID têm 34 caracteres.
- Revisão integral do diff produtivo e comparação automatizada dos arquivos antes/depois, substituindo somente os 21 valores inventariados por um marcador comum: conteúdo restante idêntico. Cada constante alterada tem consumidor de placeholder no inventário.
- Não há teste de navegador/inspeção visual executado nesta rodada. A revisão de labels e variantes condicionais foi feita no código; as suítes existentes usam mocks e não fazem operações reais no Twilio.

## Diff exclusivo desta rodada

O checkout estava limpo antes da auditoria. O diff produtivo altera apenas lib/strings.ts; o arquivo novo documenta o inventário e os resultados solicitados. Não foram alterados handlers, validação, estado, defaults, persistência, autocomplete, labels, descriptions, mensagens de operação, componentes ou estilos. Nenhuma alteração funcional foi introduzida.

```text
 lib/strings.ts                 | 42 +++++++++++++++++++++---------------------
 docs/auditoria-placeholders.md | 208 + (arquivo novo)
 2 files changed, 229 insertions(+), 21 deletions(-)
```
