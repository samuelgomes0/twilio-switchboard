# Auditoria de centralização de textos

Data: 10/09/2026. Escopo: diagnóstico, sem alterações na aplicação.

Registro histórico anterior às correções. O resultado após os ajustes está em [Reauditoria de textos](reauditoria-textos-hardcoded.md). As linhas e pendências abaixo descrevem a versão original, não o estado atual.

## Resultado

Há textos de apresentação fora de `lib/strings.ts`: componentes compartilhados, placeholders de formulários, acessibilidade, rótulos de autocomplete, exportações, validações de API e mensagens SSE. A centralização está bem adotada nas páginas, navegação por domínio e funcionalidades recentes, mas ainda não cobre o sistema inteiro.

## Método e limites

Foram pesquisados os 136 arquivos TypeScript/TSX em `app/`, `components/`, `features/` e `lib/`, além do manifesto público. A busca incluiu literais, templates, JSX, atributos, metadados, configurações, exportações e caminhos de propagação de erros. Os candidatos abaixo foram classificados pelo contexto e pelo consumidor. Referências usam as linhas do código no momento da auditoria; cada linha da tabela é um ponto de origem, podendo conter mais de um texto.

A análise foi estática, com buscas por `rg` e leitura contextual. Não houve execução no navegador nem chamadas ao Twilio. A tentativa de usar o parser TypeScript não prosseguiu porque `node` não está disponível. Este inventário não é uma prova automatizada de ausência de outras ocorrências.

`npm run typecheck`, `npm run lint` e `npm run build` foram tentados; os três ficaram impedidos porque `npm` não foi reconhecido no terminal. Nenhum teste foi declarado aprovado. Não foram instaladas dependências nem alterados componentes, rotas, credenciais ou persistência.

## Prioridades e destino das mensagens

- **P1:** mensagens de operações, erros e validações. Centralizar mensagens próprias e substituir erros externos por mensagens seguras; manter os parâmetros dinâmicos tipados.
- **P2:** textos de componentes, acessibilidade, placeholders, autocomplete e exportação.
- **P3:** formatos de duração e nomes de arquivos; documentar a política para notação técnica de apresentação.

Os caminhos sugeridos abaixo são propostas para `lib/strings.ts`, não chaves já implementadas, exceto quando marcados como existentes. Não se deve criar uma chave por linha: mensagens semanticamente iguais devem compartilhar a chave.

| Grupo | Destino proposto |
| --- | --- |
| Autocomplete compartilhado | `strings.common.autocomplete.saveValue(value)`, `saveMessage`; `strings.common.remove` já existe |
| Contatos | `strings.contacts.input.saveContact(value)`, `removeContact`, `namePlaceholder`; `strings.contacts.manager.editTitle` já contém “Editar contato”; adicionar `deleteAriaLabel` |
| Variáveis | `strings.variables.manager.editAriaLabel`, `deleteAriaLabel`; `strings.variables.groups.<grupo>` para ambos os registros |
| Navegação | `strings.sidebar.navigationAriaLabel` |
| Token | Reutilizar `strings.environments.form.hideTokenAriaLabel` e `showTokenAriaLabel` |
| Placeholders | `strings.common.placeholders.workspaceSid`, `accountSid`, `workflowSid`, `taskQueueSid`, `taskSid`, `phone`; exemplos específicos sob o respectivo domínio |
| Exportações de números | `strings.numbers.list.table.colSid`, `sheetName`; mapear serviços para os rótulos já existentes |
| Erros compartilhados | `strings.common.errors.<tipo>` e `strings.common.errors.retry.<tipo>`; “Erro desconhecido” já está em `strings.common.unknown` |
| Validação de rotas | `strings.common.validation.invalidBody`, `requiredField(fieldLabel)` e mensagens específicas no domínio |
| SSE | `strings.<dominio>.<operacao>.log.<evento>(parametros)`; retry compartilhado em `strings.common.retry` |
| Mensagem padrão de encerramento | `strings.taskrouter.cancelQueueTasks.defaultCloseMessage` |
| Duração e arquivo | `strings.taskrouter.searchTasks.duration.<formato>`; `strings.conversations.history.export.filename(sid)` |

## Inventário de componentes e apresentação (P2, salvo indicação)

A coluna “Origem” transcreve o trecho exato para facilitar a revisão, incluindo sintaxe quando necessário.

| Arquivo:linha | Origem |
| --- | --- |
| components/contact-input.tsx:134 | <code>aria-label="Remover contato"</code> |
| components/contact-input.tsx:158 | <code>Salvar &ldquo;{trimmed}&rdquo; como contato</code> |
| components/contact-input.tsx:180 | <code>placeholder="Nome do contato"</code> |
| components/stored-input.tsx:165 | <code>+ Salvar &ldquo;{trimmed}&rdquo;</code> |
| components/stored-textarea.tsx:103 | <code>aria-label="Remover"</code> |
| components/stored-textarea.tsx:118 | <code>+ Salvar mensagem atual</code> |
| components/sidebar-nav.tsx:259 | <code>aria-label="Navegação principal"</code> |
| features/contacts/components/contacts-manager.tsx:255 | <code>aria-label="Editar contato"</code> |
| features/contacts/components/contacts-manager.tsx:267 | <code>aria-label="Excluir contato"</code> |
| features/variables/components/variables-manager.tsx:221 | <code>aria-label="Editar"</code> |
| features/variables/components/variables-manager.tsx:236 | <code>aria-label="Excluir"</code> |
| features/environments/components/masked-token.tsx:17 | <code>aria-label={visible ? "Ocultar token" : "Revelar token"}</code> |
| features/environments/components/environment-form.tsx:159 | <code>placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"</code> |
| features/conversations/components/close-form.tsx:336 | <code>placeholder="11987654321"</code> |
| features/conversations/components/fetch-by-participant-form.tsx:329 | <code>placeholder="1187654321"</code> |
| features/taskrouter/components/assign-workers-form.tsx:367 | <code>placeholder="WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"</code> |
| features/taskrouter/components/assign-workers-form.tsx:438 | <code>placeholder="ex: suporte-tecnico"</code> |
| features/taskrouter/components/assign-workers-form.tsx:455 | <code>placeholder="ex: 5"</code> |
| features/taskrouter/components/cancel-queue-tasks-form.tsx:349 | <code>placeholder="WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"</code> |
| features/taskrouter/components/cancel-queue-tasks-form.tsx:370 | <code>placeholder="ex: SANTA_LUZIA_WHATSAPP"</code> |
| features/taskrouter/components/create-workflow-form.tsx:337 | <code>placeholder="WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"</code> |
| features/taskrouter/components/create-workflow-form.tsx:356 | <code>placeholder="ex: Roteamento Principal"</code> |
| features/taskrouter/components/add-particular-filter-form.tsx:422 | <code>placeholder="WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"</code> |
| features/taskrouter/components/add-particular-filter-form.tsx:476 | <code>placeholder="WWxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"</code> |
| features/taskrouter/components/add-particular-filter-form.tsx:495 | <code>placeholder="WQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"</code> |
| features/taskrouter/components/fetch-worker-form.tsx:305 | <code>placeholder="WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"</code> |
| features/taskrouter/components/fetch-worker-form.tsx:324 | <code>placeholder="WKxxxxx... ou agente@empresa.com"</code> |
| features/taskrouter/components/search-tasks-form.tsx:578 | <code>placeholder="WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"</code> |
| features/taskrouter/components/search-tasks-form.tsx:606 | <code>placeholder="WTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"</code> |
| features/taskrouter/components/search-tasks-form.tsx:642 | <code>placeholder="+5511999999999"</code> |
| features/flex/components/create-address-config-form.tsx:328 | <code>? "+5511999999999"</code> |
| features/flex/components/create-address-config-form.tsx:421 | <code>placeholder="https://example.com/webhook"</code> |
| features/flex/components/create-address-config-form.tsx:436 | <code>&lt;option value="POST"&gt;POST&lt;/option&gt;</code> |
| features/flex/components/create-address-config-form.tsx:437 | <code>&lt;option value="GET"&gt;GET&lt;/option&gt;</code> |
| features/numbers/components/list-numbers-form.tsx:119 | <code>"SID",</code> |
| features/numbers/components/list-numbers-form.tsx:143 | <code>SID: r.id,</code> |
| features/numbers/components/list-numbers-form.tsx:147 | <code>XLSX.utils.book_append_sheet(wb, ws, "Senders")</code> |
| lib/stored-keys.ts:17 | <code>workspaceSids: "Workspace SIDs",</code> |
| lib/stored-keys.ts:18 | <code>queueNames: "Filas (Task Queue)",</code> |
| lib/stored-keys.ts:19 | <code>skillNames: "Skills",</code> |
| lib/stored-keys.ts:20 | <code>workflowNames: "Workflows",</code> |
| lib/stored-keys.ts:21 | <code>workerIdentifiers: "Workers",</code> |
| lib/stored-keys.ts:22 | <code>conversationSids: "Conversation SIDs",</code> |
| lib/stored-keys.ts:23 | <code>closeMessages: "Mensagens de encerramento",</code> |
| lib/stored-keys.ts:24 | <code>flexAddresses: "Endereços Flex",</code> |
| lib/stored-keys.ts:25 | <code>conversationServiceSids: "Conversation Service SIDs",</code> |
| lib/stored-keys.ts:26 | <code>studioFlowSids: "Studio Flow SIDs",</code> |
| lib/variables.ts:74 | <code>{ key: STORED_KEYS.workspaceSids, label: "Workspace SIDs" },</code> |
| lib/variables.ts:75 | <code>{ key: STORED_KEYS.queueNames, label: "Filas (Task Queue)" },</code> |
| lib/variables.ts:76 | <code>{ key: STORED_KEYS.skillNames, label: "Skills" },</code> |
| lib/variables.ts:77 | <code>{ key: STORED_KEYS.workflowNames, label: "Workflows" },</code> |
| lib/variables.ts:78 | <code>{ key: STORED_KEYS.workerIdentifiers, label: "Workers" },</code> |
| lib/variables.ts:79 | <code>{ key: STORED_KEYS.conversationSids, label: "Conversation SIDs" },</code> |
| lib/variables.ts:80 | <code>{ key: STORED_KEYS.closeMessages, label: "Mensagens de encerramento" },</code> |
`POST` e `GET` são valores do protocolo e devem permanecer assim em `value`; apenas os rótulos visíveis devem referenciar o catálogo, preservando a grafia técnica. Exemplos de SID, telefone e URL em placeholders são texto de apresentação, embora tenham formato técnico.

Os sete rótulos de `VARIABLE_GROUPS` repetem os sete primeiros de `STORED_KEY_LABELS`. O primeiro alimenta a página de variáveis (`variables-manager.tsx:309`), e o segundo os cartões de ambientes (`environment-card.tsx:19`). Manter as chaves de armazenamento e centralizar somente os rótulos.

## Inventário de API, mensagens SSE e erros (P1)

As mensagens JSON chegam aos formulários por `json.error`; as SSE por `payload.message` e `LogOutput`. Os rótulos passados a `withRetry` também aparecem nos logs e precisam ser centralizados.

| Arquivo:linha | Origem |
| --- | --- |
| lib/errors.ts:54 | <code>return new AppError("auth", "Credenciais inválidas ou sem permissão.", {</code> |
| lib/errors.ts:58 | <code>return new AppError("not_found", "Recurso não encontrado.", {</code> |
| lib/errors.ts:62 | <code>return new AppError("conflict", "Recurso já existe.", { cause: err })</code> |
| lib/errors.ts:64 | <code>return new AppError("validation", "Parâmetros inválidos.", { cause: err })</code> |
| lib/errors.ts:68 | <code>"Erro na API do Twilio. Tente novamente.",</code> |
| lib/errors.ts:79 | <code>return Response.json({ error: "Erro interno do servidor." }, { status: 500 })</code> |
| lib/errors.ts:89 | <code>return "credenciais inválidas ou sem permissão"</code> |
| lib/errors.ts:91 | <code>return "recurso não encontrado"</code> |
| lib/errors.ts:93 | <code>return "limite de requisições excedido"</code> |
| lib/errors.ts:96 | <code>? &#96;erro HTTP ${status}&#96;</code> |
| lib/errors.ts:97 | <code>: "erro na API do Twilio"</code> |
| lib/twilio-client.ts:11 | <code>"Credenciais não configuradas. Selecione um ambiente."</code> |
| app/api/environments/verify/route.ts:10 | <code>return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })</code> |
| app/api/numbers/list/route.ts:11 | <code>return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })</code> |
| app/api/flex/create-address-config/route.ts:11 | <code>return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })</code> |
| app/api/flex/create-address-config/route.ts:18 | <code>return Response.json({ error: "O campo 'address' é obrigatório" }, { status: 400 })</code> |
| app/api/flex/create-address-config/route.ts:21 | <code>return Response.json({ error: "O campo 'type' é obrigatório" }, { status: 400 })</code> |
| app/api/flex/create-address-config/route.ts:46 | <code>{ error: &#96;Endereço já configurado: ${address}&#96; },</code> |
| app/api/conversations/fetch-by-participant/route.ts:17 | <code>{ error: "Corpo da requisição inválido" },</code> |
| app/api/conversations/fetch-by-participant/route.ts:26 | <code>{ error: "O campo 'address' é obrigatório" },</code> |
| app/api/conversations/fetch-by-participant/route.ts:37 | <code>return Response.json({ error: "Token de página inválido" }, { status: 400 })</code> |
| app/api/conversations/fetch-by-participant/route.ts:45 | <code>{ error: "Credenciais em formato inválido" },</code> |
| app/api/conversations/close/route.ts:14 | <code>return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })</code> |
| app/api/conversations/close/route.ts:20 | <code>{ error: "O campo 'participants' deve ser um array não vazio" },</code> |
| app/api/conversations/close/route.ts:31 | <code>{ error: "Nenhum participante válido informado" },</code> |
| app/api/conversations/close/route.ts:53 | <code>&#96;Iniciando processamento de ${participants.length} número(s)...&#96;</code> |
| app/api/conversations/close/route.ts:66 | <code>&#96;Concluído. ${totalClosed} conversa(s) fechada(s), ${totalErrors} erro(s).&#96;,</code> |
| app/api/taskrouter/assign-workers/route.ts:22 | <code>{ error: "Corpo da requisição inválido" },</code> |
| app/api/taskrouter/assign-workers/route.ts:29 | <code>{ error: "O campo 'workspaceSid' é obrigatório" },</code> |
| app/api/taskrouter/assign-workers/route.ts:36 | <code>{ error: "O campo 'skill' é obrigatório" },</code> |
| app/api/taskrouter/assign-workers/route.ts:51 | <code>{ error: &#96;Informe entre 1 e ${MAX_ITEMS} Workers válidos&#96; },</code> |
| app/api/taskrouter/assign-workers/route.ts:80 | <code>&#96;Iniciando processamento de ${emails.length} worker(s)...&#96;</code> |
| app/api/taskrouter/assign-workers/route.ts:101 | <code>&#96;Concluído. ${totalUpdated} worker(s) atualizado(s), ${totalSkipped} ignorado(s), ${totalErrors} erro(s).&#96;,</code> |
| app/api/taskrouter/cancel-queue-tasks/route.ts:19 | <code>return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })</code> |
| app/api/taskrouter/cancel-queue-tasks/route.ts:24 | <code>{ error: "O campo 'workspaceSid' é obrigatório" },</code> |
| app/api/taskrouter/cancel-queue-tasks/route.ts:31 | <code>{ error: "O campo 'taskQueueName' é obrigatório" },</code> |
| app/api/taskrouter/cancel-queue-tasks/route.ts:69 | <code>&#96;Concluído. ${totalSuccess} cancelada(s), ${totalSkipped} ignorada(s), ${totalErrors} erro(s).&#96;,</code> |
| app/api/taskrouter/create-workflow/route.ts:19 | <code>return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })</code> |
| app/api/taskrouter/create-workflow/route.ts:24 | <code>{ error: "O campo 'workspaceSid' é obrigatório" },</code> |
| app/api/taskrouter/create-workflow/route.ts:31 | <code>{ error: "O campo 'workflowName' é obrigatório" },</code> |
| app/api/taskrouter/create-workflow/route.ts:38 | <code>{ error: "O campo 'csvContent' é obrigatório" },</code> |
| app/api/taskrouter/create-workflow/route.ts:74 | <code>&#96;Concluído. Workflow "${workflowName}" criado com ${totalFilters} filtro(s).&#96;,</code> |
| app/api/taskrouter/create-workflow/route.ts:89 | <code>: "Erro inesperado ao criar workflow."</code> |
| app/api/taskrouter/add-particular-filter/route.ts:20 | <code>return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })</code> |
| app/api/taskrouter/add-particular-filter/route.ts:25 | <code>{ error: "O campo 'workspaceSid' é obrigatório" },</code> |
| app/api/taskrouter/add-particular-filter/route.ts:32 | <code>{ error: "O campo 'filterName' é obrigatório" },</code> |
| app/api/taskrouter/add-particular-filter/route.ts:39 | <code>{ error: "O campo 'entries' deve ser um array não-vazio" },</code> |
| app/api/taskrouter/add-particular-filter/route.ts:54 | <code>"Cada entrada deve conter 'workflowSid' e 'taskQueueSid' como strings",</code> |
| app/api/taskrouter/add-particular-filter/route.ts:96 | <code>&#96;Concluído. ${totalAdded} adicionado(s), ${totalSkipped} ignorado(s), ${totalErrors} erro(s).&#96;,</code> |
| app/api/taskrouter/add-particular-filter/route.ts:113 | <code>: "Erro inesperado ao processar filtros."</code> |
| app/api/taskrouter/fetch-worker/route.ts:16 | <code>return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })</code> |
| app/api/taskrouter/fetch-worker/route.ts:26 | <code>{ error: "O campo 'workspaceSid' é obrigatório" },</code> |
| app/api/taskrouter/fetch-worker/route.ts:33 | <code>{ error: "O campo 'identifier' é obrigatório" },</code> |
| app/api/taskrouter/fetch-worker/route.ts:49 | <code>{ error: &#96;Worker não encontrado: ${identifier}&#96; },</code> |
| app/api/taskrouter/fetch-worker/route.ts:58 | <code>{ error: &#96;Worker não encontrado: ${identifier}&#96; },</code> |
| app/api/taskrouter/fetch-task/route.ts:16 | <code>return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })</code> |
| app/api/taskrouter/fetch-task/route.ts:25 | <code>{ error: "O campo 'workspaceSid' é obrigatório" },</code> |
| app/api/taskrouter/fetch-task/route.ts:32 | <code>{ error: "O campo 'taskSid' é obrigatório" },</code> |
| app/api/taskrouter/fetch-task/route.ts:39 | <code>{ error: "Task SID inválido. Formato esperado: WT + 32 caracteres hex" },</code> |
| app/api/taskrouter/fetch-task/route.ts:57 | <code>return Response.json({ error: &#96;Task não encontrada: ${taskSid}&#96; }, { status: 404 })</code> |
| app/api/taskrouter/search-tasks/route.ts:16 | <code>return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })</code> |
| app/api/taskrouter/search-tasks/route.ts:26 | <code>{ error: "O campo 'workspaceSid' é obrigatório" },</code> |
| app/api/taskrouter/search-tasks/route.ts:33 | <code>{ error: "O campo 'phoneNumber' é obrigatório" },</code> |
| app/api/taskrouter/search-tasks/route.ts:40 | <code>{ error: "Workspace SID inválido. Formato esperado: WS + 32 caracteres hex" },</code> |
| app/api/taskrouter/search-tasks/route.ts:59 | <code>{ error: &#96;Workspace não encontrado: ${workspaceSid}&#96; },</code> |
| features/conversations/lib/close.ts:34 | <code>&#96;${label}: tentativa ${attempt} falhou: ${safeMessage}. Tentando novamente...&#96;</code> |
| features/conversations/lib/close.ts:46 | <code>&#96;${label}: falhou após ${attempts} tentativas: ${safeMessage}&#96;</code> |
| features/conversations/lib/close.ts:73 | <code>sseEvent("info", &#96;Buscando conversas para ${address}...&#96;, {</code> |
| features/conversations/lib/close.ts:86 | <code>&#96;Busca de conversas (${address})&#96;,</code> |
| features/conversations/lib/close.ts:99 | <code>sseEvent("warning", &#96;Nenhuma conversa ativa encontrada para ${address}&#96;)</code> |
| features/conversations/lib/close.ts:107 | <code>&#96;${active.length} conversa(s) ativa(s) encontrada(s) para ${address}&#96;</code> |
| features/conversations/lib/close.ts:120 | <code>&#96;Fechar conversa ${sid}&#96;,</code> |
| features/conversations/lib/close.ts:126 | <code>emit(sseEvent("success", &#96;Conversa ${sid} fechada com sucesso&#96;))</code> |
| features/taskrouter/lib/assign-workers.ts:56 | <code>sseEvent("info", &#96;Buscando worker: ${identifier}...&#96;, {</code> |
| features/taskrouter/lib/assign-workers.ts:65 | <code>&#96;Busca de worker (${identifier})&#96;,</code> |
| features/taskrouter/lib/assign-workers.ts:75 | <code>emit(sseEvent("warning", &#96;Worker não encontrado: ${identifier}&#96;))</code> |
| features/taskrouter/lib/assign-workers.ts:83 | <code>&#96;Worker encontrado: ${worker.sid}. Adicionando skill "${input.skill}"...&#96;</code> |
| features/taskrouter/lib/assign-workers.ts:99 | <code>&#96;Atualizar worker ${worker.sid}&#96;,</code> |
| features/taskrouter/lib/assign-workers.ts:108 | <code>&#96;Skill "${input.skill}" adicionada ao worker ${identifier} (${worker.sid})&#96;</code> |
| features/taskrouter/lib/add-particular-filter.ts:65 | <code>emit(sseEvent("info", &#96;Processando workflow ${workflowSid}...&#96;))</code> |
| features/taskrouter/lib/add-particular-filter.ts:81 | <code>&#96;Workflow ${workflowSid} não possui configuração de roteamento válida.&#96;</code> |
| features/taskrouter/lib/add-particular-filter.ts:101 | <code>&#96;Filtro "${input.filterName}" já existe no workflow ${workflowSid}. Ignorado.&#96;</code> |
| features/taskrouter/lib/add-particular-filter.ts:119 | <code>&#96;Filtro "${input.filterName}" adicionado ao workflow ${workflowSid}.&#96;</code> |
| features/taskrouter/lib/add-particular-filter.ts:125 | <code>err instanceof Error ? err.message : "Erro desconhecido"</code> |
| features/taskrouter/lib/add-particular-filter.ts:129 | <code>&#96;Erro ao processar workflow ${workflowSid}: ${message}&#96;</code> |
| features/taskrouter/lib/create-workflow.ts:47 | <code>'Colunas "Regra de Negócio" e "Fila Twilio" não encontradas no CSV.'</code> |
| features/taskrouter/lib/create-workflow.ts:84 | <code>emit(sseEvent("info", "Carregando filas do workspace..."))</code> |
| features/taskrouter/lib/create-workflow.ts:95 | <code>emit(sseEvent("info", &#96;${queues.length} fila(s) carregada(s).&#96;))</code> |
| features/taskrouter/lib/create-workflow.ts:102 | <code>&#96;Fila "${DEFAULT_QUEUE_NAME}" não encontrada. Workflow será criado sem filtro padrão.&#96;</code> |
| features/taskrouter/lib/create-workflow.ts:113 | <code>throw new Error(&#96;Fila não encontrada no workspace: ${fila}&#96;)</code> |
| features/taskrouter/lib/create-workflow.ts:115 | <code>emit(sseEvent("info", &#96;Filtro: ${regra} → ${fila} (${queueSid})&#96;))</code> |
| features/taskrouter/lib/create-workflow.ts:123 | <code>emit(sseEvent("info", &#96;Criando workflow '${input.workflowName}'...&#96;))</code> |
| features/taskrouter/lib/create-workflow.ts:146 | <code>&#96;Workflow criado: ${workflow.friendlyName} &#124; SID: ${workflow.sid}&#96;</code> |
| features/taskrouter/lib/cancel-queue-tasks.ts:19 | <code>"Infelizmente tivemos um problema com a nossa conversa e ela precisará ser reiniciada. Por favor, envie uma nova mensagem."</code> |
| features/taskrouter/lib/cancel-queue-tasks.ts:90 | <code>reason: &#96;Limpeza em massa da fila ${taskQueueName}&#96;,</code> |
| features/taskrouter/lib/cancel-queue-tasks.ts:94 | <code>&#96;Cancelar task ${task.sid}&#96;,</code> |
| features/taskrouter/lib/cancel-queue-tasks.ts:104 | <code>&#96;Task ${task.sid}: cancelada (sem conversa associada)&#96;</code> |
| features/taskrouter/lib/cancel-queue-tasks.ts:118 | <code>&#96;Enviar mensagem para conversa ${conversationSid}&#96;,</code> |
| features/taskrouter/lib/cancel-queue-tasks.ts:125 | <code>&#96;Task ${task.sid}: cancelada, mas falha ao enviar mensagem para ${conversationSid}&#96;</code> |
| features/taskrouter/lib/cancel-queue-tasks.ts:138 | <code>&#96;Fechar conversa ${conversationSid}&#96;,</code> |
| features/taskrouter/lib/cancel-queue-tasks.ts:145 | <code>&#96;Task ${task.sid}: cancelada, mas falha ao fechar conversa ${conversationSid}&#96;</code> |
| features/taskrouter/lib/cancel-queue-tasks.ts:152 | <code>&#96;Task ${task.sid}: cancelada, mensagem enviada, conversa fechada (${status} → canceled)&#96;</code> |
| features/taskrouter/lib/cancel-queue-tasks.ts:179 | <code>emit(sseEvent("info", &#96;Buscando tasks da fila "${taskQueueName}"...&#96;))</code> |
| features/taskrouter/lib/cancel-queue-tasks.ts:189 | <code>&#96;Listar tasks da fila ${taskQueueName}&#96;,</code> |
| features/taskrouter/lib/cancel-queue-tasks.ts:208 | <code>&#96;${tasks.length} task(s) encontrada(s). Elegíveis: ${cancellableTasks.length} · ignoradas: ${ignoredCount}&#96;</code> |
| features/taskrouter/lib/cancel-queue-tasks.ts:230 | <code>sseEvent("info", &#96;Progresso: ${processed}/${cancellableTasks.length}&#96;, {</code> |
A mensagem padrão em `cancel-queue-tasks.ts:19` preenche o formulário (`cancel-queue-tasks-form.tsx:102`) e pode ser enviada ao participante da conversa. O motivo em `:90` é gravado no Twilio como texto da operação. A migração deve preservar ambos literalmente. O componente importa hoje essa constante do módulo de negócio; movê-la para o catálogo também elimina essa dependência específica do cliente sobre o módulo servidor, sem necessidade de reorganizar outros módulos.

## Textos externos e dados usados como apresentação

Estes casos são distintos dos literais: centralizar o código existente não impede mensagens externas na interface.

| Arquivo:linha | Problema | Encaminhamento |
| --- | --- | --- |
| `features/taskrouter/lib/add-particular-filter.ts:125` | `err.message` interpolado no evento SSE | Mensagem segura centralizada; não repassar a exceção externa |
| `app/api/taskrouter/add-particular-filter/route.ts:112` | Exceção não Twilio enviada ao SSE | Mensagem genérica centralizada |
| `app/api/taskrouter/create-workflow/route.ts:88` | Exceção não Twilio enviada ao SSE, incluindo erros de parsing | Distinguir validações próprias de exceções inesperadas |
| `features/conversations/components/close-form.tsx:234` | Erro de execução exibido diretamente | `strings.common.unexpectedError` |
| `features/taskrouter/components/assign-workers-form.tsx:265` | Idem | `strings.common.unexpectedError` |
| `features/taskrouter/components/cancel-queue-tasks-form.tsx:250` | Idem | `strings.common.unexpectedError` |
| `features/taskrouter/components/create-workflow-form.tsx:248` | Idem | `strings.common.unexpectedError` |
| `features/taskrouter/components/add-particular-filter-form.tsx:344` | Idem | `strings.common.unexpectedError` |
| `features/conversations/components/fetch-by-participant-form.tsx:180,213` | Erro externo de busca/paginação | `strings.common.networkError` ou mensagem do domínio |
| `features/taskrouter/components/fetch-worker-form.tsx:209` | Erro externo | Idem |
| `features/taskrouter/components/search-tasks-form.tsx:433` | Erro externo | Idem |
| `features/numbers/components/list-numbers-form.tsx:107` | Erro externo | Idem |
| `features/flex/components/create-address-config-form.tsx:217` | Erro externo | Idem |
| `features/environments/components/environment-form.tsx:132` | Erro externo ao testar ambiente | `strings.environments.form.testError` |

`json.error` não é por si só uma violação: pode transportar texto já centralizado no servidor. É necessário corrigir a origem, preservando o contrato de resposta. Mensagens de usuários, nomes de recursos e atributos retornados pelo Twilio são dados, não devem ser copiados para o catálogo.

Em Numbers, os valores de serviço `Conversations`/`Programmable Chat` são gerados pela aplicação (`features/numbers/lib/list-numbers.ts:37,52`) e também exibidos/exportados como dados. Preservar a união de tipos e os filtros; usar os rótulos existentes `strings.numbers.list.table.filterConversations` e `filterPchat` na apresentação e exportação, se a regra exigir centralização também dos nomes técnicos.

## Idioma, duplicações e formatos

- `lib/strings.ts:44`: `strings.sidebar.toggleLabel` contém “Toggle sidebar”. Já está centralizado, mas deve ser traduzido para “Alternar navegação lateral”.
- “Editar contato” já existe em `strings.contacts.manager.editTitle`; os textos de mostrar/ocultar token já existem em `strings.environments.form`; “Remover” já existe em `strings.common.remove`; “Erro desconhecido” já existe em `strings.common.unknown`.
- `lib/strings.ts` repete rótulos como “Limpar”, “Salvar”, “Últimas consultas”, “Sem nome amigável” e validações de Conversation SID. Isso não quebra a centralização física; consolidar apenas duplicações com a mesma finalidade, evitando acoplar títulos específicos de telas diferentes.
- `features/taskrouter/components/search-tasks-form.tsx:115,118,120`: templates de duração (`s`, `m`, `h`) definidos no componente. P3: mover os formatos para funções no catálogo, mantendo o cálculo no componente/utilitário.
- `features/conversations/lib/export-messages.ts:30`: nome de download `conversation-${sid}.csv` fora do catálogo. P3: centralizar o template se o nome do arquivo faz parte da regra de apresentação; a extensão é técnica.
- `components/log-output.tsx:37` usa locale `en-US` com relógio de 24 horas. Locale é configuração, não um texto hardcoded; padronizar para pt-BR pode ser avaliado separadamente.

## Exclusões revisadas

Não mover rotas, imports, classes Tailwind, IDs, chaves de armazenamento, MIME types, cabeçalhos SSE, estados de protocolo, expressões de roteamento nem nomes de campos do SDK. Espaços JSX, separadores gráficos, sinais de porcentagem, ícones e máscara de token não são mensagens linguísticas.

`Available`/`Offline` em `fetch-worker-form.tsx:123,124` são comparações de dados para escolher a cor, não rótulos definidos pelo componente. O erro de uso do hook em `features/environments/context.tsx:100` é diagnóstico de programação, não mensagem de fluxo normal. Os nomes de colunas “Regra de Negócio” e “Fila Twilio”, a sentinela “Fechar” e a fila “EVERYONE” em `create-workflow.ts` são contratos de entrada/negócio; as mensagens que os explicam devem ser centralizadas, mas os identificadores devem ser preservados.

## Áreas com centralização já adotada

As definições de ferramentas dos quatro domínios e os rótulos dos itens da sidebar referenciam `strings`. Os metadados textuais encontrados nas páginas e layout também usam o catálogo. A consulta unificada de Conversations, seus skeletons e a alteração de features de Workers já usam mensagens centralizadas. A exportação de mensagens usa cabeçalhos de `strings.conversations.history.export.columns`.

O manifesto público tem `name` e `short_name` vazios; não foi contado como ocorrência de texto. Ausência de conteúdo não é centralização correta, mas é um problema distinto deste inventário.

## Plano de correção

1. Criar as mensagens compartilhadas de erro, validação, retry e autocomplete; reutilizar as existentes quando houver equivalência semântica.
2. Migrar componentes compartilhados, acessibilidade, placeholders e grupos de variáveis. Preservar os valores de localStorage e as assinaturas públicas.
3. Migrar os textos das rotas e bibliotecas por domínio, usando funções tipadas para interpolação. Preservar níveis SSE, contadores, cancelamento, `done: true` e payloads.
4. Eliminar a exibição direta de erros externos, separando os erros próprios esperados das exceções inesperadas. Não basta mover o template com `err.message` para `strings.ts`.
5. Ajustar exportações, formatos e o rótulo em inglês. Documentar qualquer exceção de apresentação técnica.
6. Repetir a busca contextual, executar typecheck/lint/build em ambiente com Node >=22 e verificar fluxos, estados vazios, falhas, cancelamento, leitores de tela e arquivos exportados. Para operações destrutivas, usar mocks ou ambiente de teste autorizado.

Como prevenção futura, considerar uma regra ESLint baseada em AST para texto JSX e atributos de apresentação, com exceções explícitas para valores técnicos. Uma regra só de JSX não cobre os achados de servidor ou exportação; manter revisão desses caminhos. Não foi implementada regra nesta etapa.

## Registro de verificações

- Aplicação, dependências e contratos: nenhuma alteração nesta auditoria.
- Centralização/pt-BR: não conformidades registradas acima; não corrigidas nesta etapa.
- Typecheck/lint/build: impedidos pela ausência de npm no terminal.
- Testes manuais e cancelamento: não executados; nenhuma operação Twilio realizada.
- Segurança relacionada ao escopo: propagação de mensagens externas identificada; não há evidência nesta auditoria de um vazamento ocorrido. `lib/errors.ts:44,78` e `features/conversations/lib/close.ts:40` também registram erros externos e merecem revisão de sanitização separada.
- Acessibilidade relacionada ao escopo: rótulos hardcoded inventariados; o campo de nome em `contact-input.tsx:166` e seu botão de confirmação em `:183` não têm rótulo associado/nome acessível explícito. Corrigir junto aos textos correspondentes.
- Performance, persistência e SSE: sem alterações; esta revisão não certifica conformidade integral dessas áreas.

