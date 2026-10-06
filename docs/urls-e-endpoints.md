# URLs das páginas e endpoints das APIs

Os nomes seguem domínio e ação, em inglês e kebab-case. Catálogos continuam em `/conversations`, `/taskrouter`, `/numbers`, `/flex` e `/settings`; a visão geral continua em `/`.

## Páginas

| URL anterior | URL atual |
|---|---|
| `/conversations/consult` | `/conversations/consult-by-sid` |
| `/conversations/fetch-by-participant` | `/conversations/search-by-number` |
| `/conversations/close` | `/conversations/close-by-number` |
| `/taskrouter/workers` | `/taskrouter/manage-workers` |
| `/taskrouter/search-tasks` | `/taskrouter/search-tasks-by-sid-or-number` |
| `/taskrouter/create-workflow` | `/taskrouter/create-workflow-from-csv` |
| `/taskrouter/add-particular-filter` | `/taskrouter/add-business-rule-filter` |
| `/taskrouter/cancel-queue-tasks` | `/taskrouter/cancel-queue-tasks-and-close-conversations` |
| `/numbers/list` | `/numbers/list-messaging-numbers` |
| `/flex/create-address-config` | `/flex/create-conversation-address` |
| `/settings/environments` | `/settings/manage-environments` |
| `/settings/contacts` | `/settings/manage-contacts` |
| `/settings/variables` | `/settings/manage-variables` |
| `/conversations/fetch` | `/conversations/consult-by-sid?tab=details` |
| `/conversations/history` | `/conversations/consult-by-sid?tab=messages` |
| `/taskrouter/fetch-task` | `/taskrouter/search-tasks-by-sid-or-number` |
| `/taskrouter/fetch-worker` | `/taskrouter/manage-workers?tab=details` |
| `/taskrouter/assign-workers` | `/taskrouter/manage-workers?tab=skills` |
| `/taskrouter/update-worker-feature` | `/taskrouter/manage-workers?tab=features` |

## APIs — somente POST

| Endpoint anterior | Endpoint atual |
|---|---|
| `/api/conversations/fetch` | `/api/conversations/get-details-by-sid` |
| `/api/conversations/history` | `/api/conversations/get-messages-by-sid` |
| `/api/conversations/fetch-by-participant` | `/api/conversations/search-by-number` |
| `/api/conversations/close` | `/api/conversations/close-by-number` |
| `/api/conversations/close-single` | `/api/conversations/close-by-sid` |
| `/api/taskrouter/fetch-worker` | `/api/taskrouter/get-worker-details` |
| `/api/taskrouter/assign-workers` | `/api/taskrouter/add-skill-to-workers` |
| `/api/taskrouter/update-worker-feature` | `/api/taskrouter/set-worker-feature-status` |
| `/api/taskrouter/fetch-task` | `/api/taskrouter/get-task-by-sid` |
| `/api/taskrouter/search-tasks` | `/api/taskrouter/search-tasks-by-number` |
| `/api/taskrouter/create-workflow` | `/api/taskrouter/create-workflow-from-csv` |
| `/api/taskrouter/add-particular-filter` | `/api/taskrouter/add-business-rule-filter` |
| `/api/taskrouter/cancel-queue-tasks` | `/api/taskrouter/cancel-queue-tasks-and-close-conversations` |
| `/api/numbers/list` | `/api/numbers/list-messaging-numbers` |
| `/api/flex/create-address-config` | `/api/flex/create-conversation-address` |
| `/api/environments/verify` | `/api/environments/verify-twilio-credentials` |

## Compatibilidade e escopo

As páginas anteriores redirecionam permanentemente para o destino atual. Os parâmetros de consulta, como `sid`, são preservados. As URLs antigas de detalhes, mensagens, skills e features selecionam a aba correspondente.

Os endpoints antigos executam o mesmo handler POST do endpoint atual, sem redirecionamento HTTP: corpo, credenciais, validações, respostas JSON, SSE e cancelamento permanecem com a mesma semântica. Não há persistência de credenciais no servidor.

`search-by-number` e `close-by-number` de Conversations operam sobre números brasileiros de WhatsApp. `add-skill-to-workers` altera skills e níveis, sem atribuir diretamente uma Task. `cancel-queue-tasks-and-close-conversations` cancela Tasks elegíveis de uma fila, envia a mensagem configurada e tenta encerrar as Conversations associadas. `list-messaging-numbers` reúne endereços de Conversations e remetentes WhatsApp; não é um inventário de todos os números de telefonia da conta.

Contatos, variáveis e ambientes continuam armazenados no navegador. Somente a verificação de credenciais usa uma API de ambientes.

O inventário executável está em `lib/route-migrations.mjs`. Componentes, módulos de negócio e chaves de localStorage mantêm seus nomes; renomear URLs não exige migrar dados locais.

## Validação

`npm test` inclui os testes de destinos, identidade dos handlers e referências ativas. Após `npm run build`, `node tests/route-migrations-http.mjs` verifica os redirecionamentos HTTP, a preservação de SID/abas, as páginas atuais e a equivalência dos endpoints antigos e atuais. Os POSTs desse teste usam JSON inválido e não fazem chamadas à Twilio.
