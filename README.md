# Switchboard

Dashboard interno para equipes de suporte e operações executarem tarefas da Twilio sem escrever código. A aplicação reúne operações de Conversations, TaskRouter, Numbers e Flex em uma interface em pt-BR.

O Switchboard não possui banco de dados nem autenticação própria. Cada ambiente Twilio é cadastrado no navegador; `Account SID` e `Auth Token` são enviados no corpo de cada requisição ao servidor Next.js, usados para criar o cliente Twilio daquela chamada e descartados ao final. O servidor não lê credenciais Twilio de variáveis de ambiente e não as persiste.

## Sumário

- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Credenciais e persistência](#credenciais-e-persistência)
- [Instalação e execução](#instalação-e-execução)
- [Comandos](#comandos)
- [Rotas e endpoints](#rotas-e-endpoints)
- [Contratos importantes](#contratos-importantes)
- [Testes](#testes)
- [Limitações conhecidas](#limitações-conhecidas)

## Funcionalidades

### Conversations

- Consulta de Conversation por SID, com detalhes, participantes e histórico de mensagens.
- Busca paginada de Conversations por número de WhatsApp.
- Encerramento em lote de Conversations ativas por número.
- Encerramento individual a partir da consulta.
- Filtros locais e exportação CSV das mensagens carregadas.

### TaskRouter

- Consulta de Task por SID ou telefone.
- Consulta de Worker e gerenciamento de skills e feature flags.
- Criação de Workflow a partir de CSV.
- Inclusão de regra de negócio em Workflows.
- Cancelamento de Tasks elegíveis de uma fila, com tentativa de mensagem e encerramento da Conversation associada.

### Numbers e Flex

- Listagem consolidada de senders de WhatsApp vindos de Conversations e Messaging, com exportação CSV/XLSX.
- Criação de Conversation Address Configuration para Studio, webhook ou integração padrão.

### Configurações locais

- Cadastro, edição, seleção e verificação de ambientes Twilio.
- Agenda de contatos global ao navegador.
- Variáveis de autocomplete globais ou isoladas por ambiente.
- Históricos recentes de operações, limitados e armazenados localmente.

## Stack

| Área | Tecnologia |
| --- | --- |
| Framework | Next.js 16.4, App Router |
| Linguagem | TypeScript 5.9 em modo estrito |
| Interface | React 19.2, Tailwind CSS 4.2, Radix UI/shadcn, Lucide |
| Integração | Twilio Node SDK 5.13 |
| Exportação XLSX | `write-excel-file` 4.1 |
| Runtime | Node.js 22 ou superior |
| Persistência | `localStorage`; sem banco de dados |
| Testes | Node.js test runner e loader TypeScript próprio |

As versões exatas e os intervalos aceitos estão em `package.json` e `package-lock.json`.

## Arquitetura

O projeto usa uma organização por domínio, com handlers HTTP finos e regras Twilio fora da camada de transporte.

```text
app/
  (pages)/                 páginas e redirects de compatibilidade
  api/                     Route Handlers POST
  layout.tsx               shell global e providers
components/                componentes compartilhados e primitives de UI
features/
  conversations/
  contacts/
  environments/
  flex/
  numbers/
  taskrouter/
  variables/
lib/                       contratos e utilitários transversais
public/                    ícones e manifest
tests/                     testes Node e scripts opcionais de browser
```

Fluxo principal:

```text
Página (Server Component)
  -> formulário de domínio (Client Component)
  -> POST /api/...
  -> validação do Route Handler
  -> getTwilioClient(accountSid, authToken)
  -> feature/<domínio>/lib
  -> API Twilio
```

Responsabilidades:

- `app/(pages)`: wrappers de página e metadata; não contém regra de negócio.
- `app/api`: valida entrada, cria o cliente Twilio, coordena a operação e converte o resultado em JSON ou SSE.
- `features/*/components`: estado e interação da interface, acesso às APIs internas e aos serviços locais compartilhados.
- `features/*/lib`: regras de negócio e chamadas à Twilio, sem dependência de Request, Response ou armazenamento do navegador.
- `lib`: contratos realmente transversais, como validação, storage, SSE, retry, strings e criação do cliente Twilio.

Todas as strings visíveis ao usuário ficam em `lib/strings.ts`. Os catálogos de ferramentas ficam em `features/<domínio>/tools.ts`; a navegação lateral tem registro próprio em `components/sidebar-nav.tsx`.

## Credenciais e persistência

Ambientes são persistidos em texto simples no `localStorage` do perfil do navegador. A máscara visual do token não é criptografia. Por isso:

- use somente dispositivos e perfis de navegador confiáveis;
- não compartilhe o perfil que contém os ambientes;
- remova ambientes quando não forem mais necessários;
- proteja o acesso ao deploy por uma camada externa se a instalação não puder ser pública.

O servidor exige `accountSid` e `authToken` válidos em todo endpoint e não possui fallback para `TWILIO_ACCOUNT_SID` ou `TWILIO_AUTH_TOKEN`. Credenciais nunca devem aparecer em URLs, logs, exportações ou respostas.

Todo acesso autoral ao armazenamento passa por `lib/browser-storage.ts`. Falhas de leitura/escrita geram um aviso compartilhado no shell. Contatos são globais; variáveis e históricos declaram explicitamente se são globais ou vinculados ao ambiente. Chaves novas usam o prefixo `switchboard:`; chaves legadas ainda reconhecidas são preservadas por compatibilidade.

## Instalação e execução

Pré-requisitos:

- Node.js 22 ou superior;
- npm 10 (o projeto declara `npm@10.9.8`);
- credenciais de uma conta Twilio com acesso aos recursos usados.

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` e cadastre o primeiro ambiente em **Configurações > Ambientes**.

### Variáveis de ambiente

A aplicação não exige variáveis de ambiente autorais e não usa `.env.local` para credenciais Twilio.

Os scripts opcionais de browser reconhecem:

| Variável | Uso |
| --- | --- |
| `SWITCHBOARD_TEST_URL` | URL da instância sob teste; padrão `http://127.0.0.1:3000` |
| `SWITCHBOARD_PLAYWRIGHT_PATH` | Diretório de uma instalação externa do Playwright |
| `SWITCHBOARD_TEST_FLOWS_ONLY` | Quando definido, pula a matriz de screenshots responsivos |

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | servidor local com Turbopack |
| `npm run build` | build de produção |
| `npm start` | executa o build de produção |
| `npm run typecheck` | valida TypeScript sem emitir arquivos |
| `npm run lint` | executa ESLint |
| `npm test` | executa todas as suítes `tests/*.test.mjs` |
| `npm run format` | formata arquivos TypeScript/TSX com Prettier |

`npm run format` modifica arquivos; use-o conscientemente em uma árvore de trabalho com alterações locais.

## Rotas e endpoints

Todos os endpoints são `POST`, recebem `accountSid` e `authToken` no JSON e revalidam a entrada no servidor. As rotas abaixo são as canônicas usadas pela interface.

| Área | Página canônica | Endpoint canônico |
| --- | --- | --- |
| Ambientes | `/settings/manage-environments` | `/api/environments/verify-twilio-credentials` |
| Conversations | `/conversations/consult-by-sid` | `/api/conversations/get-details-by-sid` |
| Conversations | `/conversations/consult-by-sid?tab=messages` | `/api/conversations/get-messages-by-sid` |
| Conversations | `/conversations/search-by-number` | `/api/conversations/search-by-number` |
| Conversations | `/conversations/close-by-number` | `/api/conversations/close-by-number` |
| Conversations | consulta individual | `/api/conversations/close-by-sid` |
| TaskRouter | `/taskrouter/manage-workers?tab=details` | `/api/taskrouter/get-worker-details` |
| TaskRouter | `/taskrouter/manage-workers?tab=skills` | `/api/taskrouter/add-skill-to-workers` |
| TaskRouter | `/taskrouter/manage-workers?tab=features` | `/api/taskrouter/set-worker-feature-status` |
| TaskRouter | `/taskrouter/search-tasks-by-sid-or-number` | `/api/taskrouter/get-task-by-sid` |
| TaskRouter | `/taskrouter/search-tasks-by-sid-or-number` | `/api/taskrouter/search-tasks-by-number` |
| TaskRouter | `/taskrouter/create-workflow-from-csv` | `/api/taskrouter/create-workflow-from-csv` |
| TaskRouter | `/taskrouter/add-business-rule-filter` | `/api/taskrouter/add-business-rule-filter` |
| TaskRouter | `/taskrouter/cancel-queue-tasks-and-close-conversations` | `/api/taskrouter/cancel-queue-tasks-and-close-conversations` |
| Numbers | `/numbers/list-messaging-numbers` | `/api/numbers/list-messaging-numbers` |
| Flex | `/flex/create-conversation-address` | `/api/flex/create-conversation-address` |

`lib/route-migrations.mjs` é o inventário executável de compatibilidade. URLs antigas de página redirecionam permanentemente para as canônicas; endpoints antigos reexportam o mesmo handler, sem redirect HTTP e sem alterar o método POST. Os testes impedem cadeias de redirect e o uso de aliases pelo código cliente.

## Contratos importantes

### Operações em streaming

As operações longas usam Server-Sent Events com `createSseResponse` no servidor e `consumeSseStream` no cliente. O parser aceita frames fragmentados, CRLF/LF e UTF-8 dividido, valida os níveis de log e exige exatamente um evento final com `done: true`.

O botão de cancelar interrompe a conexão e impede novos passos quando o sinal é observado. Ele não desfaz uma escrita que já tenha sido enviada à Twilio. Writes não são repetidos automaticamente; retry é reservado a leituras seguras e informa cada nova tentativa.

### Limites e processamento

- entradas e históricos locais: no máximo 10 sugestões e 5 registros recentes;
- operações em lote expostas pelos formulários: no máximo 10 itens;
- histórico de mensagens: até 1.000 mensagens carregadas, com aviso de truncamento;
- listagens de Tasks e senders: até 1.000 resultados, com detecção de item adicional quando aplicável;
- operações remotas em lote são sequenciais para respeitar limite de API e manter feedback determinístico;
- o CSV de Workflow usa `;`, aceita BOM, campos entre aspas, `""` escapado e finais LF/CRLF; cabeçalhos obrigatórios: `Regra de Negócio` e `Fila Twilio`.

### Escritas destrutivas

Formulários que alteram dados remotos exibem aviso e confirmação. Históricos de escrita são informativos e não reexecutam ações. Resultados parciais, contadores e logs fazem parte do contrato e não devem ser reduzidos a um sucesso genérico.

## Testes

`npm test` cobre regras de negócio, handlers, isolamento de ambiente, storage, migração de rotas, contratos SSE, feedback SSR, acessibilidade estática e utilitários. O loader em `tests/typescript-loader.mjs` permite carregar módulos TypeScript e injetar doubles sem adicionar um framework de teste.

Os testes de browser não fazem parte de `npm test` e dependem de uma instalação externa do Playwright:

```bash
node tests/redesign-browser.mjs /caminho/para/playwright
node tests/route-migrations-http.mjs
```

O primeiro espera uma aplicação em execução. O segundo inicia seu próprio servidor de produção e, portanto, requer um build válido e porta disponível.

Antes de concluir uma alteração, execute:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Decisões arquiteturais

- Credenciais pertencem ao navegador e à requisição, não à configuração do servidor.
- O backend Next.js existe como fronteira para o SDK Twilio; o navegador nunca importa o SDK diretamente.
- SSE fornece progresso para lotes sem introduzir fila, banco ou infraestrutura de jobs.
- A organização por domínio mantém regras Twilio próximas de seus tipos e componentes.
- Aliases legados preservam links e integrações durante a migração para nomes de rota mais descritivos.
- Abstrações compartilhadas são usadas apenas para contratos transversais comprovados, como storage, SSE, validação e feedback.

## Limitações conhecidas

- Não há autenticação, autorização ou trilha de auditoria próprias. A autorização efetiva é a das credenciais Twilio fornecidas e qualquer proteção de acesso deve ser feita na infraestrutura de hospedagem.
- Credenciais locais estão em texto simples e ficam sujeitas ao modelo de segurança do navegador e do dispositivo.
- Não há banco, sincronização entre navegadores, execução em background nem retomada de operações após recarregar a página.
- Cancelar uma requisição não equivale a rollback remoto.
- Consultas extensas têm limites explícitos; mensagens além de 1.000 não são paginadas pela interface.
- Atualizações read-modify-write de atributos Twilio não possuem versionamento e podem conflitar com alterações concorrentes externas.
- Os scripts de browser são auxiliares e não instalam Playwright como dependência do projeto.
- A compatibilidade real com contas, permissões, volume e limites da Twilio deve ser validada em um ambiente de homologação autorizado; a suíte usa mocks e não chama uma conta real.

Não existe neste repositório um roadmap oficial de novas funcionalidades. Itens futuros devem ser registrados como trabalho planejado somente quando houver escopo aprovado; documentos históricos de auditoria e redesign não representam backlog.

## Documentação

- Este `README.md` é a fonte de verdade funcional e técnica para pessoas desenvolvedoras.
- `AGENTS.md` contém as instruções operacionais obrigatórias para agentes de IA.
- `CLAUDE.md` existe apenas como ponte para ferramentas que procuram esse nome.
