# AGENTS.md

Guia obrigatório para agentes de IA que operam neste repositório. Leia-o por inteiro antes de alterar arquivos.

## 1. Autoridade documental

- `README.md` é a fonte de verdade funcional e técnica para desenvolvedores.
- `AGENTS.md` é a fonte de verdade operacional para agentes.
- `CLAUDE.md` apenas aponta para este arquivo.
- Não crie documentação paralela de fases, auditorias ou redesign. Atualize `README.md` quando o comportamento ou a estrutura mudar e este arquivo quando as regras de contribuição mudarem.
- Código e testes prevalecem se uma divergência documental for encontrada; corrija a documentação no mesmo trabalho e sinalize a divergência.

## 2. Contexto do projeto

Switchboard é um dashboard interno, em pt-BR, para operações Twilio em Conversations, TaskRouter, Numbers e Flex.

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 16, App Router |
| Linguagem | TypeScript estrito |
| UI | React 19, Tailwind CSS 4, Radix UI/shadcn e Lucide |
| API externa | pacote `twilio` |
| Runtime | Node.js 22 ou superior |
| Persistência | somente `localStorage`; sem banco de dados |

Princípios: clareza antes de abstração, responsabilidade única, composição, segurança por padrão e mudanças incrementais. Não introduza pattern ou camada sem um problema concreto e repetido.

## 3. Arquitetura e boundaries

```text
app/(pages)/                 páginas Server Component e metadata
app/api/                     Route Handlers POST
features/<domain>/components Client Components do domínio
features/<domain>/lib/       regras de negócio e chamadas Twilio
features/<domain>/types.ts   tipos do domínio
features/<domain>/tools.ts   catálogo do domínio
components/                  UI e componentes compartilhados
lib/                         contratos transversais
tests/                       testes Node e scripts auxiliares
```

| Camada | Deve fazer | Não deve fazer |
| --- | --- | --- |
| `app/(pages)` | importar o componente da feature e exportar metadata pt-BR | estado cliente, API ou regra de negócio |
| `app/api` | ler e validar JSON, criar cliente Twilio, orquestrar lib e responder | implementar regra de negócio |
| `features/*/lib` | regra do domínio e SDK Twilio | ler Request, criar Response ou acessar browser |
| `features/*/components` | estado, browser, confirmação e chamada `/api` | importar/usar SDK Twilio |
| `lib` | utilidade usada por mais de um domínio | depender de uma feature específica |

Fluxo esperado: página -> formulário -> endpoint POST -> validação -> `getTwilioClient` -> lib do domínio -> Twilio.

As URLs canônicas e seus aliases ficam em `lib/route-migrations.mjs`. Páginas antigas são redirects permanentes; endpoints antigos apenas reexportam o mesmo `POST`. Não crie redirect para endpoint POST nem cadeia de redirects. Navegação e componentes devem usar somente a rota canônica.

## 4. Regras gerais de código

- Preserve `strict: true`; nunca use `any`. Prefira tipos precisos, `unknown` com guard ou `ReturnType`.
- Remova import, variável, função e branch sem uso. Não deixe código comentado.
- Solução temporária precisa de `// TODO(motivo): descrição` e dívida rastreável.
- Evite duplicação de lógica; procure antes em `lib` e em `features/<domain>/lib`.
- Não extraia uma abstração apenas por semelhança superficial. Como regra prática, espere pelo menos três usos com o mesmo contrato.
- Prefira composição a herança.
- Não altere API pública, payload, DTO, chave de storage ou semântica de rota sem justificar, atualizar testes e documentar compatibilidade.
- Não instale dependência quando a plataforma ou o projeto já resolverem o problema.
- Não faça memoização preventiva; use `useMemo`/`useCallback` apenas com motivo observável.

## 5. Convenções

### Arquivos e símbolos

| Tipo | Convenção | Exemplo |
| --- | --- | --- |
| componente React | `kebab-case.tsx`, símbolo PascalCase | `close-form.tsx`, `CloseForm` |
| hook | arquivo/função `use-*` / `useX` | `use-conversation-query.ts` |
| rota | `route.ts` em pasta semântica | `app/api/conversations/close-by-number/route.ts` |
| utilitário/lib | `kebab-case.ts` | `twilio-client.ts` |
| tipos | PascalCase em `types.ts` | `ConversationData` |
| constante de módulo | `UPPER_SNAKE_CASE` | `MAX_HISTORY` |
| função | camelCase e nome específico | `formatPhoneNumber` |
| chave local | prefixo `switchboard:` e kebab-case | `switchboard:workspace-sids` |

Comentários explicam por que uma decisão não óbvia existe; não narram o código.

### Strings e metadata

- Toda string visível fica em `lib/strings.ts`; não escreva texto de UI inline.
- A interface e a metadata são em pt-BR. Identificadores de protocolo/API podem conservar o nome original.
- Toda página exporta `metadata` com `title` e `description`.

### React e acessibilidade

- Server Component por padrão; use `"use client"` no menor nível que precise de estado, evento ou API do navegador.
- Formulários de feature são Client Components. Extraia hook quando lógica reutilizável ou estado/efeitos extensos prejudicarem a leitura.
- Não faça prop drilling além de dois níveis; use composição ou Context quando houver estado realmente compartilhado.
- Todo campo possui `Label` associado; use elementos semânticos e foco visível.
- Botão sem texto precisa de `aria-label`. Operação destrutiva precisa de rótulo descritivo e `WarningBadge`.
- Regiões de status usam `role="status"`, `role="alert"`, `role="log"` ou `aria-live` conforme o comportamento.
- Interação não pode depender apenas de mouse, hover ou cor.
- Não use `dangerouslySetInnerHTML`; dados Twilio são renderizados por JSX.

## 6. Endpoints, validação e erros

- Route Handlers autorais expõem somente `POST`.
- O body sempre contém `accountSid: string` e `authToken: string`; valide objeto, tipos, formatos, limites e campos do domínio antes de criar o cliente.
- Retorne `400` para entrada inválida. Falha de credencial ou Twilio retorna `500`, exceto status de domínio explicitamente tratado, como conflito.
- Mensagem entregue ao usuário é genérica e vem de `lib/strings.ts`. Nunca retorne stack, payload técnico, token ou mensagem bruta potencialmente sensível.
- `features/*/lib` converte falhas esperadas em `AppError` seguro. Rotas JSON retornam `{ error: string }`; rotas SSE emitem evento `error` final.
- Parâmetros dinâmicos e campos opcionais são validados antes do uso. Não confie na validação feita pelo formulário.
- Não registre `accountSid`, `authToken`, atributos sensíveis ou corpo completo de requisição. Não deixe `console.log` de debug.

## 7. Credenciais e segurança

- `EnvironmentProvider`/`useEnvironment()` é a única fonte de credenciais no cliente.
- Credenciais ficam somente no `localStorage` do navegador e seguem no body POST. O servidor não persiste e não usa variáveis de ambiente como fallback.
- Nunca coloque credenciais em código, `.env.local`, URL, query string, log, resposta ou exportação.
- O projeto não possui autenticação/RBAC próprio. Não descreva a posse de credenciais Twilio como autenticação da aplicação.
- Preserve o princípio de menor acesso nos recursos Twilio usados.
- Antes de adicionar pacote, confira necessidade, licença e vulnerabilidades. Nunca aplique `npm audit fix --force` automaticamente.

Checklist de segurança por mudança:

- nenhuma credencial ou detalhe interno exposto;
- toda entrada externa revalidada no servidor;
- nenhuma stack ou erro bruto retornado;
- nenhum `dangerouslySetInnerHTML`;
- nenhuma dependência vulnerável nova.

## 8. Persistência no navegador

Todo acesso direto a `localStorage` fica em `lib/browser-storage.ts`. Feature e componente usam os módulos de domínio/transversais, nunca `localStorage` diretamente.

- Leitores de JSON usam type guard.
- Falhas de leitura, escrita e remoção disparam o evento compartilhado; `AppShell` mostra o aviso de persistência.
- Leia novamente antes de escrever quando múltiplas instâncias podem alterar a mesma coleção.
- Não remova nem atribua silenciosamente dados legados a um ambiente.

Autocomplete:

- chaves em `lib/stored-keys.ts`;
- leitura/escrita e `VARIABLE_GROUPS` em `lib/variables.ts`;
- cada grupo declara escopo global ou por ambiente;
- limite de 10 valores por chave.

Histórico de operações:

- use `lib/operation-history.ts` para leitura e prepend compartilhados;
- a consulta especializada de Conversation conserva seu hook próprio;
- chave por ambiente: `switchboard:<domain>-history:<environmentId>`;
- limite de 5 entradas;
- históricos de writes são informativos e nunca disparam replay.

## 9. SSE, cancelamento e concorrência

As rotas SSE usam `createSseResponse`, que aplica os headers compartilhados e liga o cancelamento da request/response ao sinal da operação. Os clientes usam `consumeSseStream`.

Contrato obrigatório:

- frame `data: <JSON>\n\n` em UTF-8;
- nível `info`, `success`, `warning` ou `error`;
- exatamente um payload final válido com `done: true`;
- evento final de erro permanece erro;
- malformed frame, EOF sem final e final duplicado são falhas;
- reader e controller são liberados em `finally`;
- todo formulário SSE mantém `AbortController` em ref, oferece cancelar e aborta no unmount/remount;
- cancelamento impede passos posteriores quando observado, mas não desfaz write já enviado.

Use `withRetry` somente em leituras seguras, emitindo warning por tentativa. Nunca repita writes automaticamente. Lotes de escrita são sequenciais; não introduza `Promise.all` sobre recursos Twilio sem uma decisão explícita e proteção contra rate limit/races.

Ao trocar ambiente ou editar suas credenciais, o shell remonta o conteúdo por `environmentId + revision`; requests devem abortar e respostas antigas não podem restaurar estado.

## 10. Regras de negócio que exigem cuidado

- Telefones não têm normalização universal. Fechamento de Conversations, busca por participante e busca de Tasks possuem contratos diferentes; reutilize a função específica da feature.
- Fechamento por número percorre páginas e altera somente Conversations `active`.
- Cancelamento de fila atua somente em Tasks `pending`/`reserved`: cancela a Task antes de tentar mensagem e fechamento; falha ao cancelar impede os efeitos seguintes.
- Atualizações de Worker preservam todos os demais atributos. `false`, `0` e ausência são valores semanticamente distintos.
- Resolução de Worker usa SID WK direto ou `friendlyName` com limite 1; o campo historicamente chamado email não consulta atributo `email`.
- CSV de Workflow usa `;`, BOM opcional, aspas e LF/CRLF; headers obrigatórios `Regra de Negócio` e `Fila Twilio`. Entrada inválida ou sem linha útil não pode criar Workflow.
- Consulta de mensagens carrega no máximo 1.000 e exporta apenas mensagens carregadas e filtradas.
- Numbers prioriza configurações de Conversations na deduplicação; a classificação restante como Programmable Chat é heurística e não deve ser apresentada como origem comprovada.

Quando uma dessas regras precisar mudar, trate como alteração de contrato: acrescente casos de teste e atualize `README.md`.

## 11. Como criar ou modificar funcionalidades

Antes de editar:

1. Leia `README.md` e este arquivo.
2. Inspecione todos os arquivos envolvidos e trace imports/referências com `rg`.
3. Verifique lógica existente em `lib` e `features/<domain>/lib`.
4. Para UI, localize as strings em `lib/strings.ts`.
5. Para autocomplete, revise `lib/stored-keys.ts` e `lib/variables.ts`.
6. Para rota renomeada, revise `lib/route-migrations.mjs` e seus testes.

Sequência para nova ferramenta:

1. `features/<domain>/types.ts`;
2. `features/<domain>/lib/<action>.ts`;
3. `app/api/<domain>/<action>/route.ts`;
4. `features/<domain>/components/<action>-form.tsx`;
5. `app/(pages)/<domain>/<action>/page.tsx`;
6. `lib/strings.ts`;
7. `lib/stored-keys.ts` e `lib/variables.ts`, se houver autocomplete;
8. `components/sidebar-nav.tsx`;
9. `features/<domain>/tools.ts`;
10. testes da regra, rota e estados críticos;
11. `README.md`, se o comportamento público, endpoint ou limitação mudar.

Os dois registros de navegação são obrigatórios e deliberadamente separados: sidebar e catálogo do domínio. `Tool.available` controla link versus “em breve”; não anuncie funcionalidade como disponível antes da implementação.

## 12. Testes

`npm test` executa as suítes Node em `tests/*.test.mjs`. Priorize comportamento e invariantes, não detalhes internos.

- Route Handler: JSON inválido, body não objeto, credenciais ausentes, formatos/limites, status e sanitização.
- Regra de negócio: golden path, vazio, resultado parcial, falha intermediária, preservação de dados e nenhuma escrita em entrada inválida.
- SSE: fragmentação, UTF-8, CRLF/LF, final único, erro final, EOF, abort e cleanup.
- Persistência: JSON corrompido, type guard, falha de storage, escopo e compatibilidade legada.
- Writes: confirmação, double submit, cancelamento, nenhuma repetição automática e nenhum replay por histórico.

O loader `tests/typescript-loader.mjs` possui duas políticas: `createLoader(overrides)` mantém cache isolado naquela instância; `load(relative, overrides)` recarrega módulos TypeScript sem cache. Preserve a política usada por cada suíte.

Scripts `tests/redesign-browser.mjs`, `tests/redesign-preview.mjs` e `tests/route-migrations-http.mjs` são auxiliares e não pertencem a `npm test`. Os dois primeiros dependem de Playwright externo. Validação SSR não substitui teclado, foco, viewport e contraste em browser.

## 13. Validação obrigatória

Antes de declarar uma mudança concluída, execute separadamente:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Além dos comandos, confirme conforme o escopo:

### Código e arquitetura

- sem `any`, código morto, import não usado, debug ou código comentado;
- boundaries preservados e sem dependência circular nova;
- nenhuma API pública alterada sem teste e justificativa;
- nenhuma dependência adicionada sem necessidade comprovada.

### UI e acessibilidade

- strings e metadata em pt-BR via `lib/strings.ts`;
- labels, nomes acessíveis, foco e navegação por teclado;
- `WarningBadge` e confirmação em writes;
- estados de loading, vazio, erro, parcial e cancelado coerentes;
- registro da ferramenta na sidebar e no catálogo.

### Segurança e persistência

- credenciais ausentes de código, logs, URLs e respostas;
- validação server-side antes do cliente Twilio;
- storage via fronteira compartilhada, com guard, escopo e prefixo corretos;
- compatibilidade dos dados legados preservada.

### SSE

- final único com `done: true`;
- headers e parser compartilhados;
- `AbortController`, cancelamento e cleanup;
- nenhum retry automático de escrita.

Faça também validação manual do golden path e dos principais edge cases da funcionalidade alterada. Operações reais de escrita só podem ser testadas em ambiente Twilio autorizado e com o alvo revisado.
