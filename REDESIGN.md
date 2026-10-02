# Redesenho do Switchboard

## Direção visual

Esta versão substitui a proposta anterior pela direção das duas referências fornecidas: aplicações operacionais claras, navegação lateral compacta, tipografia pequena e legível, listas com divisórias finas e controles discretos. A skill `frontend-design` foi lida e aplicada. As referências orientam a composição; não introduzem funcionalidades de CRM que o Switchboard não possui.

A captura apresentada pelo usuário revelou que a proposta anterior mantinha grandes vazios, a home com apenas cinco áreas e tema escuro herdado. Esta revisão muda a composição: área branca ocupando toda a viewport, sem moldura ou margens externas, sidebar de 200px e conteúdo com espaçamento horizontal de 48px no desktop (a partir de 1024px), 32px no tablet (768–1023px) e 20px no mobile. A home mostra as 13 ferramentas em uma tabela compacta, com propósito, área em marcador pastel, busca e filtro por domínio. O resumo superior usa apenas contagens reais dos catálogos e o ambiente selecionado. Não há métricas fictícias, gráficos decorativos, hero promocional ou numeração ornamental.

## Sistema visual

Todas as pesquisas usam o mesmo estilo `search-control`: fundo, borda, raio de 6px, altura, hover e foco por teclado. `SearchInput` compartilha o ícone e a apresentação entre diretório, diálogo global, Numbers, mensagens e Tasks. Campos com autocomplete/prefixo preservam `StoredInput`/`ContactInput` e aplicam o mesmo estilo, mantendo suas sugestões, normalização e validações. As cores usam os tokens dos temas claro e escuro.

`--workspace-gutter` centraliza o alinhamento lateral do header e do conteúdo: 48px no desktop, 32px no tablet e 20px no mobile. Na Visão Geral, o botão Configurar ambiente fica centralizado verticalmente com título e subtítulo; o cabeçalho da tabela tem 8px de separação da primeira linha. Nos demais cabeçalhos, ações ficam alinhadas pelo topo; páginas não têm um limite geral de largura distinto do header. Formulários conservam seu limite de leitura próprio. O cabeçalho da tabela da Visão Geral possui cantos de 6px e espaçamento de células separado para renderizar esse raio corretamente.

Tokens centralizados em `app/globals.css`, compatíveis com Tailwind 4 e os componentes existentes:

| Elemento | Tema claro | Uso |
| --- | --- | --- |
| Fundo e superfícies | `#ffffff` | Área de trabalho e campos |
| Sidebar | `#fafafa` | Navegação persistente |
| Superfície secundária | `#f5f5f5` | Formulários, contexto e logs |
| Texto | `#202020` | Informação principal |
| Texto secundário | `#666666` | Descrições e metadados |
| Vermelho de marca | `#f22f46` | Marca gráfica do Switchboard |
| Ação principal | `#d61f36` / branco | Consulta, confirmação e salvamento; variante mais escura para contraste |
| Hover principal | `#b7192d` | Botões principais sem redução de opacidade |
| Seleção suave | `#fff0f2` | Item ativo da navegação |
| Divisórias / campos | `#ededed` / `#d9d9d9` | Separação e identificação de controles |
| Sucesso | `#25724c` / `#e4f3e9` | Resultado positivo |
| Atenção | `#826413` / `#f8f0d3` | Risco e observações |
| Informação | `#446882` / `#e8f0f5` | Estados informativos |
| Destrutivo | `#b42336` | Alteração destrutiva e erro |

A paleta primária usa o vermelho Twilio como referência (`#f22f46`, documentado no [repositório Twilio Labs](https://github.com/twilio-labs/open-pixel-art)). Em botões com texto pequeno branco, a variante `#d61f36` mantém contraste maior; no tema escuro, `#ff8a98` com texto `#3b0610` mantém a legibilidade. Marca, botões, filtros selecionados, navegação ativa, tabs e foco das buscas recebem a cor primária. Sucesso, atenção, informação e operações destrutivas conservam seus tokens semânticos.

Geist é a fonte de interface; Geist Mono diferencia SIDs, JSON e logs. Títulos de página têm 20px (18px na home), descrições 12–13px e texto operacional entre 12 e 14px. Identificadores continuam selecionáveis. Raios de 4–8px e bordas finas mantêm a densidade das referências. A área principal não usa moldura arredondada ou sombra externa; painéis internos não recebem sombras decorativas.

O tema claro agora é o padrão independente do sistema operacional. A preferência visual desta versão usa `switchboard:theme`; a antiga chave `theme` não é removida, mas não determina a apresentação inicial. Isso evita herdar a aparência escura da proposta rejeitada. Tema claro/escuro/sistema e atalho D continuam disponíveis, com escolhas futuras persistidas na nova chave. Nenhuma chave de credenciais, contatos, autocomplete ou histórico foi alterada. Não foi introduzida dependência de fontes adicional: o projeto continua usando `next/font` com Geist e Geist Mono.

## Layout e componentes

| Componente | Responsabilidade |
| --- | --- |
| `AppShell` | Sidebar, cabeçalho fixo, seletor de ambiente, tema, navegação mobile e landmark principal |
| `SidebarNav` | Grupos por domínio, página ativa, expansão explícita e links originais |
| `CommandMenu` | Busca global de ferramentas e configurações por nome/descrição; Ctrl/Cmd+K, Enter e Escape |
| `SearchInput` | Pesquisa com ícone, estilo compartilhado e labels acessíveis, mantendo as props e handlers dos consumidores |
| `EnvironmentSelector` | Seleção do ambiente e acesso à configuração; não exibe credenciais no cabeçalho |
| `ToolDirectory` | Tabela das 13 ferramentas disponíveis, busca local, filtro por área, contagens reais e ambiente selecionado |
| `PageHeader` | Título, descrição, caminho de navegação, avisos e ações |
| `ToolCatalog` / `ToolCard` | Lista de ferramentas disponíveis e futuras, preservando `available` |
| `ActionBar` / `ActionButton` / `InputActions` | Agrupamento e hierarquia de ações, sem executar regras de negócio |
| `EmptyState` | Região vazia com propósito e instrução |
| `ClipboardButton` | Cópia com sucesso ou falha anunciados |
| `TaskResultCard` | Apresentação dos dados de Task e seus identificadores |
| `useBrowserState` | Leitura de estado do navegador depois da hidratação, com recarga por escopo |

Formulários continuam pertencendo aos domínios; regras, estados de execução, payloads e eventos permanecem nos respectivos módulos. Não houve migração para biblioteca de formulários nem novo estado global. A sidebar mantém seus arrays separados dos catálogos dos domínios.

## Responsividade e acessibilidade implementadas

- Aplicação com 100% da largura e altura mínima da viewport, sem limite externo de largura, e sidebar de 200px a partir de 1024px; abaixo disso, navegação em Dialog Radix com confinamento de foco, Escape e fechamento ao navegar. Em mobile, a janela ocupa toda a tela.
- Conteúdo alinhado à esquerda; campos relacionados em duas colunas a partir de 768px. O resumo da home muda de quatro para duas colunas em mobile; a coluna de descrição da tabela é ocultada, mantendo acesso, nome e área.
- Controles de 36px no desktop e mínimo de 44px nos botões de interface em mobile; campos de 16px em telas pequenas para evitar zoom automático.
- Tabelas extensas têm rolagem interna; conteúdo e credenciais usam colunas com `minmax(0,1fr)` e quebra de texto.
- Skip link, `<main>`, navegação identificada, foco visível, labels e relações ARIA dos formulários foram mantidos e padronizados.
- Tabs usam linha de estado ativo; mensagens de erro, loading e logs conservam seus papéis acessíveis.
- Autocomplete oferece navegação por setas; exclusão de sugestões fica visível e alcançável também por toque.
- Logs rolam dentro da própria região, sem deslocar a página a cada evento. Movimento reduzido é respeitado.

Capturas da home foram inspecionadas em desktop e mobile. A home foi verificada em 1920, 1440, 768, 375 e 320px; as 20 páginas diretas passaram nas verificações de largura em 320, 375, 768, 1024 e 1440px. Dispositivos físicos e auditoria WCAG completa não foram realizados.

## Inventário funcional preservado

| Página ou fluxo | Rotas principais | Requisitos preservados |
| --- | --- | --- |
| Visão geral e catálogos | `/`, `/conversations`, `/taskrouter`, `/numbers`, `/flex`, `/settings` | Acesso a todos os domínios e distinção entre ferramenta disponível e futura |
| Consultar Conversation | `/conversations/consult` | SID, `sid`/`tab` na URL, detalhes e participantes, mensagens carregadas sob demanda, filtros, histórico e exportação CSV |
| Localizar por participante | `/conversations/fetch-by-participant` | Endereço WhatsApp, filtros de estado, consulta e paginação por token |
| Encerrar Conversations | `/conversations/close` | Normalização existente, múltiplos números, confirmação, somente conversas ativas, SSE, totais e histórico |
| Gerenciar Workers | `/taskrouter/workers` | Workspace compartilhado, consulta por SID/e-mail, atribuição de skill, feature booleana incluindo `false`, tabs montadas e cancelamento |
| Buscar Tasks | `/taskrouter/search-tasks`, `/taskrouter/fetch-task` | Critérios existentes, atributos, status/canal, cópia de SID e resultado vazio |
| Cancelar Tasks da fila | `/taskrouter/cancel-queue-tasks` | Fila, mensagem, confirmação, sequência de efeitos no backend, logs e resultados parciais |
| Criar Workflow | `/taskrouter/create-workflow` | Importação CSV/JSON, campos e formatos existentes, preview, confirmação e SSE |
| Adicionar filtro | `/taskrouter/add-particular-filter` | Pares Workflow/TaskQueue, nome, prioridade existente, confirmação e execução sequencial |
| Listar Numbers | `/numbers/list` | Fontes existentes, deduplicação, filtros/ordenação locais, CSV e XLSX de todos os resultados carregados |
| Configurar endereço Flex | `/flex/create-address-config` | Tipo condicional, integração e criação automática, validações e conflito retornado pelo servidor |
| Ambientes | `/settings/environments` | Cadastro, edição, verificação, ativação, remoção, token mascarado e mesmas chaves locais |
| Contatos | `/settings/contacts` | CRUD local, busca, telefone e reutilização nos formulários |
| Variáveis | `/settings/variables` | Grupos existentes, autocomplete por ambiente, edição/exclusão/limpeza e limites atuais |

As rotas de compatibilidade e redirects continuam existentes. A contagem da auditoria é de 25 URLs de páginas: 20 acessos diretos e cinco redirects; existem 15 endpoints POST e seis consumidores SSE.

## Contratos e limites

Não foram alterados endpoints, nomes ou formatos de payloads, autenticação Twilio, validadores de servidor, tipos de domínio, chamadas do SDK ou regras de negócio do backend. A comparação de hashes dos 15 Route Handlers e 11 utilitários compartilhados com o início do redesign confirmou igualdade.

Credenciais continuam vindo de `EnvironmentProvider`, persistidas nas mesmas chaves do navegador e enviadas no corpo POST. Não existe autenticação/RBAC da aplicação. O fallback de credenciais de servidor continua sendo uma condição existente, descrita na auditoria; a interface não inventa permissões.

Históricos continuam limitados a cinco entradas; autocomplete mantém limite de dez. Os históricos de escrita permanecem informativos, sem repetir operações ao clicar. A consulta de Conversation conserva seu escopo por ambiente e fallback de histórico legado. Nenhuma migração de armazenamento foi introduzida.

O cancelamento de cinco fluxos SSE interrompe o acompanhamento no cliente, mas não garante interrupção de operações já enviadas ao backend. Worker Feature mantém propagação de cancelamento. Esse limite é explicado na interface; não foi alterado silenciosamente.

CSV de mensagens conserva o subconjunto filtrado, separador, BOM e proteção existente. A exportação de Numbers continua incluindo todos os resultados carregados, mesmo com filtros ativos, agora com aviso explícito. XLSX é importado apenas quando solicitado para exportação.

## Simplificações e mudanças de experiência

- Removidos o hero, sidebar azul e cartões numerados da primeira proposta.
- Substituída a home de cinco linhas e painel lateral pela tabela com acesso direto às 13 ferramentas. `WorkspaceContext`, sem consumidores restantes, foi removido; o ambiente é exibido no resumo real da home.
- `progress-bar.tsx` foi removido após busca de referências: não era utilizado e simulava progresso por temporizador. O acompanhamento continua usando estados reais e SSE.
- Cabeçalhos repetidos e apresentação de Task foram concentrados em componentes compartilhados.
- Leitura de browser storage usa fallback consistente entre SSR e primeira renderização, conservando transformações e gravações dos domínios.
- Worker management deixa de renderizar controles duplicados de workspace/cabeçalho dentro dos painéis, mantendo seu estado e montagem das tabs.
- Botões de histórico informativo não sugerem uma ação inexistente. O título explicita o histórico local do navegador.
- Corrigido overflow do resultado Flex em mobile: SID quebra dentro do cabeçalho e o marcador de tipo permanece dentro do card. O cenário passou após a correção.

Os problemas de segurança, dependências, limites de paginação e comportamento de backend registrados em `AUDIT.md` não foram tratados por este trabalho visual. Arquivos que já estavam modificados antes do redesign foram preservados.

## Validação executada

| Verificação | Resultado |
| --- | --- |
| `npm test` | 118 testes passaram; nenhum falhou |
| `npm run typecheck` | Passou |
| `npm run lint` | Passou |
| `npm run build` | Passou, incluindo geração das rotas |
| Comparação dos arquivos de API/utilitários | 26 arquivos iguais ao início do redesign |
| Operações em conta Twilio real | Não executadas |
| Capturas da home | Edge headless em cinco larguras; tema claro confirmado mesmo com sistema/preferência legada escuros; sem overflow |
| Diretório de ferramentas | Busca, filtro por área, estado vazio, restauração da lista e Ctrl+K/Escape passaram |
| Estilo de pesquisa e alinhamento | Igualdade de fundo, borda, raio, altura e fonte em repouso; hover e foco nos temas claro/escuro; gutters iguais entre header/conteúdo e cantos de 6px na tabela passaram |
| Layout e navegação | 20 páginas × cinco larguras; foco confinado, Escape e retorno ao botão mobile passaram |
| Fluxos simulados no navegador | Conversations, CSV filtrado, paginação, Workers/skills/feature `false`, quatro operações SSE, confirmação/cancelamento, Numbers/exportação total, Flex, erro/vazio, redirects e tema passaram |

O build inicialmente falhou no sandbox ao baixar fontes do Google Fonts. A execução autorizada com rede concluiu com sucesso. Testes SSR verificam markup e estados sem executar effects, eventos ou layout CSS; os testes Node de SSE exercitam os consumidores extraídos e rotas/serviços simulados. Eles não substituem teste visual.

### Suíte opcional de navegador

`tests/redesign-browser.mjs` prepara credenciais fictícias, intercepta `/api/**` e simula resultados, erro e estado vazio. Verifica páginas em 320, 375, 768, 1024 e 1440px, navegação mobile, downloads, confirmações, Workers, consulta, redirects e tema. O cenário de cache de mensagens aceita a requisição inicial abortada pelo Strict Mode no desenvolvimento, mas exige que alternar abas não refaça a consulta. `SWITCHBOARD_TEST_FLOWS_ONLY=1` permite executar os fluxos sem repetir a matriz de layouts.

`tests/redesign-preview.mjs` captura a home em cinco larguras e verifica o tema inicial, transbordamento, busca, filtro, vazio e comando de navegação em um navegador isolado sem credenciais reais. Todas as chamadas de API são bloqueadas nesse script.

Com o servidor local iniciado, Edge instalado e uma instalação externa de Playwright disponível:

```powershell
$env:SWITCHBOARD_PLAYWRIGHT_PATH = 'C:/caminho/para/node_modules/playwright'
node tests/redesign-browser.mjs
node tests/redesign-preview.mjs
```

O endereço padrão é `http://127.0.0.1:3000`; `SWITCHBOARD_TEST_URL` permite alterá-lo. Não foi adicionada dependência de produção ou desenvolvimento. As capturas atuais estão em `.next/redesign/directory-<largura>.png`; capturas da primeira proposta não representam o desenho atual.

Antes de publicação, validar visualmente os fluxos da tabela em desktop, tablet e mobile, incluindo nomes/identificadores longos, ausência de ambiente, histórico persistido, teclado, diálogos e logs. Confirmar também os caminhos reais de Twilio em ambiente de homologação com autorização apropriada.
