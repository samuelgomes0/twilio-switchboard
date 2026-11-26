# Switchboard

Dashboard interno para DEVs, POs e PMs de times de atendimento digital investigarem atendimentos e executarem operações na Twilio sem chamar a API manualmente. A aplicação reúne operações de Conversations, TaskRouter e Numbers em uma interface em pt-BR.

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
- Seleção de Workspace por nome ou SID, reutilizada entre ferramentas TaskRouter e persistida por ambiente. A listagem é uma leitura explícita e paginada; selecionar um Workspace não executa consultas ou alterações de domínio.
- Consulta de Worker e gerenciamento de skills e feature flags. O modo individual consulta um Worker por SID ou friendlyName e usa o SID resolvido nas alterações de skills e plugins; o estado atual é mostrado antes de editar e relido ao concluir ou cancelar uma escrita. O modo em lote possui sua própria lista (até 10 Workers), compartilhada entre skills e plugins, sem consulta de detalhes individuais. Uma escrita bloqueia novos writes e a edição dos alvos nessa tela; um aviso compartilhado permite acompanhar ou cancelar a operação ao navegar pelas abas.

### Numbers

- Listagem consolidada de senders de WhatsApp vindos de Conversations e Messaging, com exportação CSV/XLSX.

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

## Interface

A interface segue os tokens e padrões de `design-system-rotas-autenticadas.md`: paleta azul de ações em OKLCH nos temas claro/escuro, com vermelho reservado a erros e ações destrutivas, Outfit no corpo, Manrope nos títulos e Geist Mono em identificadores e números tabulares. Formulários operacionais seguem a estrutura de fieldset do Vercel/Geist e usam raio de 12px; seus botões e campos usam raio de 8px. Cabeçalhos e linhas pares das tabelas, fundos dos campos e rodapés dos formulários compartilham o token `surface-subtle` nos dois temas. Controles de busca e navegação mantêm o formato arredondado. O shell tem sidebar de 256px, recolhível para 48px, e painel mobile de 288px abaixo de 768px. Todas as páginas usam um contêiner centralizado e fluido, com largura máxima de 1280px. Cabeçalhos, formulários, resultados e skeletons compartilham essa largura; tabelas mantêm rolagem horizontal quando necessário. O conteúdo usa 40px de padding no desktop, adaptado para 24px na vertical e 20px nas laterais no mobile.

A Visão geral centraliza o catálogo, com busca, filtro por área e tabela de ferramentas de Conversations, TaskRouter e Numbers, sem itens de Configurações ou cards de resumo. Cada ferramenta tem uma única descrição, na coluna “O que você pode fazer”; no mobile, a tabela mantém rolagem horizontal. O componente compartilhado `OperationForm` separa o corpo de campos de uma única faixa inferior de ações, com fundo discreto e borda superior, alinhada à direita no desktop e adaptada ao mobile. Ações de execução são passadas em `actions` e sempre renderizadas depois de todos os campos e mensagens de validação; nunca ficam em uma coluna ou no meio do formulário. Adicionar/remover itens permanece junto à lista; buscas locais e edições rápidas conservam controles inline. Labels de campos são exibidas em bloco, com linha de 20px e separação de 8px até o controle. As funcionalidades são apresentadas em ordem alfabética dentro de cada categoria na sidebar e nos catálogos. Os itens de cada categoria da sidebar têm 8px de separação. As antigas páginas de Conversations, TaskRouter e Números redirecionam permanentemente para a Visão geral filtrada (`/?area=<área>`), sem etapa intermediária de catálogo. Na sidebar expandida, Conversations e TaskRouter são grupos expansíveis; Números abre diretamente sua única ferramenta. A busca global permanece como atalho para ferramentas e configurações. O acesso a Configurações fica no rodapé da sidebar e abre `/settings`, com ambientes, contatos e variáveis.

O header reúne o único breadcrumb da página, busca de ferramentas, seleção de ambiente e tema Claro/Escuro/Sistema. Os cabeçalhos de conteúdo exibem título, descrição e ações, sem repetir o breadcrumb. `Ctrl/Cmd+B` recolhe a navegação, `Ctrl/Cmd+K` abre a busca e `D` alterna o tema fora de campos de digitação. As mesmas ações têm controles visíveis. O token `muted-foreground` do tema claro foi escurecido para atender contraste AA também sobre `muted`; os testes verificam as combinações principais dos dois temas, sem declarar conformidade global de acessibilidade. Os padrões financeiros da referência foram adaptados para o catálogo de ferramentas e os recursos Twilio, sem adicionar autenticação ou alterar as regras das operações.

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

O formulário de ambientes permanece aberto e conserva o preenchimento quando a gravação falha. As alterações de ambientes releem a coleção antes de gravar e usam Web Locks quando disponível para serializar gravações entre abas. Mudanças de ambientes e seleção são sincronizadas por eventos de storage; editar credenciais do ambiente ativo em outra aba também invalida o conteúdo em andamento. Sem Web Locks, a releitura reduz sobrescritas, mas não garante atomicidade entre abas.

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
| TaskRouter | `/taskrouter/manage-workers?mode=individual&tab=details` | `/api/taskrouter/get-worker-details` |
| TaskRouter | `/taskrouter/manage-workers?mode=batch&tab=skills` | `/api/taskrouter/add-skill-to-workers` |
| TaskRouter | `/taskrouter/manage-workers?mode=batch&tab=features` | `/api/taskrouter/set-worker-feature-status` |
| TaskRouter | `/taskrouter/search-tasks-by-sid-or-number` | `/api/taskrouter/get-task-by-sid` |
| TaskRouter | `/taskrouter/search-tasks-by-sid-or-number` | `/api/taskrouter/search-tasks-by-number` |
| TaskRouter | seleção compartilhada de Workspace | `/api/taskrouter/workspaces/list` |
| Numbers | `/numbers/list-messaging-numbers` | `/api/numbers/list-messaging-numbers` |

As funcionalidades de Workflows, filtros de Workflow, criação por CSV, cancelamento de Tasks por fila e a área Flex foram removidas, incluindo endpoints e aliases. Suas URLs retornam 404; dados antigos no navegador não são apagados automaticamente.

`lib/route-migrations.mjs` é o inventário executável de compatibilidade. URLs antigas de página redirecionam permanentemente para as canônicas; endpoints antigos reexportam o mesmo handler, sem redirect HTTP e sem alterar o método POST. Os testes impedem cadeias de redirect e o uso de aliases pelo código cliente.

## Contratos importantes

### Operações em streaming

As operações longas usam Server-Sent Events com `createSseResponse` no servidor e `consumeSseStream` no cliente. O parser aceita frames fragmentados, CRLF/LF e UTF-8 dividido, valida os níveis de log e exige exatamente um evento final com `done: true`. A conclusão só é entregue aos formulários após o EOF, para rejeitar finais duplicados, dados posteriores ao final e frames incompletos sem registrar sucesso ou histórico. Eventos finais com nível `error` permanecem erro mesmo sem contador de falhas.

O botão de cancelar interrompe a conexão e impede novos passos quando o sinal é observado. Ele não desfaz uma escrita que já tenha sido enviada à Twilio. Writes não são repetidos automaticamente; retry é reservado a leituras seguras e informa cada nova tentativa.

### Limites e processamento

- entradas e históricos locais: no máximo 10 sugestões e 5 registros recentes;
- operações em lote expostas pelos formulários: no máximo 10 itens;
- histórico de mensagens: até 1.000 mensagens carregadas, com aviso de truncamento;
- busca de Tasks por número: até 1.000 resultados, consultando um item adicional para detectar truncamento. A resposta acrescenta `hasMore: boolean`, preservando `tasks` e `phone`; a interface avisa quando a lista é incompleta. Não há paginação de Tasks nesta versão;
- listagens de senders: até 1.000 resultados, com indicação de limitação quando aplicável;
- operações remotas em lote são sequenciais para respeitar limite de API e manter feedback determinístico;
- nomes de plugins do Flex começam com uma letra e aceitam letras, números, hífen e sublinhado, com até 100 caracteres;


### Contexto TaskRouter

A seleção de Workspace usa a chave `switchboard:taskrouter-workspace:<environmentId>`, com SID e nome amigável validados. Nenhum valor legado de autocomplete é removido ou promovido automaticamente a seleção. O último SID válido informado é lembrado; drafts inválidos ficam apenas no formulário. A seleção não dispara writes nem consultas das ferramentas; links de detalhe já existentes conservam sua leitura inicial explícita por URL. Falhas de storage usam o aviso compartilhado; a seleção em memória continua utilizável naquela navegação.

`POST /api/taskrouter/workspaces/list` exige credenciais no body e aceita `pageToken` opcional (até 2.048 caracteres). Retorna `{ workspaces: [{ sid, friendlyName }], nextPageToken }`, com páginas de até 50 itens. Não há seleção automática da primeira opção.

Gerenciar Workers abre em modo individual por padrão. A alternância entre Worker individual e Alteração em lote usa o mesmo controle segmentado da consulta de Tasks; Detalhes, Skills e Plugins permanecem nas abas internas. `?mode=individual` e `?mode=batch` tornam o escopo explícito; links antigos com apenas `?tab=skills` ou `?tab=features` continuam abrindo o modo em lote. No individual, a consulta fica acima dos resultados; as abas Detalhes, Skills e Plugins aparecem somente após localizar um Worker. É necessário resolver o agente antes de escrever; mudar o identificador ou Workspace invalida essa seleção. Ao voltar do lote para o individual, o identificador é conservado e consultado novamente. Nome e SID do alvo aparecem nas abas de edição e na confirmação. A ausência de sobrescrita de uma configuração do Flex não é apresentada como `false`.

### Investigação e primeira experiência

- Ambientes explica como obter as credenciais com a equipe técnica, testar a conexão, salvar e selecionar a conta. O cadastro não seleciona o ambiente automaticamente.
- Consultas por telefone, Task, Worker e listagem de senders executam diretamente, sem confirmação intermediária. Alterações remotas continuam exigindo confirmação.
- A busca de Worker usa SID ou nome amigável exato (`friendlyName`), sem consultar o atributo `email`. Um e-mail só funciona se for o nome amigável; para nomes repetidos, use SID. A configuração de plugins mantém o contrato de SID ou e-mail usado como nome amigável.
- Resultados de Tasks oferecem links para a Conversation identificada nos atributos `conversationSid`, `conversation_id` ou `channelSid`,. Somente SIDs válidos geram links; nenhuma relação é inferida de outros campos.
- Participantes de Conversations com endereço telefônico oferecem uma busca de Tasks com o telefone preenchido. O Workspace do ambiente é reaproveitado quando disponível, e o usuário executa a consulta; não há busca automática nem garantia de correspondência única.
- Os novos links entre ferramentas carregam `environmentId` com os identificadores do recurso. Se o ambiente selecionado for diferente, os campos não são reaproveitados e nenhuma consulta inicial é disparada por esse contexto. Links antigos sem `environmentId` mantêm o comportamento anterior. Credenciais nunca vão na URL.
- A listagem e as exportações de Numbers identificam Programmable Chat como estimativa, sem alterar a deduplicação ou o escopo dos resultados exportados.

### Escritas destrutivas

Formulários que alteram dados remotos exibem aviso e confirmação com o ambiente. O fechamento por número exige prévia explícita e executa somente os alvos revisados, revalidando associação e estado antes de escrever. O endpoint aceita `previewOnly: true` para consultar a prévia e `review` para executar via SSE. A prévia vale por cinco minutos, contém até 1.000 alvos e sinaliza truncamento. Requisições sem esses campos preservam o comportamento anterior.

As três operações SSE (fechamento, skills e plugins) mostram resultados por alvo e preservam confirmações recebidas quando o stream falha. Cancelar não desfaz writes enviados. Históricos são informativos e não reexecutam ações.

Os rascunhos dos formulários de fechamento, Skills e Plugins ficam somente na memória da aba (até 100 campos/escopos), separados por ambiente. Eles são restaurados ao voltar à ferramenta sem executar consultas ou writes. Recarregar/fechar a aba elimina os rascunhos. Links da interface, troca explícita de ambiente e recarregamento/fechamento avisam sobre alterações pendentes; o aviso nativo depende do navegador. Voltar/avançar pelo histórico do navegador não é interceptado, mas os campos preservados em memória continuam disponíveis. Alterações externas do ambiente podem remontar a página e cancelar requests conforme o contrato de isolamento.



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
- O bloqueio de escrita de Workers coordena as abas da mesma tela, não outras sessões, janelas ou clientes Twilio. Atualizações read-modify-write de atributos Twilio não possuem versionamento transacional.
- Os scripts de browser são auxiliares e não instalam Playwright como dependência do projeto.
- A compatibilidade real com contas, permissões, volume e limites da Twilio deve ser validada em um ambiente de homologação autorizado; a suíte usa mocks e não chama uma conta real.

Não existe neste repositório um roadmap oficial de novas funcionalidades. Itens futuros devem ser registrados como trabalho planejado somente quando houver escopo aprovado; documentos históricos de auditoria e redesign não representam backlog.

## Documentação

- Este `README.md` é a fonte de verdade funcional e técnica para pessoas desenvolvedoras.
- `AGENTS.md` contém as instruções operacionais obrigatórias para agentes de IA.
- `CLAUDE.md` existe apenas como ponte para ferramentas que procuram esse nome.
