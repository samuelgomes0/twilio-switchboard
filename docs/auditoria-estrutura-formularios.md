# Auditoria da estrutura visual dos formulários

## Escopo e método

Inventário concluído antes de modificar código produtivo, com snapshot do checkout limpo. Preservadas as rodadas anteriores. Contagens por definição JSX, incluindo campos condicionais e uma definição por linha dinâmica; não representam instâncias renderizadas. Linhas das tabelas referem-se ao início da rodada. Settings inclui Contatos, Ambientes e Valores de autocomplete. Rotas legadas redirecionam para consulta unificada e Workers.

Baseline: 94 testes, 17 erros de lint preexistentes, 0 warnings, typecheck limpo, build de 42 páginas. Métricas exclusivas desta rodada.

## Categorias equivalentes

| Categoria | Interfaces | Estrutura |
| --- | --- | --- |
| Operações SSE | Close, Assign Workers, Cancel Queue Tasks, Create Workflow, Add Particular Filter, Update Worker Feature | Form space-y-5, campos space-y-2, confirmação, resumo/progresso quando existente, LogOutput e histórico quando existente |
| Consultas | Conversation, Fetch by Participant, Fetch Worker, Search Tasks | Identificação, campo + ação inline, erro/hint, confirmação onde existente, resultado mt-6, cards e histórico |
| Configuração Flex | Create Address Config | max-w-2xl, identificação, capacidades, separador, integração condicional, confirmação e Card de resultado |
| Listagem | Numbers | Ação inicial, loading, filtros/exportação, tabela ou empty state e recarga |
| Configurações locais | Environment Form/Manager, Contact Form/Manager, Variables Manager | Editor dentro de painel bg-card, densidade compacta e confirmação local |
| Composição | Worker Management e Conversation Messages | Workspace compartilhado + abas forceMount; filtros de mensagens dentro do resultado |

## Inventário anterior às alterações

### features/contacts/components/contacts-manager.tsx

Largura/raiz inicial: "mx-auto max-w-3xl" (linha 119).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 48 | form | — | className="space-y-3" |
| 49 | div | — | className="grid gap-3 sm:grid-cols-2" |
| 50 | div | — | className="space-y-1.5" |
| 51 | Label | strings.contacts.form.nameLabel | htmlFor="contact-name" |
| 54 | Input | — | id="contact-name"; placeholder={strings.contacts.form.namePlaceholder} |
| 61 | div | — | className="space-y-1.5" |
| 62 | Label | strings.contacts.form.phoneLabel | htmlFor="contact-phone" |
| 65 | Input | — | id="contact-phone"; placeholder={strings.contacts.form.phonePlaceholder}; className="font-mono" |
| 74 | div | — | className="flex gap-2" |
| 135 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="mb-6 flex items-center justify-between gap-3" |
| 136 | div | — | className="flex items-center gap-3" |
| 141 | h1 | strings.contacts.manager.title | className="text-xl font-semibold tracking-tight" |
| 144 | p | strings.contacts.manager.subtitle | className="text-sm text-muted-foreground" |
| 167 | div | — | className="mb-6 rounded-xl border border-border bg-card px-5 py-5" |
| 168 | h2 | strings.contacts.manager.addTitle | className="mb-4 text-sm font-semibold" |
| 182 | p | strings.contacts.manager.emptyTitle | className="text-sm font-medium text-muted-foreground" |
| 185 | p | strings.contacts.manager.emptyHint \| " " \| " " \| strings.contacts.manager.emptyHintSuffix | className="mt-1 text-xs text-muted-foreground" |
| 198 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-2" |
| 205 | h2 | strings.contacts.manager.editTitle | className="mb-4 text-sm font-semibold" |
| 215 | div | — | className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4" |
| 219 | p | strings.contacts.manager.deleteConfirm(contact.name) | className="mb-3 text-sm font-medium text-destructive" |
| 222 | div | — | className="flex gap-2" |
| 242 | div | — | className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3" |
| 247 | p | contact.name | className="truncate text-sm font-medium" |
| 248 | p | contact.phone | className="truncate font-mono text-xs text-muted-foreground" |

### features/conversations/components/close-form.tsx

Largura/raiz inicial: "mx-auto max-w-3xl" (linha 228).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 244 | div | — | className="mb-6 flex items-center gap-3" |
| 249 | div | — | className="flex items-center gap-2" |
| 250 | h1 | strings.conversations.close.title | className="text-xl font-semibold tracking-tight" |
| 255 | p | strings.conversations.close.subtitle | className="text-sm text-muted-foreground" |
| 263 | div | — | className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5" |
| 266 | p | strings.common.noEnvironmentSelected.title | className="font-medium text-destructive" |
| 269 | p | strings.common.noEnvironmentSelected.message \| " " | className="mt-0.5 text-destructive/80" |
| 282 | form | — | className="space-y-5" |
| 283 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-2" |
| 284 | Label | strings.conversations.close.phoneLabel \| " " | — |
| 290 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-2" |
| 292 | div | — | className="flex items-center gap-2" |
| 293 | ContactInput | — | placeholder={strings.common.placeholders.closePhone}; disabled={status === "running"}; containerClassName="flex-1"; className="pl-[7.5rem]" |
| 337 | p | strings.common.phoneDigitsOnly \| : \| fieldErrors.join(", ") | className="text-xs text-destructive" |
| 342 | p | strings.conversations.close.maxExceeded(MAX_ITEMS) | className="text-xs text-destructive" |
| 348 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="flex items-center gap-2" |
| 397 | AlertDialogContent | — | — |
| 408 | AlertDialogFooter | — | — |
| 425 | div | — | className="mt-5 space-y-1" |
| 447 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="mt-5 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm" |
| 470 | div | — | className="mt-5 space-y-2" |
| 471 | p | strings.common.logOfOperations | className="text-xs font-medium tracking-wider text-muted-foreground uppercase" |
| 474 | LogOutput | — | — |

### features/conversations/components/conversation-form.tsx

Largura/raiz inicial: "mx-auto max-w-3xl" (linha 136).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 67 | form | — | className="space-y-2" |
| 68 | Label | strings.conversations.history.sidLabel | htmlFor="conversation-sid" |
| 71 | div | — | className="flex gap-2" |
| 72 | StoredInput | — | id="conversation-sid"; placeholder={strings.conversations.history.sidPlaceholder}; containerClassName="flex-1" |
| 86 | p | sid.trim() && !valid ? strings.conversations.history.sidInvalid : strings.conversations.history.sidHint | className={ sid.trim() && !valid ? "text-xs text-destructive" : "text-xs text-muted-foreground" } |
| 152 | div | — | className="mb-6 flex items-center gap-3" |
| 157 | h1 | labels.title | className="text-xl font-semibold tracking-tight" |
| 160 | p | labels.subtitle | className="text-sm text-muted-foreground" |
| 170 | div | — | role="alert"; className="rounded-lg border border-destructive/30 p-4 text-sm" |
| 174 | p | strings.common.noEnvironmentSelected.title | — |
| 175 | p | strings.common.noEnvironmentSelected.message \| " " | — |

### features/conversations/components/conversation-messages.tsx

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 40 | Card | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="p-6" |
| 41 | p | strings.conversations.history.result.filteredMessageCount( filteredMessages.length, data.messages.length ) | className="mb-4 text-sm text-muted-foreground"; aria-live="polite" |
| 48 | p | strings.conversations.history.result.limitWarning | className="mb-4 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300" |
| 53 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="mb-6 space-y-3" |
| 54 | div | — | className="grid gap-3 sm:grid-cols-2" |
| 55 | div | — | className="space-y-1.5 sm:col-span-2" |
| 56 | Label | strings.conversations.history.filters.contentLabel | htmlFor="message-content-search" |
| 59 | Input | — | id="message-content-search"; type="search"; placeholder={ strings.conversations.history.filters.contentPlaceholder } |
| 69 | div | — | className="space-y-1.5 sm:col-span-2" |
| 70 | Label | strings.conversations.history.filters.authorLabel | htmlFor="message-author-filter" |
| 73 | select | Condição/composição JSX; filhos discriminados nas linhas seguintes | id="message-author-filter"; className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none" |
| 89 | div | — | className="space-y-1.5" |
| 90 | Label | strings.conversations.history.filters.startDateLabel | htmlFor="message-start-date" |
| 93 | Input | — | id="message-start-date"; type="date" |
| 101 | div | — | className="space-y-1.5" |
| 102 | Label | strings.conversations.history.filters.endDateLabel | htmlFor="message-end-date" |
| 105 | Input | — | id="message-end-date"; type="date" |
| 129 | div | — | className="mb-3 flex flex-wrap items-center justify-between gap-2" |
| 130 | h3 | strings.conversations.history.result.messagesHeading | className="text-sm font-semibold" |
| 147 | p | strings.conversations.history.result.empty | className="text-sm text-muted-foreground italic" |
| 151 | p | strings.conversations.history.result.noFilteredMessages | className="text-sm text-muted-foreground italic" |

### features/conversations/components/fetch-by-participant-form.tsx

Largura/raiz inicial: "mx-auto max-w-3xl" (linha 243).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 259 | div | — | className="mb-6 flex items-center gap-3" |
| 264 | h1 | strings.conversations.fetchByParticipant.title | className="text-xl font-semibold tracking-tight" |
| 267 | p | strings.conversations.fetchByParticipant.subtitle | className="text-sm text-muted-foreground" |
| 275 | div | — | className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5" |
| 278 | p | strings.common.noEnvironmentSelected.title | className="font-medium text-destructive" |
| 281 | p | strings.common.noEnvironmentSelected.message \| " " | className="mt-0.5 text-destructive/80" |
| 295 | form | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-4" |
| 296 | div | — | className="space-y-2" |
| 297 | Label | strings.conversations.fetchByParticipant.phoneLabel \| " " | htmlFor="phone" |
| 303 | div | — | className="flex gap-2" |
| 304 | ContactInput | — | id="phone"; placeholder={strings.common.placeholders.localPhone}; disabled={loading}; containerClassName="flex-1"; className="pl-[7.5rem]" |
| 333 | p | phoneError | className="text-xs text-destructive" |
| 336 | div | — | className="space-y-2" |
| 337 | Label | strings.conversations.fetchByParticipant.filterLabel | — |
| 361 | AlertDialogContent | — | — |
| 374 | AlertDialogFooter | — | — |
| 392 | div | error | className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive" |
| 401 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="mt-6" |
| 404 | p | results?.length === 0 ? strings.conversations.fetchByParticipant.results.none : strings.conversations.fetchByParticipant.results.noneFiltered( stateFilter ) | className="text-sm text-muted-foreground" |
| 414 | div | — | className="space-y-2" |
| 415 | p | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="text-xs text-muted-foreground" |
| 436 | div | — | className="flex items-start justify-between gap-3" |
| 438 | p | pc.conversationSid | className="font-mono text-xs text-muted-foreground" |
| 442 | p | pc.conversationFriendlyName | className="mt-0.5 text-sm font-medium" |
| 451 | div | — | className="mt-2 grid grid-cols-2 gap-x-4 text-xs text-muted-foreground" |
| 468 | p | strings.conversations.fetchByParticipant.results .identity \| " " | className="mt-1 text-xs text-muted-foreground" |

### features/environments/components/environment-form.tsx

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 136 | form | — | className="space-y-4" |
| 137 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-1.5" |
| 138 | Label | strings.environments.form.nameLabel | htmlFor="env-name" |
| 139 | Input | — | id="env-name"; placeholder={strings.environments.form.namePlaceholder}; aria-invalid={!!errors.name} |
| 147 | p | errors.name | className="text-xs text-destructive" |
| 151 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-1.5" |
| 152 | Label | strings.environments.form.accountSidLabel | htmlFor="env-sid" |
| 155 | Input | — | id="env-sid"; placeholder={strings.common.placeholders.accountSid}; className="font-mono text-sm"; aria-invalid={!!errors.accountSid} |
| 167 | p | errors.accountSid | className="text-xs text-destructive" |
| 169 | p | strings.environments.form.accountSidHint | className="text-xs text-muted-foreground" |
| 174 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-1.5" |
| 175 | Label | strings.environments.form.authTokenLabel | htmlFor="env-token" |
| 179 | Input | — | id="env-token"; type={showToken ? "text" : "password"}; placeholder={strings.environments.form.authTokenPlaceholder}; className="pr-10 font-mono text-sm"; aria-invalid={!!errors.authToken} |
| 209 | p | errors.authToken | className="text-xs text-destructive" |
| 211 | p | strings.environments.form.authTokenHint | className="text-xs text-muted-foreground" |
| 217 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="flex items-center gap-3" |
| 250 | div | — | className="flex gap-2 pt-1" |

### features/flex/components/create-address-config-form.tsx

Largura/raiz inicial: "mx-auto max-w-2xl" (linha 218).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 107 | div | — | className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/30" |
| 109 | p | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="text-sm text-blue-900 dark:text-blue-200" |
| 232 | div | — | className="mb-6 flex items-center gap-3" |
| 237 | h1 | s.title | className="text-xl font-semibold tracking-tight" |
| 238 | p | s.subtitle | className="text-sm text-muted-foreground" |
| 247 | div | — | className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5" |
| 250 | p | strings.common.noEnvironmentSelected.title | className="font-medium text-destructive" |
| 253 | p | strings.common.noEnvironmentSelected.message \| " " | className="mt-0.5 text-destructive/80" |
| 267 | form | — | className="space-y-5" |
| 269 | div | — | className="space-y-2" |
| 270 | Label | s.addressTypeLabel | htmlFor="addressType" |
| 274 | select | Condição/composição JSX; filhos discriminados nas linhas seguintes | id="addressType"; disabled={loading}; className={selectClass} |
| 296 | div | — | className="space-y-2" |
| 297 | Label | s.addressFieldLabel[addressType] | htmlFor="address" |
| 301 | StoredInput | — | id="address"; placeholder={ addressType === "whatsapp" \|\| addressType === "sms" ? strings.common.placeholders.phone : "" }; disabled={loading} |
| 317 | div | — | className="space-y-2" |
| 318 | Label | s.friendlyNameLabel | htmlFor="friendlyName" |
| 319 | Input | — | id="friendlyName"; disabled={loading} |
| 328 | Separator | — | — |
| 331 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-5" |
| 332 | div | — | className="flex items-center gap-2" |
| 333 | h2 | s.flexIntegrationSection | className="text-base font-semibold" |
| 345 | div | — | className="space-y-2" |
| 346 | Label | s.integrationTypeLabel | htmlFor="integrationType" |
| 350 | select | Condição/composição JSX; filhos discriminados nas linhas seguintes | id="integrationType"; disabled={loading}; className={selectClass} |
| 369 | div | — | className="space-y-2" |
| 370 | Label | s.studioFlowLabel | htmlFor="studioFlowSid" |
| 374 | StoredInput | — | id="studioFlowSid"; placeholder={s.studioFlowPlaceholder}; disabled={loading} |
| 383 | p | s.studioFlowHint | className="text-xs text-muted-foreground" |
| 391 | div | — | className="space-y-4" |
| 392 | div | — | className="space-y-2" |
| 393 | Label | s.webhookUrlLabel | htmlFor="webhookUrl" |
| 397 | Input | — | id="webhookUrl"; type="url"; placeholder={strings.common.placeholders.webhook}; disabled={loading} |
| 406 | div | — | className="space-y-2" |
| 407 | Label | s.webhookMethodLabel | htmlFor="webhookMethod" |
| 408 | select | — | id="webhookMethod"; disabled={loading}; className={selectClass} |
| 426 | div | — | className="flex items-center gap-3 pt-1" |
| 444 | AlertDialogContent | — | — |
| 454 | AlertDialogFooter | — | — |
| 470 | div | error | className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive" |
| 477 | div | — | className="mt-6" |
| 478 | Card | — | — |
| 479 | CardHeader | — | — |
| 480 | div | — | className="flex items-start justify-between gap-2" |
| 482 | div | — | className="flex items-center gap-2" |
| 484 | CardTitle | result.sid | className="font-mono text-sm" |
| 488 | CardDescription | result.friendlyName ?? s.result.noFriendlyName | className="mt-1" |
| 495 | CardContent | — | className="space-y-4" |
| 496 | div | — | className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm" |
| 498 | p | s.result.address | className="mb-0.5 text-xs text-muted-foreground" |
| 501 | p | result.address | className="font-mono text-xs font-medium" |
| 506 | p | s.result.addressCountry | className="mb-0.5 text-xs text-muted-foreground" |
| 509 | p | result.addressCountry ?? s.result.noCountry | className="text-xs font-medium" |
| 514 | p | s.result.dateCreated | className="mb-0.5 text-xs text-muted-foreground" |
| 517 | p | formatDate(result.dateCreated) | className="text-xs font-medium" |
| 522 | p | s.result.dateUpdated | className="mb-0.5 text-xs text-muted-foreground" |
| 525 | p | formatDate(result.dateUpdated) | className="text-xs font-medium" |
| 531 | Separator | — | — |
| 534 | p | s.result.autoCreation | className="mb-1.5 text-xs font-medium text-muted-foreground" |
| 537 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="flex items-center gap-2" |
| 554 | p | result.autoCreation.webhookUrl | className="mt-2 font-mono text-xs text-muted-foreground" |
| 559 | p | result.autoCreation.studioFlowSid | className="mt-2 font-mono text-xs text-muted-foreground" |

### features/numbers/components/list-numbers-form.tsx

Largura/raiz inicial: "mx-auto max-w-3xl" (linha 207).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 221 | div | — | className="mb-6 flex items-center gap-3" |
| 226 | h1 | s.title | className="text-xl font-semibold tracking-tight" |
| 227 | p | s.subtitle | className="text-sm text-muted-foreground" |
| 233 | div | — | className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5" |
| 236 | p | strings.common.noEnvironmentSelected.title | className="font-medium text-destructive" |
| 239 | p | strings.common.noEnvironmentSelected.message \| " " | className="mt-0.5 text-destructive/80" |
| 267 | div | strings.common.processing | className="flex items-center gap-2 text-sm text-muted-foreground" |
| 275 | AlertDialogContent | — | — |
| 282 | AlertDialogFooter | — | — |
| 298 | div | error | className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive" |
| 305 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="mt-6 space-y-4" |
| 307 | div | — | className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" |
| 326 | div | — | className="flex items-center gap-2" |
| 329 | Input | — | aria-label={s.table.searchLabel}; type="text"; placeholder={s.table.searchPlaceholder}; className="pl-8" |
| 364 | p | isFiltered ? s.table.countFiltered(displayedResults.length, results!.length) : s.table.count(displayedResults.length) | className="text-xs text-muted-foreground" |
| 373 | p | results!.length === 0 ? s.table.empty : s.table.emptyFiltered | className="text-sm text-muted-foreground" |
| 425 | p | row.friendlyName | className="font-medium" |
| 426 | p | row.id | className="mt-0.5 font-mono text-[10px] text-muted-foreground" |

### features/taskrouter/components/add-particular-filter-form.tsx

Largura/raiz inicial: "mx-auto max-w-3xl" (linha 320).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 336 | div | — | className="mb-6 flex items-center gap-3" |
| 341 | div | — | className="flex items-center gap-2" |
| 342 | h1 | strings.taskrouter.addParticularFilter.title | className="text-xl font-semibold tracking-tight" |
| 347 | p | strings.taskrouter.addParticularFilter.subtitle | className="text-sm text-muted-foreground" |
| 355 | div | — | className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5" |
| 358 | p | strings.common.noEnvironmentSelected.title | className="font-medium text-destructive" |
| 361 | p | strings.common.noEnvironmentSelected.message \| " " | className="mt-0.5 text-destructive/80" |
| 374 | form | — | className="space-y-5" |
| 376 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-2" |
| 377 | Label | strings.taskrouter.addParticularFilter.workspaceSidLabel | htmlFor="workspaceSid" |
| 380 | StoredInput | — | id="workspaceSid"; placeholder={strings.common.placeholders.workspaceSid}; disabled={status === "running"} |
| 393 | p | wsSidError | className="text-xs text-destructive" |
| 398 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-2" |
| 399 | Label | strings.taskrouter.addParticularFilter.filterNameLabel | htmlFor="filterName" |
| 402 | Input | — | id="filterName"; placeholder={ strings.taskrouter.addParticularFilter.filterNamePlaceholder }; disabled={status === "running"} |
| 415 | p | filterNameError | className="text-xs text-destructive" |
| 420 | div | — | className="space-y-2" |
| 422 | div | — | className="grid grid-cols-[1fr_1fr_2.25rem] gap-2" |
| 423 | Label | strings.taskrouter.addParticularFilter.workflowSidColLabel | — |
| 426 | Label | strings.taskrouter.addParticularFilter.taskQueueSidColLabel | — |
| 433 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-2" |
| 435 | div | — | className="space-y-1" |
| 436 | div | — | className="grid grid-cols-[1fr_1fr_2.25rem] items-start gap-2" |
| 437 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-1" |
| 438 | Input | — | aria-label={strings.taskrouter.addParticularFilter.workflowSidColLabel}; placeholder={strings.common.placeholders.workflowSid}; disabled={status === "running"}; className={cn( "font-mono text-xs", rowErrors[i]?.workflowSid && "border-destructive" )} |
| 452 | p | rowErrors[i].workflowSid | className="text-xs text-destructive" |
| 457 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-1" |
| 458 | Input | — | aria-label={strings.taskrouter.addParticularFilter.taskQueueSidColLabel}; placeholder={strings.common.placeholders.taskQueueSid}; disabled={status === "running"}; className={cn( "font-mono text-xs", rowErrors[i]?.taskQueueSid && "border-destructive" )} |
| 472 | p | rowErrors[i].taskQueueSid | className="text-xs text-destructive" |
| 508 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="flex items-center gap-2" |
| 551 | AlertDialogContent | — | — |
| 564 | AlertDialogFooter | — | — |
| 580 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="mt-5 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm" |
| 613 | div | — | className="mt-5 space-y-2" |
| 614 | p | strings.common.logOfOperations | className="text-xs font-medium tracking-wider text-muted-foreground uppercase" |
| 617 | LogOutput | — | — |

### features/taskrouter/components/assign-workers-form.tsx

Largura/raiz inicial: "mx-auto max-w-3xl" (linha 257).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 276 | div | — | data-worker-page-header=true; className="mb-6 flex items-center gap-3" |
| 281 | div | — | className="flex items-center gap-2" |
| 282 | h1 | strings.taskrouter.assignWorkers.title | className="text-xl font-semibold tracking-tight" |
| 287 | p | strings.taskrouter.assignWorkers.subtitle | className="text-sm text-muted-foreground" |
| 295 | div | — | className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5" |
| 298 | p | strings.common.noEnvironmentSelected.title | className="font-medium text-destructive" |
| 301 | p | strings.common.noEnvironmentSelected.message \| " " | className="mt-0.5 text-destructive/80" |
| 314 | form | — | className="space-y-5" |
| 316 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | data-worker-workspace-field=true; className="space-y-2" |
| 317 | Label | strings.taskrouter.assignWorkers.workspaceSidLabel | htmlFor="workspaceSid" |
| 320 | StoredInput | — | id="workspaceSid"; placeholder={strings.common.placeholders.workspaceSid}; disabled={status === "running"} |
| 338 | p | fieldErrors.workspaceSid | className="text-xs text-destructive" |
| 344 | fieldset | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-2"; disabled={status === "running"} |
| 345 | legend | strings.taskrouter.assignWorkers.workersLabel | className="mb-2 text-sm font-medium" |
| 349 | div | — | className="flex items-center gap-2" |
| 350 | Label | strings.taskrouter.assignWorkers.workerLabel(index + 1) | htmlFor={skill-worker-${index}}; className="sr-only" |
| 353 | Input | — | id={skill-worker-${index}}; placeholder={strings.taskrouter.assignWorkers.workerPlaceholder}; className="flex-1" |
| 399 | div | — | className="space-y-2" |
| 400 | Label | strings.taskrouter.assignWorkers.skillLabel | htmlFor="skill" |
| 403 | StoredInput | — | id="skill"; placeholder={strings.common.placeholders.skill}; disabled={status === "running"}; className="font-sans text-sm placeholder:font-sans" |
| 416 | div | — | className="space-y-2" |
| 417 | Label | strings.taskrouter.assignWorkers.levelLabel \| " " | htmlFor="level" |
| 423 | Input | — | id="level"; type="number"; placeholder={strings.common.placeholders.level}; disabled={status === "running"} |
| 436 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="flex items-center gap-2" |
| 479 | AlertDialogContent | — | — |
| 492 | AlertDialogFooter | — | — |
| 508 | div | — | className="mt-5 space-y-1" |
| 530 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="mt-5 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm" |
| 558 | div | — | className="mt-5 space-y-2" |
| 559 | p | strings.common.logOfOperations | className="text-xs font-medium tracking-wider text-muted-foreground uppercase" |
| 562 | LogOutput | — | — |

### features/taskrouter/components/cancel-queue-tasks-form.tsx

Largura/raiz inicial: "mx-auto max-w-3xl" (linha 243).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 259 | div | — | className="mb-6 flex items-center gap-3" |
| 264 | div | — | className="flex items-center gap-2" |
| 265 | h1 | strings.taskrouter.cancelQueueTasks.title | className="text-xl font-semibold tracking-tight" |
| 270 | p | strings.taskrouter.cancelQueueTasks.subtitle | className="text-sm text-muted-foreground" |
| 278 | div | — | className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5" |
| 281 | p | strings.common.noEnvironmentSelected.title | className="font-medium text-destructive" |
| 284 | p | strings.common.noEnvironmentSelected.message \| " " | className="mt-0.5 text-destructive/80" |
| 297 | form | — | className="space-y-5" |
| 299 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-2" |
| 300 | Label | strings.taskrouter.cancelQueueTasks.workspaceSidLabel | htmlFor="workspaceSid" |
| 303 | StoredInput | — | id="workspaceSid"; placeholder={strings.common.placeholders.workspaceSid}; disabled={status === "running"} |
| 321 | p | fieldErrors.workspaceSid | className="text-xs text-destructive" |
| 328 | div | — | className="space-y-2" |
| 329 | Label | strings.taskrouter.cancelQueueTasks.taskQueueNameLabel | htmlFor="taskQueueName" |
| 332 | StoredInput | — | id="taskQueueName"; placeholder={strings.common.placeholders.queue}; disabled={status === "running"}; className="font-mono" |
| 345 | div | — | className="space-y-2" |
| 346 | Label | strings.taskrouter.cancelQueueTasks.closeMessageLabel | htmlFor="closeMessage" |
| 349 | StoredTextarea | — | id="closeMessage"; rows={3}; disabled={status === "running"} |
| 360 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="flex items-center gap-2" |
| 409 | AlertDialogContent | — | — |
| 421 | AlertDialogFooter | — | — |
| 437 | div | — | className="mt-5 space-y-1" |
| 459 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="mt-5 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm" |
| 487 | div | — | className="mt-5 space-y-2" |
| 488 | p | strings.common.logOfOperations | className="text-xs font-medium tracking-wider text-muted-foreground uppercase" |
| 491 | LogOutput | — | — |

### features/taskrouter/components/create-workflow-form.tsx

Largura/raiz inicial: "mx-auto max-w-3xl" (linha 235).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 251 | div | — | className="mb-6 flex items-center gap-3" |
| 256 | div | — | className="flex items-center gap-2" |
| 257 | h1 | strings.taskrouter.createWorkflow.title | className="text-xl font-semibold tracking-tight" |
| 262 | p | strings.taskrouter.createWorkflow.subtitle | className="text-sm text-muted-foreground" |
| 270 | div | — | className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5" |
| 273 | p | strings.common.noEnvironmentSelected.title | className="font-medium text-destructive" |
| 276 | p | strings.common.noEnvironmentSelected.message \| " " | className="mt-0.5 text-destructive/80" |
| 289 | form | — | className="space-y-5" |
| 291 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-2" |
| 292 | Label | strings.taskrouter.createWorkflow.workspaceSidLabel | htmlFor="workspaceSid" |
| 295 | StoredInput | — | id="workspaceSid"; placeholder={strings.common.placeholders.workspaceSid}; disabled={status === "running"} |
| 308 | p | wsSidError | className="text-xs text-destructive" |
| 313 | div | — | className="space-y-2" |
| 314 | Label | strings.taskrouter.createWorkflow.workflowNameLabel | htmlFor="workflowName" |
| 317 | StoredInput | — | id="workflowName"; placeholder={strings.common.placeholders.workflow}; disabled={status === "running"}; className="font-sans text-sm placeholder:font-sans" |
| 330 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-2" |
| 331 | Label | strings.taskrouter.createWorkflow.csvLabel | htmlFor="csvFile" |
| 334 | Input | — | id="csvFile"; type="file"; disabled={status === "running"}; className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted/80" |
| 343 | p | strings.taskrouter.createWorkflow.csvSelected(csvFile.name) | className="text-xs text-muted-foreground" |
| 350 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="flex items-center gap-2" |
| 393 | AlertDialogContent | — | — |
| 406 | AlertDialogFooter | — | — |
| 422 | div | " " \| &middot; \| " " \| " " \| &middot; \| " " | className="mt-5 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm" |
| 443 | div | — | className="mt-5 space-y-2" |
| 444 | p | strings.common.logOfOperations | className="text-xs font-medium tracking-wider text-muted-foreground uppercase" |
| 447 | LogOutput | — | — |

### features/taskrouter/components/fetch-worker-form.tsx

Largura/raiz inicial: "mx-auto max-w-3xl" (linha 191).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 210 | div | — | data-worker-page-header=true; className="mb-6 flex items-center gap-3" |
| 215 | h1 | strings.taskrouter.fetchWorker.title | className="text-xl font-semibold tracking-tight" |
| 218 | p | strings.taskrouter.fetchWorker.subtitle | className="text-sm text-muted-foreground" |
| 226 | div | — | className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5" |
| 229 | p | strings.common.noEnvironmentSelected.title | className="font-medium text-destructive" |
| 232 | p | strings.common.noEnvironmentSelected.message \| " " | className="mt-0.5 text-destructive/80" |
| 246 | form | — | className="space-y-4" |
| 247 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | data-worker-workspace-field=true; className="space-y-2" |
| 248 | Label | strings.taskrouter.fetchWorker.workspaceSidLabel | htmlFor="workspaceSid" |
| 251 | StoredInput | — | id="workspaceSid"; placeholder={strings.common.placeholders.workspaceSid}; disabled={loading} |
| 264 | p | wsSidError | className="text-xs text-destructive" |
| 268 | div | — | className="space-y-2" |
| 269 | Label | strings.taskrouter.fetchWorker.identifierLabel | htmlFor="identifier" |
| 272 | div | — | className="flex gap-2" |
| 273 | StoredInput | — | id="identifier"; placeholder={strings.common.placeholders.worker}; disabled={loading}; containerClassName="flex-1"; className="font-sans text-sm placeholder:font-sans" |
| 298 | p | strings.taskrouter.fetchWorker.identifierHint | className="text-xs text-muted-foreground" |
| 306 | AlertDialogContent | — | — |
| 318 | AlertDialogFooter | — | — |
| 336 | div | error | className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive" |
| 343 | div | — | className="mt-6 space-y-4" |
| 344 | Card | — | — |
| 345 | CardHeader | — | className="pb-3" |
| 346 | div | — | className="flex items-start justify-between gap-3" |
| 348 | p | data.worker.sid | className="font-mono text-sm text-muted-foreground" |
| 351 | CardTitle | data.worker.friendlyName | className="mt-1 text-base" |
| 355 | div | — | className="flex items-center gap-2" |
| 362 | CardContent | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-4" |
| 364 | div | — | className="flex flex-wrap gap-2" |
| 394 | p | strings.taskrouter.fetchWorker.result.skills | className="mb-2 text-xs text-muted-foreground" |
| 415 | Separator | — | — |
| 420 | div | — | className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs" |
| 422 | p | strings.taskrouter.fetchWorker.result.dateCreated | className="mb-0.5 text-muted-foreground" |
| 425 | p | formatDate(data.worker.dateCreated) | className="font-medium" |
| 430 | p | strings.taskrouter.fetchWorker.result.dateUpdated | className="mb-0.5 text-muted-foreground" |
| 433 | p | formatDate(data.worker.dateUpdated) | className="font-medium" |
| 438 | p | strings.taskrouter.fetchWorker.result.dateStatusChanged | className="mb-0.5 text-muted-foreground" |
| 441 | p | formatDate(data.worker.dateStatusChanged) | className="font-medium" |
| 447 | Separator | — | — |
| 451 | p | strings.taskrouter.fetchWorker.result.fullAttributes | className="mb-1.5 text-xs text-muted-foreground" |

### features/taskrouter/components/search-tasks-form.tsx

Largura/raiz inicial: "mx-auto max-w-3xl" (linha 422).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 179 | Card | — | — |
| 180 | CardHeader | — | className="pb-3" |
| 181 | div | — | className="flex flex-wrap items-start justify-between gap-2" |
| 183 | CardTitle | task.sid | className="font-mono text-sm leading-relaxed break-all" |
| 200 | CardContent | — | className="space-y-4" |
| 201 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs" |
| 203 | p | strings.taskrouter.searchTasks.result.priority | className="mb-0.5 text-muted-foreground" |
| 206 | p | task.priority | className="font-medium" |
| 209 | p | strings.taskrouter.searchTasks.result.age | className="mb-0.5 text-muted-foreground" |
| 212 | p | formatAge(task.age) | className="font-medium" |
| 216 | p | strings.taskrouter.searchTasks.result.workflow | className="mb-0.5 text-muted-foreground" |
| 219 | p | task.workflowFriendlyName | className="font-medium" |
| 224 | p | strings.taskrouter.searchTasks.result.queue | className="mb-0.5 text-muted-foreground" |
| 227 | p | task.taskQueueFriendlyName | className="font-medium" |
| 232 | Separator | — | — |
| 234 | div | — | className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs" |
| 236 | p | strings.taskrouter.searchTasks.result.dateCreated | className="mb-0.5 text-muted-foreground" |
| 239 | p | formatDate(task.dateCreated) | className="font-medium" |
| 243 | Separator | — | — |
| 246 | p | strings.taskrouter.searchTasks.result.attributes | className="mb-1.5 text-xs text-muted-foreground" |
| 438 | div | — | className="mb-6 flex items-center gap-3" |
| 443 | h1 | strings.taskrouter.searchTasks.title | className="text-xl font-semibold tracking-tight" |
| 446 | p | strings.taskrouter.searchTasks.subtitle | className="text-sm text-muted-foreground" |
| 454 | div | — | className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5" |
| 457 | p | strings.common.noEnvironmentSelected.title | className="font-medium text-destructive" |
| 460 | p | strings.common.noEnvironmentSelected.message \| " " | className="mt-0.5 text-destructive/80" |
| 506 | form | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-4" |
| 507 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-2" |
| 508 | Label | strings.taskrouter.searchTasks.workspaceSidLabel | htmlFor="workspaceSid" |
| 511 | StoredInput | — | id="workspaceSid"; placeholder={strings.common.placeholders.workspaceSid}; disabled={loading} |
| 529 | p | fieldErrors.workspaceSid | className="text-xs text-destructive" |
| 536 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-2" |
| 537 | Label | strings.taskrouter.searchTasks.taskSidLabel | htmlFor="taskSid" |
| 540 | div | — | className="flex gap-2" |
| 541 | Input | — | id="taskSid"; placeholder={strings.common.placeholders.taskSid}; disabled={loading}; className="flex-1 font-mono text-sm"; aria-invalid={!!fieldErrors.taskSid} |
| 573 | p | fieldErrors.taskSid | className="text-xs text-destructive" |
| 575 | p | strings.taskrouter.searchTasks.taskSidHint | className="text-xs text-muted-foreground" |
| 581 | div | — | className="space-y-2" |
| 582 | Label | strings.taskrouter.searchTasks.phoneLabel | htmlFor="phone" |
| 585 | div | — | className="flex gap-2" |
| 586 | Input | — | id="phone"; placeholder={strings.common.placeholders.phone}; disabled={loading}; className="flex-1" |
| 608 | p | strings.taskrouter.searchTasks.phoneLabelHint | className="text-xs text-muted-foreground" |
| 617 | AlertDialogContent | — | — |
| 624 | AlertDialogFooter | — | — |
| 642 | div | error | className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive" |
| 649 | div | strings.common.processing | className="mt-6 flex items-center gap-2 text-sm text-muted-foreground" |
| 657 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="mt-6 space-y-4" |
| 659 | p | tasks.length === 0 ? strings.taskrouter.searchTasks.result.none : strings.taskrouter.searchTasks.result.count(tasks.length) | className="text-sm font-medium text-foreground" |

### features/taskrouter/components/update-worker-feature-form.tsx

Largura/raiz inicial: "mx-auto max-w-3xl" (linha 60).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 79 | div | — | data-worker-page-header=true; className="mb-6 flex items-center gap-3" |
| 84 | div | — | className="flex items-center gap-2" |
| 85 | h1 | messages.title | className="text-xl font-semibold tracking-tight" |
| 90 | p | messages.subtitle | className="text-sm text-muted-foreground" |
| 94 | p | strings.common.noEnvironmentSelected.message | role="alert"; className="mb-5 text-sm text-destructive" |
| 98 | form | — | className="space-y-5" |
| 105 | fieldset | — | disabled={running}; className="space-y-5" |
| 106 | div | — | data-worker-workspace-field=true; className="space-y-2" |
| 107 | Label | messages.workspaceLabel | htmlFor="feature-workspace" |
| 108 | StoredInput | — | id="feature-workspace"; disabled={running}; placeholder={messages.workspacePlaceholder} |
| 118 | fieldset | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-2" |
| 119 | legend | messages.workersLabel | className="mb-2 text-sm font-medium" |
| 123 | div | — | className="flex items-center gap-2" |
| 124 | Label | messages.workerLabel(index + 1) | htmlFor={feature-worker-${index}}; className="sr-only" |
| 127 | Input | — | id={feature-worker-${index}}; placeholder={messages.workersPlaceholder}; className="flex-1" |
| 169 | div | — | className="space-y-2" |
| 170 | Label | messages.featureLabel | htmlFor="feature-name" |
| 171 | Input | — | id="feature-name"; placeholder={messages.featurePlaceholder}; aria-describedby="feature-name-hint" |
| 179 | p | messages.featureHint | id="feature-name-hint"; className="text-xs text-muted-foreground" |
| 183 | div | — | className="space-y-2" |
| 184 | Label | messages.enabledLabel | htmlFor="feature-enabled" |
| 185 | select | — | id="feature-enabled"; className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring" |
| 196 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="flex gap-2" |
| 224 | AlertDialogContent | — | — |
| 237 | AlertDialogFooter | — | — |
| 259 | section | — | className="mt-6"; role="log"; aria-label={strings.common.logOfOperations}; aria-live="polite" |
| 265 | LogOutput | — | — |

### features/taskrouter/components/worker-management-form.tsx

Largura/raiz inicial: "mx-auto max-w-3xl" (linha 52).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 68 | header | — | className="mb-6 flex items-center gap-3" |
| 73 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="flex items-center gap-2" |
| 74 | h1 | labels.title | className="text-xl font-semibold tracking-tight" |
| 79 | p | labels.subtitle | className="text-sm text-muted-foreground" |
| 82 | div | — | className="mb-5 space-y-2" |
| 83 | Label | labels.workspaceLabel | htmlFor="worker-management-workspace" |
| 86 | StoredInput | — | id="worker-management-workspace"; placeholder={labels.workspacePlaceholder} |

### features/variables/components/variables-manager.tsx

Largura/raiz inicial: "mx-auto max-w-3xl" (linha 265).

Título/descrição, campos/labels, grupos, mensagens, ações, resultados e containers:

| Linha inicial | Elemento | Conteúdo / referência | Estrutura / associação |
| --- | --- | --- | --- |
| 90 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="flex items-center justify-between gap-3 border-b border-border px-4 py-3" |
| 113 | div | — | className="mb-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3" |
| 114 | Label | s.valueLabel | className="text-xs" |
| 115 | div | — | className="flex gap-2" |
| 116 | Input | — | aria-label={s.valueLabel}; className="h-8 font-mono text-xs"; placeholder={s.valuePlaceholder} |
| 149 | p | s.emptyHint | className="py-3 text-center text-xs text-muted-foreground" |
| 153 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-1" |
| 156 | div | — | className="flex gap-2" |
| 157 | Input | — | aria-label={s.valueLabel}; className="h-8 font-mono text-xs" |
| 187 | div | — | className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2" |
| 191 | p | s.deleteConfirm(val) | className="flex-1 truncate font-mono text-xs text-destructive" |
| 213 | div | — | className="group flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 hover:bg-muted/50" |
| 279 | div | — | className="mb-6 flex items-center gap-3" |
| 284 | h1 | s.title | className="text-xl font-semibold tracking-tight" |
| 285 | p | s.subtitle | className="text-sm text-muted-foreground" |
| 292 | p | strings.common.noEnvironmentSelected.title | className="text-sm font-medium text-muted-foreground" |
| 295 | p | strings.common.noEnvironmentSelected.message | className="mt-1 text-xs text-muted-foreground" |
| 308 | p | s.environmentLabel \| " " | className="mb-4 text-xs text-muted-foreground" |
| 314 | div | Condição/composição JSX; filhos discriminados nas linhas seguintes | className="space-y-4" |

## Componentes e regiões complementares

| Arquivo | Classes / estrutura observada |
| --- | --- |
| features/conversations/components/conversation-details.tsx | "flex-row flex-wrap items-start justify-between gap-3"; "min-w-0"; "mb-1 text-xs font-medium text-muted-foreground"; "rounded-md bg-muted px-3 py-2 font-mono text-sm font-semibold break-all text-foreground"; "mt-2"; "space-y-4"; "grid grid-cols-2 gap-x-4 gap-y-3 text-sm"; "mb-0.5 text-xs text-muted-foreground"; "text-xs font-medium"; "col-span-2"; "font-mono text-xs"; "mb-1.5 text-xs text-muted-foreground" |
| features/conversations/components/conversation-message-bubble.tsx | {cn("flex", isCustomer ? "justify-end" : "justify-start")}; {cn( "max-w-[90%] min-w-0 space-y-2 rounded-2xl border px-4 py-3 shadow-sm sm:max-w-[80%]", isCustomer ? "rounded-br-sm border-primary/20 bg-primary/10" : "rounded-bl-sm border-border bg-background" )}; "flex items-center justify-between gap-3"; "min-w-0 flex-1 text-xs leading-6 break-all text-muted-foreground"; "text-sm [overflow-wrap:anywhere] whitespace-pre-wrap"; "text-sm text-muted-foreground italic"; "space-y-1 rounded-lg bg-muted/50 px-3 py-2"; "text-xs [overflow-wrap:anywhere] text-muted-foreground"; "flex justify-end text-[10px] text-muted-foreground" |
| features/conversations/components/conversation-participants.tsx | "ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground"; "text-sm text-muted-foreground italic"; "space-y-3"; "mb-3"; "space-y-2"; "flex items-center gap-2"; "font-mono text-xs text-muted-foreground"; "text-[10px]"; "space-y-1 rounded-md bg-muted/40 px-3 py-2 text-xs"; "flex gap-2"; "w-16 shrink-0 text-muted-foreground"; "font-mono"; "grid grid-cols-2 gap-x-4 text-xs"; "text-muted-foreground" |
| features/conversations/components/conversation-result.tsx | "space-y-3 rounded-lg border border-destructive/30 p-4"; "mt-6 space-y-4"; "mb-4 flex gap-1 rounded-lg bg-muted p-1"; "flex-1 cursor-pointer rounded-md px-4 py-2 text-sm transition-colors hover:bg-background/60 focus-visible:outline-2 focus-visible:outline-ring data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:hover:bg-background/80"; "space-y-4 data-[state=inactive]:hidden"; "data-[state=inactive]:hidden" |
| features/conversations/components/conversation-skeletons.tsx | {cn("rounded-md bg-muted motion-safe:animate-pulse", className)}; "mx-auto max-w-3xl"; "sr-only"; "mb-5 flex gap-2"; "h-5 w-24"; "h-5 w-40"; "mb-6 flex items-center gap-3"; "size-9 shrink-0 rounded-lg"; "min-w-0 flex-1 space-y-2"; "h-6 w-56 max-w-full"; "h-4 w-96 max-w-full"; "mb-2 h-4 w-32"; "flex gap-2"; "h-9 min-w-0 flex-1 rounded-lg"; "h-9 w-20 rounded-full"; "mt-2 h-3 w-64 max-w-full"; "space-y-4"; "space-y-4 p-6"; "flex flex-wrap items-start justify-between gap-3"; "h-3 w-24"; "h-9 w-72 max-w-full"; "h-5 w-16 rounded-full"; "h-9 w-24 rounded-lg"; "grid grid-cols-2 gap-4"; "space-y-2"; "h-3 w-20"; "h-4 w-36 max-w-full"; "col-span-2 space-y-2"; "h-3 w-32"; "h-4 w-64 max-w-full"; "border-t pt-4"; "mb-3 h-3 w-20"; "space-y-3 rounded-md bg-muted/40 p-4"; "h-3 w-3/4"; "ml-4 h-3 w-1/2"; "ml-4 h-3 w-2/3"; "h-3 w-1/3"; "space-y-5 p-6"; "h-5 w-36"; "h-3 w-64 max-w-full"; "space-y-3 rounded-md bg-muted/40 p-3"; "h-3 w-1/2"; "h-3 w-2/3"; "h-3 w-full"; "p-6"; "mb-5 h-4 w-36"; "mb-6 grid grid-cols-2 gap-3"; {cn("space-y-2", index < 2 && "col-span-2")}; "h-9 w-full rounded-lg"; "mb-3 flex items-center justify-between gap-4"; "h-4 w-24"; "h-8 w-28 rounded-full"; "space-y-4 rounded-xl bg-muted/30 p-3 sm:p-4"; {cn("flex", customer ? "justify-end" : "justify-start")}; {cn( "w-4/5 space-y-3 rounded-2xl border p-4 sm:w-2/3", customer ? "rounded-br-sm border-primary/10 bg-primary/5" : "rounded-bl-sm bg-card" )}; "ml-auto h-2 w-20" |
| features/conversations/components/fetch-by-participant-skeleton.tsx | {cn("rounded-md bg-muted motion-safe:animate-pulse", className)}; "space-y-2"; "h-3 w-36"; "space-y-3 px-4 py-3"; "flex items-start justify-between gap-4"; "min-w-0 flex-1 space-y-2"; "h-3 w-64 max-w-full"; "h-4 w-40 max-w-full"; "h-5 w-16 shrink-0 rounded-full"; "grid grid-cols-2 gap-4"; "h-3 w-full"; "h-3 w-48 max-w-full"; "flex gap-2 pt-1"; "h-6 w-28 rounded-full"; "mt-6"; "sr-only"; "mx-auto max-w-3xl"; "mb-5 flex items-center gap-2"; "h-4 w-24"; "size-3.5"; "h-4 w-44"; "mb-6 flex items-center gap-3"; "size-9 shrink-0 rounded-lg"; "h-6 w-64 max-w-full"; "h-4 w-96 max-w-full"; "mb-2 h-4 w-52"; "flex gap-2"; "h-9 min-w-0 flex-1 rounded-lg"; "h-9 w-24 rounded-full"; "mt-5 mb-2 h-4 w-20"; {cn("h-7", width)} |
| features/environments/components/environment-card.tsx | {cn( "rounded-xl border px-4 py-4 transition-colors", isActive ? "border-primary/40 bg-primary/5" : "border-border bg-card" )}; "flex items-start justify-between gap-3"; "min-w-0 flex-1 space-y-1"; "flex items-center gap-2"; "size-3.5 shrink-0 text-emerald-500"; "truncate text-sm font-medium"; "shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"; "space-y-0.5 pl-0"; "flex items-center gap-2 text-xs text-muted-foreground"; "w-16 shrink-0"; "truncate font-mono"; "flex shrink-0 items-center gap-1"; "gap-1"; "size-3"; "size-3.5"; "text-destructive hover:bg-destructive/10 hover:text-destructive"; "mt-3 space-y-2 border-t border-border pt-3"; "mb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"; "flex flex-wrap gap-1"; "rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground" |
| features/taskrouter/components/worker-management-skeleton.tsx | {rounded-md bg-muted motion-safe:animate-pulse ${className}}; "mx-auto max-w-3xl"; "sr-only"; "mb-5 flex items-center gap-2"; "h-4 w-20"; "size-3.5"; "h-4 w-32"; "mb-6 flex items-center gap-3"; "size-9 shrink-0 rounded-lg"; "flex-1 space-y-2"; "h-6 w-48"; "h-4 w-80 max-w-full"; "mb-2 h-4 w-28"; "mb-5 h-9 w-full"; "mb-5 h-11 w-full rounded-lg"; "space-y-3 p-5"; "h-4 w-36"; "h-9 w-full"; "h-9 w-28 rounded-full" |
| components/contact-input.tsx | {cn("relative", containerClassName)}; "pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-sm text-muted-foreground"; {cn( "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 font-mono text-sm shadow-xs transition-colors placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50", className )}; "absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-md"; "group flex items-center"; "min-w-0 flex-1 px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"; "block truncate text-sm font-medium"; "block truncate font-mono text-xs text-muted-foreground"; "mr-1 flex size-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"; "size-3"; "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"; "size-3 shrink-0"; "px-3 py-2"; "sr-only"; "flex gap-1.5"; "h-7 flex-1 rounded border border-input bg-transparent px-2 text-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"; "shrink-0" |
| components/json-block.tsx | "text-xs text-muted-foreground italic"; {className} |
| components/log-output.tsx | {cn( "relative max-h-[480px] min-h-[200px] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs", className )}; "text-zinc-600 select-none"; "space-y-0.5"; "flex gap-2 leading-relaxed"; "shrink-0 text-zinc-600"; {cn( "w-3 shrink-0 text-center", levelStyles[entry.level] )}; {cn(levelStyles[entry.level])} |
| components/page-loading.tsx | "mx-auto max-w-3xl animate-pulse"; "mb-8"; "h-7 w-44 rounded-md bg-muted"; "mt-2 h-4 w-72 rounded-md bg-muted"; "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"; "rounded-xl border border-border bg-card p-5"; "mb-3 flex items-center justify-between"; "size-9 rounded-lg bg-muted"; "mb-4 h-4 w-3/4 rounded-md bg-muted"; "space-y-1.5"; "h-3 w-full rounded-md bg-muted"; "h-3 w-5/6 rounded-md bg-muted" |
| components/recent-history.tsx | "mt-8 space-y-2"; "flex items-center justify-between gap-3"; "text-sm font-medium"; "space-y-1"; {cn(!onSelect && contentClassName, className)}; {contentClassName} |
| components/stored-input.tsx | {cn("relative", containerClassName)}; {cn( "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 font-mono text-xs shadow-xs transition-colors placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50", className )}; "absolute top-full left-0 z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-md"; "group flex items-center"; "min-w-0 flex-1 px-3 py-1.5 text-left font-mono text-xs hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"; "block truncate"; "mr-1 flex size-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"; "size-3"; "w-full px-3 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none" |
| components/stored-textarea.tsx | "space-y-2"; {cn( "flex w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50", className )}; "divide-y divide-border overflow-hidden rounded-md border border-border bg-popover"; "group flex items-start gap-2 px-3 py-2"; "min-w-0 flex-1 text-left text-xs leading-relaxed text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"; "line-clamp-2"; "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"; "size-3"; "w-full px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring" |
| components/ui/alert-dialog.tsx | {cn( "fixed inset-0 z-50 bg-background/60 backdrop-blur-sm", "data-[state=closed]:animate-out data-[state=open]:animate-in", "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className )}; {cn( "fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2", "rounded-xl border border-border bg-background p-6 shadow-lg", "data-[state=closed]:animate-out data-[state=open]:animate-in", "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95", "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]", "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]", className )}; {cn("flex flex-col gap-2 text-center sm:text-left", className)}; {cn( "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className )}; {cn("text-base font-semibold", className)}; {cn("text-sm text-muted-foreground", className)}; {cn(buttonVariants({ variant: "outline" }), className)}; {cn(buttonVariants(), className)} |
| components/ui/card.tsx | {cn( "rounded-xl border border-border bg-card text-card-foreground shadow-sm", className )}; {cn("flex flex-col space-y-1.5 p-6", className)}; {cn( "text-base leading-none font-semibold tracking-tight", className )}; {cn("text-sm text-muted-foreground", className)}; {cn("p-6 pt-0", className)} |
| components/ui/input.tsx | {cn( "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40", className )} |
| components/ui/label.tsx | {cn( "text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className )} |
| components/ui/separator.tsx | {cn( "shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className )} |
| components/warning-badge.tsx | "cursor-default gap-1"; "size-3" |

## Totais do inventário

```json
{
  "interfaces": 17,
  "forms": 13,
  "fields": 46,
  "labels": 45,
  "legends": 2,
  "paragraphs": 124,
  "cards": 4,
  "logs": 6
}
```

Parágrafos incluem introduções, help text, validação, dados, resumos e empty states. As referências das tabelas discriminam seu papel; não representam exclusivamente descriptions de campos. Resultados de operação/consulta: 11 fluxos, incluindo logs; mensagens têm região própria dentro da consulta. Configurações exibem listas locais. Detalhes/Participants integram o resultado de Conversation.

## Padrão predominante identificado

Label → controle: space-y-2 (8 px) em ferramentas; space-y-1.5 (6 px) em editores compactos e filtros. Campo/grupo → próximo: space-y-5 (20 px) em operações; space-y-4 (16 px) em configurações; grid gap-3 em filtros/contatos. Ação inline pertence ao campo; ações finais têm gap-2. Formulário → resultados em Card: mt-6 (24 px); progresso/resumo/log/erro: mt-5 (20 px); histórico: mt-8 (32 px). Título: h1 text-xl font-semibold tracking-tight; subtítulo: text-sm text-muted-foreground. Help/erro: text-xs, muted/destructive. Cards de resultados e painéis de configurações têm propósitos distintos.

## Achados registrados antes da implementação

- Consulta e atribuição de Workers usam id="workspaceSid" simultaneamente nas abas forceMount; corrigir IDs/htmlFor com prefixos próprios, preservando montagem e ocultação.
- Telefones dinâmicos têm Label coletiva e ContactInput sem id; corrigir exclusivamente a associação acessível, preservando índices, valores e handlers.
- Help texts/erros visíveis sem aria-describedby; wrappers especializados não encaminham esse atributo. Permitir encaminhamento opcional e atributivo, sem lógica nova.
- Pares Workflow/Task Queue usam grid rígido na base; empilhar em mobile, mantendo duas colunas a partir de sm e labels por campo.
- Consultas inline com prefixo whatsapp:+55 disputam largura com ações; empilhar na base, preservar linha em sm, min-w-0/w-full nos wrappers.
- Operações equivalentes usam space-y-5 versus space-y-4; unificar entre grupos de ferramentas, preservando densidade compacta.
- Ações finais sem flex-wrap e títulos com ações laterais podem comprimir conteúdo em telas menores.
- Optional é localizado; asteriscos apenas em Flex. Não existe convenção global de required. Preservar indicadores existentes.
- Hints de telefone mencionam sem dígito 9, enquanto placeholders auditados incluem 9. Conflito real registrado; validação cliente verifica dígitos, sem evidência suficiente para reescrever regra. Preservar ambos.
- Integração Flex tem tooltip CSS apenas por hover; corrigir exigiria interação nova e fica fora do escopo.
- JsonBlock e LogOutput mantidos; não alterar parsing, autoscroll/lifecycle ou histórico.

### Inventário complementar: EnvironmentsManager

Página de configurações sem campo próprio: título/subtítulo, ação de criação, painéis add/edit com EnvironmentForm, confirmação local, empty state e lista de EnvironmentCard.

| Linha inicial | Elemento | Texto / estrutura |
| --- | --- | --- |
| 64 | div | Composição condicional; "mb-6 flex items-center justify-between gap-3" |
| 70 | h1 | strings.environments.manager.title; "text-xl font-semibold tracking-tight" |
| 73 | p | strings.environments.manager.subtitle; "text-sm text-muted-foreground" |
| 96 | div | ; "mb-6 rounded-xl border border-border bg-card px-5 py-5" |
| 97 | h2 | strings.environments.manager.addTitle; "mb-4 text-sm font-semibold" |
| 100 | EnvironmentForm | ; — |
| 111 | p | strings.environments.manager.emptyTitle; "text-sm font-medium text-muted-foreground" |
| 114 | p | strings.environments.manager.emptyHint \| " " \| " " \| strings.environments.manager.emptyHintSuffix; "mt-1 text-xs text-muted-foreground" |
| 134 | h2 | strings.environments.manager.editTitle; "mb-4 text-sm font-semibold" |
| 137 | EnvironmentForm | ; — |
| 152 | p | strings.environments.manager.deleteConfirm(env.name); "mb-3 text-sm font-medium text-destructive" |
| 175 | EnvironmentCard | ; — |

Configurações landing page (app/(pages)/settings/page.tsx) é catálogo, sem formulário; título de entrada maior e cards de navegação são contextualmente distintos e preservados.

## Inventário de descriptions, alertas e feedback

Os 17 registros com campos, mais EnvironmentsManager sem campo próprio, representam 18 arquivos principais analisados. São 13 definições de form. Cards/logs nos totais anteriores restringem-se aos 17 registros com campos; componentes de resultado/skeletons são complementares. Settings landing é catálogo e foi preservado.

| Região | Inventário / decisão |
| --- | --- |
| Descriptions de campo | 8 definições: SID de Conversation, Account SID, Auth Token, Studio Flow, identificador Worker, Task SID, telefone de Task e plugin. Restrições/formato/consequência úteis, conteúdo preservado; associação adicionada onde faltava |
| Mensagens auxiliares | CSV selecionado; hints inline de telefone em Close/Fetch by Participant; nível opcional. Conteúdo e condições preservados |
| Grupos/seções | Identificação; telefones/Workers dinâmicos; skill/nível; Workflow/CSV; regra/pares Workflow-Queue; endereço/capacidades + integração; credenciais/teste; filtros de mensagens; valores por chave/ambiente. Mesmos grupos, ordem e separadores |
| Bloqueio de ambiente | 12 definições; erro destructive existente. Caixa da consulta e plugin alinhada às demais, conteúdo/disponibilidade preservados |
| Erros gerais | 5 caixas nos formulários de consulta/Flex/Numbers, mais QueryFeedback: 6 definições. QueryFeedback mantém retry/role=alert e ganha superfície/tamanho equivalentes |
| Confirmação local | 3 blocos: Contatos, Ambientes, Valores; destructive preservado, distintos de erro de API |
| Informação | CapabilitiesBox azul em Flex; mantido |
| Aviso | Limite de mensagens âmbar e WarningBadge das operações de escrita; severidade mantida |
| Sucesso misto | 5 resumos SSE: Close, Assign, Cancel, Create Workflow, Add Filter; sucesso/erro/skip e condições preservados |
| Teste de credenciais | Progresso no botão, sucesso verde, erro destructive; feedback adjacente com quebra segura |
| Loading/progresso | Skeletons de consulta; spinners de consultas/Numbers; progressos de Close/Assign; LogOutput em 6 fluxos. Mesmas mensagens/ordem/condições |
| Empty states | Ausência de dados/filtrados em Numbers, Participant search, Tasks e Messages; Participants sem itens; Settings sem configurações/valores. Categorias preservadas; nenhuma mensagem onde nada era renderizado |

A classificação inclui 23 caixas: 12 bloqueios, 6 erros gerais, 3 confirmações locais, 1 aviso de limite e 1 informação de capacidades. Exclui icon buttons, resumos mistos, feedback inline e WarningBadge. Variables sem ambiente mantém seu empty state de configuração. JsonBlock continua responsável pelo JSON vazio.

## Padrão final adotado

| Responsabilidade | Convenção final / categorias |
| --- | --- |
| Label → controle | space-y-2 (8 px) em ferramentas; space-y-1.5 (6 px) em editores compactos/filtros; labels mobile e cabeçalho desktop nos pares |
| Campo → campo / grupo → grupo | space-y-5 (20 px) em ferramentas com vários grupos; space-y-4 (16 px) em editores; grid gap-3 compacto; linhas dinâmicas gap-2 |
| Formulário → ações | Próximo item da pilha, gap-2, flex-wrap; consulta inline pertence ao campo, coluna na base/linha em sm; teste de credenciais separado e pt-1 no rodapé compacto preservado |
| Formulário → resultado | mt-6 (24 px) para cards/tabelas/abas; mt-5 (20 px) para progresso/resumo/log/erro; RecentHistory mt-8 preservado |
| Títulos | h1 text-xl font-semibold tracking-tight; capitalização de frase, termos técnicos preservados; landing/results têm hierarquia própria |
| Descriptions | Subtítulo text-sm muted; help text text-xs muted; sem descriptions longas novas |
| Erros | text-xs text-destructive perto do campo, associação via aria-describedby/aria-invalid baseada no erro existente; erro agregado de Close mantido |
| Alerts | Erro/bloqueio destructive, informação azul, aviso âmbar, sucesso verde; nenhum primitive Alert local ou novo componente |
| Largura | max-w-3xl em ferramentas/gestores; Flex max-w-2xl; embutidos herdam painel; metadados uma coluna na base/duas em sm |

## Alterações — antes e depois

### Espaçamento

Contexto: Fetch Worker, Search Tasks e Fetch by Participant.
Antes: grupos space-y-4, operações equivalentes space-y-5.
Depois: space-y-5; label → controle mantém space-y-2.
Motivo: mesma responsabilidade visual de identificação/parâmetros; filtros de mensagens continuam compactos.

Contexto: Contatos e Webhook Flex.
Antes: editor Contatos space-y-3, parâmetros Webhook space-y-4 e rodapé Flex gap-3 pt-1.
Depois: Contatos space-y-4, compatível com Ambientes; Webhook space-y-5; rodapé Flex gap-2 flex-wrap sem padding extra.
Motivo: aplicar categoria local/operação existente, sem substituição universal.

### Estrutura e responsividade

Contexto: pares Workflow/Task Queue.
Antes: duas colunas rígidas em qualquer largura e labels só no cabeçalho.
Depois: empilhados na base; duas colunas minmax(0,1fr) em sm; labels por campo visíveis no mobile e sr-only em sm; cabeçalhos tornam-se parágrafos visuais. Coluna de remoção continua 2.25rem e ordem DOM intacta.
Motivo: evitar compressão e associar cada campo; IDs derivados do índice existente.

Contexto: consulta Conversation, Participant, Worker e Task.
Antes: campo e submit sempre em linha.
Depois: flex-col na base/sm:flex-row; wrappers w-full min-w-0 flex-1; skeletons de páginas acompanham a quebra.
Motivo: garantir largura para SID/Worker/telefone com prefixo; preservar ordem DOM/Tab e controles.

Contexto: cabeçalhos Contatos/Ambientes e rodapés.
Antes: ação lateral/rodapés sem quebra.
Depois: cabeçalho empilha na base, retoma linha em sm; rodapés flex-wrap; ícone shrink-0, texto min-w-0.
Motivo: preservar legibilidade e acesso às ações. Linhas dinâmicas Worker/telefone mantêm campo/remoção relacionados.

### Tipografia e labels

Contexto: nove títulos de formulários em Title Case.
Antes: por Número, Endereço de Canal, Plugins, Skill, por Fila, Filtro, Contatos Salvos, Valores de Autocomplete.
Depois: palavras comuns em minúscula dentro da frase; Conversations, Worker, Workflow, SID e Flex preservados.
Motivo: capitalização dos demais cabeçalhos. Chaves próprias de breadcrumbs/metadados/catálogos/navegação preservadas. O breadcrumb local do plugin usa messages.title e acompanha sua capitalização; navegação global e destinos não mudam.

Contexto: Workspace no plugin.
Antes: SID do Workspace.
Depois: Workspace SID.
Motivo: terminologia predominante dos campos equivalentes; sem mudança semântica.

### Descriptions e acessibilidade

Contexto: hints/erros visíveis sem associação.
Antes: parágrafos sem ID e campos sem aria-describedby.
Depois: IDs próprios, referências condicionais quando a mensagem existe, hint+erro de credenciais associados juntos; aria-invalid reflete o erro existente.
Motivo: expor a mesma informação visual ao leitor de tela; nenhum conteúdo funcional reescrito.

Contexto: Workspace nas abas Workers forceMount.
Antes: consulta/atribuição compartilham workspaceSid no DOM.
Depois: fetch-worker-workspace e skill-workspace com htmlFor correspondentes.
Motivo: eliminar duplicidade preservando montagem, ocultação e Workspace compartilhado.

Contexto: telefones dinâmicos Close.
Antes: label coletiva sem associação, ContactInput sem ID.
Depois: close-phone-${i}, aria-labelledby=close-phones-label, aria-describedby do erro agregado quando presente e aria-invalid por telefone via fieldErrors.
Motivo: correção exclusivamente atributiva. Índices/estado/valores/estrutura de dados/handlers/prefixo/placeholders preservados. Nome acessível permanece coletivo, inclui o hint visual; não se criou texto por posição.

Contexto: Valores de autocomplete.
Antes: nome via aria-label; Label de criação sem htmlFor, edição sem Label.
Depois: IDs por chave/índice, htmlFor na criação e Label sr-only na edição; aria-label anterior mantido. Campo usa largura total na base, sm recupera editor inline.
Motivo: completar associação sem hook/estado/persistência novos.

### Resultados e feedback

Contexto: metadados/datas de Conversation, Participants, Participant search, Worker, Task e Flex.
Antes: grids de duas colunas em qualquer largura e col-span-2 incondicional.
Depois: uma coluna na base/duas em sm, spans apenas em sm, gaps verticais e quebra de valores técnicos longos; skeletons equivalentes acompanham grids.
Motivo: legibilidade; cards, Separator, JsonBlock, dados e ordem preservados.

Contexto: log do plugin e mensagens longas do terminal.
Antes: plugin mt-6 sem título; texto longo sem restrição de largura/quebra.
Depois: plugin mt-5 space-y-2 e strings.common.logOfOperations, como demais fluxos; texto do LogOutput min-w-0 flex-1/overflow-wrap:anywhere.
Motivo: alinhar apresentação e conter URLs/SIDs. role=log/aria-live do plugin, callbacks, entradas, timestamp, altura, overflow vertical e autoscroll intactos.

## Componentes compartilhados

Nenhum componente criado; nenhuma abstração universal. Reutilizados Label, Input, Card e suas partes, Separator, AlertDialog, StoredInput, ContactInput, StoredTextarea, JsonBlock, LogOutput, WarningBadge e RecentHistory. Primitivas globais preservadas.

StoredInput recebe opcionalmente aria-describedby/aria-invalid; ContactInput também aria-labelledby. Expansões compatíveis do contrato de apresentação, encaminhadas explicitamente ao input nativo; sem API de negócio/estado/autocomplete novos. Não há dependência nova nem alteração arquitetural.

Única exceção no Button: remoção de par Workflow/Queue recebeu classes de coluna/linha/margem mobile e resets sm para integrar o grid. Texto, variant, size, handler, disabled, loading e confirmação intactos; decisões da rodada anterior preservadas.

## Segunda revisão e acessibilidade

- AST: lógica fora do JSX idêntica nos arquivos produtivos, descontando cinco atributos opcionais dos dois wrappers; imports iguais. Apenas dez strings de apresentação alteradas (nove títulos e uma label).
- Comparados 354 elementos com atributos funcionais, 102 controles Button/button/ações de confirmação e 196 condições/iterações de renderização. Handlers, valores, disabled, type, required, min/max, href, montagem de abas, confirmação, aria-busy/aria-pressed e spinners intactos.
- Novos atributos por definição JSX: 22 aria-describedby (20 callers + 2 encaminhamentos), 14 aria-invalid (12 campos + 2 encaminhamentos), 2 aria-labelledby (telefone + encaminhamento), 4 htmlFor e 29 definições de ID. IDs iguais em ramos mutuamente exclusivos não coexistem no DOM.
- React SSR real em 10 cenários iniciais: Workers com todas as abas, Close, Conversation, Participant, filtro, Cancel Tasks, Create Workflow, Search Tasks, Flex e Environment Form. Depois: zero IDs duplicados, referências for/aria-describedby/aria-labelledby inválidas e campos sem nome acessível. Antes: Workspace duplicado e telefone dinâmico sem nome.
- Mais 6 cenários de markup com estado inicial semeado só em memória: dois telefones/erro; dois pares/erros por campo; erros de credenciais; erro Task/Workspace; modo telefone; criação/edição de variável. Zero duplicidades/referências inválidas/campos sem nome. Nenhum efeito/HTTP/Twilio disparado.
- Conferidos classes, grids/col-span, resets sm, wrappers, labels, IDs, ARIA, DOM/ordem Tab e correspondência de skeletons. Segunda passagem ajustou gaps de datas empilhadas e preservou histórico integralmente.
- Não houve validação visual em navegador. Nenhuma ferramenta de browser exposta ou infraestrutura configurada; Playwright/Puppeteer ausentes. SSR verifica markup, não pintura/foco/layout calculado/interação dos popups; nenhuma dependência instalada.

## Inconsistências preservadas

- Flex max-w-2xl versus max-w-3xl de ferramentas/gestores; embutidos herdam painel. Sem largura universal.
- Densidade compacta de configurações/filtros versus operações; fontes de SID/data/valores técnicos/texto livre preservadas.
- Label + exemplo SID + hint hexadecimal são complementares; não há redundância descartável evidente.
- Cards de consulta, tabelas/listas e painéis de edição distintos; nenhum Card novo em formulário simples.
- Empty states locais, ausência de resultados e dados filtrados distintos; modo Task SID sem resultado não ganha UX nova.
- Resumos SSE mistos, informação de capacidades, tooltip/badge contextual não viram Alert universal.
- Nível opcional e asteriscos de Flex mantidos; não existe convenção global clara de required e não foi inventada.
- Legendas Workers, catálogo, metadata, chaves próprias de breadcrumbs, navegação global e RecentHistory intactos.

## Achados fora do escopo / limitações

- Hints sem dígito 9 versus placeholders com 9: conflito registrado antes de alterar código; resolver exige decisão de formato/regra do domínio. Ambos preservados.
- Tooltip CSS da integração Flex depende de hover; correção por teclado exige mudar interação/primitive.
- Regras de obrigatoriedade usam canSubmit/validação em vários campos; sem required/legenda global nova.
- Erros de telefone/max-items continuam agregados; nomes acessíveis dos telefones continuam coletivos, sem identificação verbal por posição.
- Cinco fluxos LogOutput não possuem role=log/aria-live externos como o plugin; manter anúncios de SSE existentes nesta rodada. Rever separadamente sem duplicar a região do plugin.
- Autocomplete/save/confirm mantém lifecycle original. Backdrop mobile, falha de clipboard de TaskCopy e empty states ausentes seguem a auditoria de controles, sem correção oportunista.
- Layout calculado e validação real em mobile/desktop pendentes de passagem em navegador; revisão estática não substitui visual.

## Validação final

| Verificação | Resultado |
| --- | --- |
| npm run typecheck | Passou, zero erros |
| npm test | 94/94, zero falhas/cancelados/skipped |
| npm run lint | Mesmos 17 erros preexistentes, zero warnings. Comparados arquivo/ruleId/severity/primeira linha da mensagem; linhas mudam por adições atributivas |
| npm run build | Passou, 42/42 páginas, sem warnings na execução final |
| git diff --check | Passou; documento novo também verificado |
| Segurança/escopo | Sem any/debug/dependência/secreto/dangerouslySetInnerHTML novos; rotas/API/payloads/validação/persistência/SSE/contratos de negócio intactos |
| Navegador | Não houve validação visual em navegador. |

Primeiro build no sandbox falhou no download de Geist/Geist Mono. Reexecutado com rede autorizada, sem alterar configuração/fontes/dependências; última execução passou integralmente.

## Métricas e diff exclusivo desta rodada

26 arquivos produtivos modificados, 1 documento criado, nenhum componente criado. Afetadas as 13 definições de formulário HTML e 4 interfaces equivalentes (Workers, Numbers, Variables, gestor de Ambientes). Filtros ConversationMessages auditados e mantidos. Resultados/skeletons e três componentes compartilhados fazem parte dos 26 arquivos, sem contá-los novamente como formulários.

Linhas produtivas: +252 / -179. Documento: +919 / -0. Total: +1171 / -179.

Checkout inicial limpo; git diff --stat produtivo mais documento novo (git não inclui untracked no stat padrão). Sem staging/commit. Stat equivalente incluindo documento:

```text
components/contact-input.tsx | 9 (+9 / -0)
components/log-output.tsx | 7 (+6 / -1)
components/stored-input.tsx | 6 (+6 / -0)
features/contacts/components/contacts-manager.tsx | 16 (+8 / -8)
features/conversations/components/close-form.tsx | 20 (+12 / -8)
features/conversations/components/conversation-details.tsx | 6 (+3 / -3)
features/conversations/components/conversation-form.tsx | 19 (+12 / -7)
features/conversations/components/conversation-participants.tsx | 8 (+4 / -4)
features/conversations/components/conversation-result.tsx | 2 (+1 / -1)
features/conversations/components/conversation-skeletons.tsx | 14 (+7 / -7)
features/conversations/components/fetch-by-participant-form.tsx | 24 (+13 / -11)
features/conversations/components/fetch-by-participant-skeleton.tsx | 6 (+3 / -3)
features/environments/components/environment-form.tsx | 17 (+10 / -7)
features/environments/components/environments-manager.tsx | 12 (+6 / -6)
features/flex/components/create-address-config-form.tsx | 21 (+11 / -10)
features/numbers/components/list-numbers-form.tsx | 12 (+6 / -6)
features/taskrouter/components/add-particular-filter-form.tsx | 52 (+34 / -18)
features/taskrouter/components/assign-workers-form.tsx | 20 (+11 / -9)
features/taskrouter/components/cancel-queue-tasks-form.tsx | 14 (+8 / -6)
features/taskrouter/components/create-workflow-form.tsx | 17 (+10 / -7)
features/taskrouter/components/fetch-worker-form.tsx | 29 (+16 / -13)
features/taskrouter/components/search-tasks-form.tsx | 32 (+18 / -14)
features/taskrouter/components/update-worker-feature-form.tsx | 19 (+11 / -8)
features/taskrouter/components/worker-management-form.tsx | 8 (+4 / -4)
features/variables/components/variables-manager.tsx | 21 (+13 / -8)
lib/strings.ts | 20 (+10 / -10)
docs/auditoria-estrutura-formularios.md | 919 (+919 / -0)
27 files changed, 1171 insertions(+), 179 deletions(-)
```

Diff integral revisado em segunda passagem. Nenhuma regra de negócio ou comportamento funcional alterado: handlers, estado/useEffect, validação, requests/payloads, persistência, confirmação, SSE/cancelamento e navegação intactos. Alterações limitadas à apresentação, capitalização de títulos/uma label e associação acessível autorizada.
