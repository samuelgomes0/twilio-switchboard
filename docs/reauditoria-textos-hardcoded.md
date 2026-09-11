# Reauditoria de centralização de textos

Data: 10/09/2026. Referência: [inventário inicial](auditoria-textos-hardcoded.md).

## Resultado

Os 160 pontos de origem inventariados foram tratados: 54 de apresentação e 106 de servidor. Textos próprios da aplicação agora vêm de `lib/strings.ts`, incluindo mensagens dinâmicas, acessibilidade, placeholders, rótulos de variáveis, exportações e respostas de API/SSE. A nova revisão não confirmou ocorrências remanescentes de mensagens linguísticas hardcoded no código da aplicação, dentro dos critérios abaixo.

O catálogo também passou a fornecer os formatos de duração e o nome do arquivo de mensagens. “Toggle sidebar” foi traduzido. Dados de serviços em Numbers mantêm os valores do contrato, mas tabela e exportações usam os rótulos do catálogo.

Não se trata de uma garantia de ausência de qualquer texto em tempo de execução: mensagens de participantes, nomes de recursos, JSON de atributos e diagnósticos produzidos pelo framework ou navegador não são conteúdo autoral do catálogo.

## Correções e preservação de comportamento

| Área | Resultado |
| --- | --- |
| Componentes compartilhados | Ações de salvar/remover centralizadas; campo de nome do contato associado a um Label e botão de confirmação com nome acessível |
| Teclado | Ações de autocomplete de contatos e valores usam `onClick`, funcionam com ativação nativa por teclado e mantêm a prevenção de blur no mouse; remoção alcançável por Tab e com foco visível |
| Contatos, variáveis e ambientes | Rótulos acessíveis centralizados; reutilização das mensagens existentes para editar contato e mostrar/ocultar token |
| Grupos de autocomplete | `STORED_KEY_LABELS` e `VARIABLE_GROUPS` referenciam `strings.variables.groups`, mantendo as chaves e grupos existentes |
| Formulários | Placeholders centralizados, sem alterar formatos aceitos nem os exemplos apresentados |
| Exportação | SID, nome de planilha, nome de arquivo e rótulos de serviços vêm do catálogo; formatos CSV/XLSX preservados |
| API/SSE | Validações, progresso, retry e conclusão vêm de mensagens tipadas; payloads, contadores, níveis e `done: true` preservados |
| Encerramento de fila | Mensagem padrão e motivo da operação centralizados; texto enviado ao participante preservado literalmente |
| Erros externos | Removida a exibição direta de `err.message`; erros de CSV próprios usam `AppError`, enquanto falhas inesperadas mostram mensagens genéricas |
| Logs técnicos | Exceções externas completas não são mais registradas pelos helpers alterados; apenas status/code numéricos no tratamento compartilhado |

Não houve mudança nas assinaturas públicas, nos endpoints, nas chaves de persistência ou nas regras de negócio das operações. Os erros de validação de CSV agora são instâncias de `AppError`, subclasse de `Error`, para permitir distinguir mensagens próprias de exceções inesperadas. A constante exportada `DEFAULT_CLOSE_MESSAGE` foi mantida como alias; o formulário deixou de importar o módulo de negócio que depende do Twilio.

## Método da nova auditoria

Foram novamente pesquisados os 136 arquivos TypeScript/TSX em `app`, `components`, `features` e `lib`, com revisão do catálogo e das referências de cada grupo afetado. Desta vez, Node.js foi localizado e o parser TypeScript instalado no projeto foi utilizado.

As verificações combinaram:

1. Nós JSX de texto e atributos `placeholder`, `aria-label`, `title` e `alt` com valores literais.
2. Literais e templates com palavras, acentos ou letras maiúsculas fora do catálogo, seguidos de classificação contextual.
3. Chamadas a erros, geração de SSE, validações JSON, exportações e consumo de mensagens pelos formulários.
4. Busca por `err.message`, `error.message`, `console.log` e `dangerouslySetInnerHTML` nos diretórios da aplicação: nenhuma ocorrência restante.
5. Revisão do diff para preservar parâmetros, mensagens de operação, estados e contratos.

A primeira passagem pelo AST levantou 34 candidatos, todos classificados como valores técnicos ou sinais de apresentação. Uma passagem complementar por literais e templates confirmou os casos abaixo. Não foi adicionada regra de lint nem dependência de auditoria.

## Valores que permanecem fora do catálogo

| Valor ou categoria | Motivo |
| --- | --- |
| `Regra de Negócio`, `Fila Twilio`, `Fechar`, `EVERYONE` em `create-workflow.ts` | Contrato do CSV, sentinela de processamento e nome de fila; não são mensagens de interface |
| `Available` e `Offline` em `fetch-worker-form.tsx` | Comparações de valores recebidos do Twilio para selecionar estilo |
| `Conversations` e `Programmable Chat` em tipos, filtros e serviço de Numbers | Identificadores do contrato; a apresentação usa os rótulos centralizados |
| `POST`, `GET`, MIME types, cabeçalhos SSE e expressões de roteamento | Protocolo e integração; os rótulos das opções de método HTTP foram centralizados |
| `whatsapp:+55`, locales, unidades Intl, padrões de data | Formatação e protocolo; não frases a serem traduzidas |
| Classes, IDs, URLs de navegação, chaves de storage e delimitadores CSV | Estrutura técnica |
| `—`, `…`/`...`, `·`, `%`, `/`, `*`, ícones e máscara de token | Separadores, indicadores gráficos e formatação |
| Erro de uso de `useEnvironment` fora do provider | Diagnóstico de programação; não faz parte do fluxo normal da interface |
| Nomes, autores, conteúdo de mensagens e atributos retornados | Dados externos; preservados como recebidos |

O relógio de `LogOutput` mantém `en-US` com formato de 24 horas: é configuração de formatação, não um texto fora do catálogo. O manifesto mantém nomes vazios; esse ponto não foi transformado em alteração de produto nesta tarefa.

## Validação

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | Aprovado |
| `npm run build` | Aprovado; 42 páginas geradas após liberar o acesso às fontes Google |
| Testes existentes | 15 aprovados |
| `node --test tests/operation-messages.test.mjs` | 8 aprovados, sem chamadas reais ao Twilio |
| ESLint dos testes novos | Aprovado |
| `npm run lint` | 17 erros preexistentes de `react-hooks/set-state-in-effect`; nenhum erro novo nos arquivos auditados |

Os 17 erros foram comparados com o conteúdo de `HEAD` dos mesmos arquivos usando a API do ESLint: cada arquivo apresenta o mesmo erro antes e depois. Eles afetam a leitura inicial de estado/localStorage e a barra de progresso. Corrigi-los exigiria rever o gerenciamento de estado, fora do escopo de centralização de textos; não foram desabilitadas regras para ocultá-los.

Os testes novos cobrem respostas/logs seguros, exceções nulas e inesperadas, conclusão SSE com erro, erro de CSV útil sem escrita, continuação de lote após erro, retry, criação de workflow com preservação da configuração e encerramento de conversa com contadores finais. Os testes existentes também cobrem cancelamento de alteração de features de Workers.

## Limitações e riscos

Não houve validação visual ou interação em navegador nesta sessão. A revisão de acessibilidade e teclado foi feita no código; os testes executados usam Twilio simulado. Não foram enviadas mensagens nem modificados recursos reais. A revisão não certifica todas as regras de segurança, validação de entrada ou cancelamento dos fluxos legados.

A mudança intencional de comportamento é mostrar mensagens genéricas para exceções externas, evitando que detalhes técnicos ou mensagens em inglês cheguem ao usuário. Validações próprias conhecidas continuam informativas. A revisão de estado React indicada pelo lint permanece como pendência independente.

O catálogo ainda contém alguns textos iguais sob chaves com finalidades diferentes. Isso não viola a centralização física; não foram unificadas indiscriminadamente mensagens específicas de telas. Os rótulos de grupos de variáveis, duplicados em dois módulos, compartilham agora a mesma origem.
