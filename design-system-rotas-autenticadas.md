# Wynston — Design System e estrutura das rotas privadas

Extração do código local em 13/11/2026. Documento independente para orientar a reprodução da interface em outro projeto, inclusive com outra stack. Contempla as 12 rotas em `app/(private)`, seus componentes de domínio e os elementos globais usados por elas. Landing page e login ficam fora do escopo.

**Base da extração:** arquivos atuais do workspace, incluindo alterações ainda não commitadas. A análise é estática: não houve validação visual em navegador. Medidas descrevem o CSS declarado; possíveis sobrescritas e limitações estão indicadas. O grupo `(private)` organiza as telas internas; seu layout atual inicializa dados locais, mas não constitui por si só uma barreira de autenticação. Implemente a proteção de sessão conforme o projeto de destino.

## 1. Identidade visual

Aplicação de finanças com foco em leitura rápida, formulários compactos e comparação de valores. A identidade combina azul de ação, neutros frios, títulos monoespaçados, números tabulares e controles com cantos muito arredondados. A densidade vem de tabelas e cards, com bastante separação entre blocos. Não há fotografias ou ilustrações necessárias às telas internas.

A hierarquia visual segue: contexto da página → filtros e ação principal → resumo → análise ou coleção → detalhes sob demanda. Cores semânticas acompanham rótulos, ícones ou sinais para distinguir entradas, saídas e alertas.

## 2. Tokens de cor — valores exatos

Tokens em OKLCH extraídos de `app/globals.css`. São a referência normativa para os dois temas. `foreground` é o texto sobre a superfície do mesmo grupo; `muted-foreground` atende descrições e metadados.

| Token CSS | Claro | Escuro |
| --- | --- | --- |
| `--card` | `oklch(1 0 0)` | `oklch(0.218 0.008 223.9)` |
| `--card-foreground` | `oklch(0.148 0.004 228.8)` | `oklch(0.987 0.002 197.1)` |
| `--popover` | `oklch(1 0 0)` | `oklch(0.218 0.008 223.9)` |
| `--popover-foreground` | `oklch(0.148 0.004 228.8)` | `oklch(0.987 0.002 197.1)` |
| `--primary` | `oklch(0.488 0.217 264.376)` | `oklch(0.707 0.165 254.624)` |
| `--primary-foreground` | `oklch(1 0 0)` | `oklch(0.162954 0.055618 255.990558)` |
| `--secondary` | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` |
| `--secondary-foreground` | `oklch(0.21 0.006 285.885)` | `oklch(0.985 0 0)` |
| `--muted` | `oklch(0.963 0.002 197.1)` | `oklch(0.275 0.011 216.9)` |
| `--muted-foreground` | `oklch(0.53 0.021 213.5)` | `oklch(0.723 0.014 214.4)` |
| `--accent` | `oklch(0.963 0.002 197.1)` | `oklch(0.275 0.011 216.9)` |
| `--accent-foreground` | `oklch(0.218 0.008 223.9)` | `oklch(0.987 0.002 197.1)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |
| `--border` | `oklch(0.925 0.005 214.3)` | `oklch(1 0 0 / 10%)` |
| `--input` | `oklch(0.925 0.005 214.3)` | `oklch(1 0 0 / 15%)` |
| `--ring` | `oklch(0.488 0.217 264.376)` | `oklch(0.707 0.165 254.624)` |
| `--chart-1` | `oklch(0.882 0.059 254.128)` | `oklch(0.882 0.059 254.128)` |
| `--chart-2` | `oklch(0.707 0.165 254.624)` | `oklch(0.707 0.165 254.624)` |
| `--chart-3` | `oklch(0.623 0.214 259.815)` | `oklch(0.623 0.214 259.815)` |
| `--chart-4` | `oklch(0.488 0.217 264.376)` | `oklch(0.488 0.217 264.376)` |
| `--chart-5` | `oklch(0.379 0.146 265.522)` | `oklch(0.379 0.146 265.522)` |
| `--sidebar` | `oklch(0.987 0.002 197.1)` | `oklch(0.218 0.008 223.9)` |
| `--sidebar-foreground` | `oklch(0.148 0.004 228.8)` | `oklch(0.987 0.002 197.1)` |
| `--sidebar-primary` | `oklch(0.488 0.217 264.376)` | `oklch(0.707 0.165 254.624)` |
| `--sidebar-primary-foreground` | `oklch(1 0 0)` | `oklch(0.162954 0.055618 255.990558)` |
| `--sidebar-accent` | `oklch(0.963 0.002 197.1)` | `oklch(0.275 0.011 216.9)` |
| `--sidebar-accent-foreground` | `oklch(0.218 0.008 223.9)` | `oklch(0.987 0.002 197.1)` |
| `--sidebar-border` | `oklch(0.925 0.005 214.3)` | `oklch(1 0 0 / 10%)` |
| `--sidebar-ring` | `oklch(0.488 0.217 264.376)` | `oklch(0.707 0.165 254.624)` |
| `--background` | `oklch(1 0 0)` | `oklch(0.148 0.004 228.8)` |
| `--foreground` | `oklch(0.148 0.004 228.8)` | `oklch(0.987 0.002 197.1)` |

### Aplicação da paleta

- `background`/`foreground`: canvas e texto principal.
- `card` e `popover`: cards e superfícies flutuantes; no escuro são mais claros que o canvas.
- `primary`: ações principais, marca e seleções. O azul de `sidebar-primary` tem valores próprios para contraste em cada tema.
- `muted`: áreas auxiliares, trilhas de progresso, hover e skeletons; `secondary`: controles secundários.
- `border`/`input`: separação e contorno; `ring`: foco visível.
- `destructive`: saídas, exclusão, erro ou saldo negativo conforme o contexto.
- `chart-1` a `chart-5`: escala azul disponível. Nem todos os gráficos usam essa escala: há cores explícitas de séries.

Cores adicionais observadas: entradas `#10b981`; despesas `#ef4444`; saldo/projeção `#6366f1`. Textos positivos usam `emerald-600` no claro e `emerald-400` no escuro; atenção usa `amber-600`/`amber-400`; variação negativa também aparece em `rose-600`/`rose-400`. Categorias, metas, lembretes e simulações podem ter cor própria. Essas cores de domínio não substituem o azul da marca.

Tema: classe `.dark`, preferência inicial do sistema, alternativas Claro/Escuro/Sistema em Configurações. A regra `.force-light` atende a landing e não deve ser aplicada ao shell privado.

## 3. Tipografia

| Papel | Família | Tamanho e aplicação |
| --- | --- | --- |
| Interface e corpo | Outfit, sans-serif | 14px/20px nos componentes; corpo global sem tamanho adicional explícito |
| Título de página | Manrope, sans-serif | 24px/32px, peso 600, tracking tight em grande parte das telas |
| Título de card | Manrope | 16px/24px, peso 500; variantes locais de 14px ou peso 600 |
| Valores financeiros | Geist Mono, monospace | `.financial-value`, números tabulares; tamanho herdado do contexto |
| Descrição | Outfit | 14px/20px, `muted-foreground` |
| Metadados e badges | Outfit | 12px/16px |
| Eixos de gráficos | Mono nos valores | Geralmente 11px |
| Score principal | Manrope | 36px/40px, peso 700, linha compacta no gauge |

Fontes carregadas pelo layout raiz, subset latin. O token `--font-heading` usa Manrope e é aplicado globalmente a `h1`–`h6` e aos títulos de cards e diálogos. Identificadores e dados técnicos fora de títulos usam Geist Mono com `font-mono`. Interface em português brasileiro; números, moeda e datas seguem os formatadores e preferências do usuário.

## 4. Layout, medidas e responsividade

### Shell compartilhado

```text
Viewport
├── Sidebar à esquerda
│   ├── Marca e subtítulo
│   ├── Navegação em 4 grupos
│   └── Suporte e atalhos
└── Área principal flexível
    ├── Header: menu | separador | breadcrumb       valores | sino | tema
    └── Main: conteúdo da rota com padding de 40px
```

- Sidebar desktop: 256px (`16rem`), recolhida: 48px (`3rem`); fixa, altura da viewport, conteúdo interno rolável.
- Sidebar mobile: Sheet lateral de 288px (`18rem`); a navegação fecha o painel ao selecionar uma rota.
- Mudança para comportamento mobile abaixo de 768px. Desktop usa sidebar visível a partir de `md`.
- Header: alinhamento horizontal, gap 12px, borda inferior, padding horizontal 16px. O código combina `h-12` (48px) e `py-8` (32px por lado); não trate 48px como altura final garantida.
- Main: `flex-1`, overflow automático e padding 40px em todas as larguras, sem redução mobile declarada.
- Páginas: coluna com gap 24px; cabeçalho com título e descrição separados por 4px. Ação principal à direita quando existente.
- Grids de cards de domínio: 1 coluna → 2 em `sm` (640px) → 3 em `xl` (1280px), gap 16px.
- KPIs do dashboard: 1 → 2 em `sm` → 4 em `xl`. Blocos analíticos pareados: 2 colunas a partir de `lg` (1024px).
- Projeção: uma coluna; em `lg`, coluna de controle com 1 fração e gráfico com 2 frações.
- Score: em `lg`, resumo de largura 288px ao lado da grade de pilares; pilares em 2 colunas a partir de `sm`, 3 em `lg`.
- Filtros usam wrap onde declarado; tabelas mantêm overflow horizontal. A tabela de transações orienta a deslizar para ver todas as colunas.
- Configurações adiciona `p-6` (24px) dentro do main, além dos 40px do shell. É uma particularidade atual, não uma regra geral.

### Escala espacial recorrente

| Valor | Aplicação |
| --- | --- |
| 4px | Separação título/descrição e itens compactos |
| 6px | Label/campo e gaps internos de botões |
| 8px | Controles, ícone/texto, pequenos grupos |
| 12px | Filtros, linhas e agrupamentos auxiliares |
| 16px | Grids, formulários e cards compactos |
| 24px | Seções e padding dos cards padrão |
| 40px | Padding do main |

Medidas em px assumem raiz de 16px. Esses valores são usos recorrentes das utilities, não uma coleção própria de tokens de espaçamento.

## 5. Formas, bordas e elevação

Raio-base: `--radius: 0.625rem` (10px). A escala global deriva desse valor:

| Token | Valor |
| --- | --- |
| sm | 6px |
| md | 8px |
| lg | 10px |
| xl | 14px |
| 2xl | 18px |
| 3xl | 22px |
| 4xl | 26px |

Formulários operacionais do Switchboard seguem fieldsets do Vercel/Geist e usam raio de 12px; seus campos e botões usam 8px e altura mínima de 40px (44px no mobile). O componente `OperationForm` recebe campos no corpo e ações de execução em `actions`, sempre renderizadas em uma única faixa inferior separada, após todas as mensagens de validação; controles de adicionar/remover permanecem próximos à lista. Filtros e edições rápidas podem manter ações inline. Nos demais contextos, cards padrão usam 18px; botões, badges e dialogs usam 26px. Em controles baixos o raio produz formato de cápsula. Indicadores e ícones de estado também usam círculos. Alguns componentes locais sobrescrevem raios; por exemplo, tabelas têm contêiner de 10px e vários skeletons usam 14px.

Cards têm `ring` de 1px com `foreground/10`, sem borda padrão explícita; alguns recebem `shadow`. Popovers/dialogs usam ring `foreground/5`. Separadores e tabelas usam borda discreta. Overlay do dialog: preto a 80%, blur quando suportado, z-index 50.

Escala exata de sombras disponível:

```css
  --shadow-2xs: 0 1px 2px 0 rgb(0 0 0 / 0.03);
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.02);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.03);
  --shadow-md:
    0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.03);
  --shadow-lg:
    0 8px 12px -3px rgb(0 0 0 / 0.05), 0 3px 5px -3px rgb(0 0 0 / 0.03);
  --shadow-xl:
    0 12px 20px -4px rgb(0 0 0 / 0.06), 0 4px 8px -4px rgb(0 0 0 / 0.03);
  --shadow-2xl: 0 20px 30px -5px rgb(0 0 0 / 0.07);
```

## 6. Catálogo de componentes e comportamento

### Botões

Base: cápsula de 26px, 14px, peso 500, conteúdo centralizado, ícone padrão 16px. Alturas: xs 24px, sm 32px, padrão 36px, lg 40px. Botões de ícone usam quadrados de 24/32/36/40px.

| Variante | Aparência e papel |
| --- | --- |
| default | Fundo primary, texto primary-foreground; hover primary-hover opaco; criar/salvar/confirmar |
| outline | Borda border, fundo input a 30%, hover a 50%; cancelar, filtros e ações secundárias |
| secondary | Fundo secondary; hover a 80% |
| ghost | Transparente, hover muted; toolbar e ações discretas |
| destructive | Fundo destructive a 10% (20% no escuro), texto destructive; exclusões |
| link | Texto primary, sublinhado no hover |

Foco: ring de 3px a 50% e borda ring. Desabilitado: opacidade 50%, sem interação. Pressão desloca 1px para baixo quando não é controle de popup. `aria-invalid` altera borda e ring para destructive.

### Cards

Anatomia: Card → Header (Title, Description, Action) → Content → Footer opcional. Base em coluna, gap 24px, padding vertical 24px e horizontal 24px nas regiões internas. Variante `sm`: gaps e padding 16px. Cabeçalho acomoda ação na coluna à direita. Cards financeiros usam rótulo, ícone em fundo semântico, valor destacado e nota/comparação.

### Campos e seleção

Input: largura total, altura 36px, padding horizontal 12px, fundo input/30, borda input e raio 26px; fonte 16px abaixo de `md`, 14px acima. Placeholder muted; estados de foco, erro e disabled seguem o botão.

Campo financeiro: Geist Mono/tabular; quando valores estão ocultos, usa tipo password. Select customizado tem lista flutuante, indicador de seleção e navegação Radix; menus usam raio 18px. Também existem selects HTML nativos nas telas de contas e filtros de situação: não presumir aparência idêntica aos customizados.

Formulários usam labels e grupos verticais, ajuda em texto muted e erro inline. Seleções curtas podem aparecer como botões lado a lado. Datas aparecem em inputs nativos ou Calendar em Popover, conforme a tela. Cor é uma seleção de amostras nos formulários que a suportam.

### Tabelas e listas

Tabela de transações: Tipo | Descrição | Categoria | Vencimento | Valor | Ações. Cabeçalhos de descrição, categoria, data e valor permitem ordenação com ícone. Valores e ações ficam à direita. Cabeçalho muted/40; contêiner com borda e rolagem horizontal. Situação e origem recorrente aparecem no registro. Ações de situação abrem diálogo; edição abre formulário.

Badges: altura 20px, texto 12px/peso 500, padding horizontal 8px, ícone 12px; variantes default, secondary, destructive, outline, ghost e link. Usados para classificação, situação, confiança e risco.

### Diálogos, menus e feedback

Dialog central: largura até `calc(100% - 2rem)`, limite padrão de 448px a partir de `sm`, padding e gap 24px, raio 26px. Existem limites locais diferentes, como confirmações menores. Anatomia: título, descrição/conteúdo, ações de cancelar e confirmar; erro permanece no contexto da ação. Ações pendentes desabilitam controles onde implementado. Confirmações de exclusão descrevem o efeito sobre os dados.

Toasts Sonner: canto superior direito, `richColors`. Tooltips explicam controles de ícone e valores/indicadores. Popover de atalhos com teclas estilizadas como `kbd`. Sino abre interface de notificações; controle de olho oculta valores globalmente. Breadcrumb liga à home/dashboard e nomeia a página atual.

### Privacidade e números

`FinancialValue` aplica fonte financeira e substitui conteúdo por `••••••` quando oculto; `FinancialInput` mascara edição. O estado é compartilhado e persistido. Gráficos e textos derivados também precisam respeitar a visibilidade; não basta esconder os quatro KPIs. Preservar distinção de saldo realizado, compromissos previstos, dinheiro reservado e dinheiro livre.

### Gráficos e indicadores

Recharts com largura responsiva, grades e eixos em tons neutros, tooltips compactos com borda/sombra, legendas e valores formatados. Alturas observadas incluem 220px em barras mensais e 280px na projeção. Evolução do saldo combina barras de entradas/saídas com linha de saldo. Apesar do nome `CategoryDonutChart`, a implementação atual exibe barras horizontais por categoria, legenda e valores — não uma rosca. Metas usam barras com trilha muted e preenchimento colorido. Score usa gauge circular de 140px e cartões de pilares.

### Movimento e atalhos

Sidebar: transição de 200ms linear. Dialog/menu: entrada/saída com fade e zoom, geralmente 100ms. Accordion: 200ms ease-out. Progresso de metas pode transicionar em 500ms. Troca visual de tema utiliza View Transition circular de 700ms quando disponível. Ícones de navegação animam no hover com Motion/Animate UI.

Atalhos existentes: Cmd/Ctrl+B recolhe sidebar; Cmd/Ctrl+N abre nova transação; D alterna tema, ignorando campos de digitação e teclas modificadoras. Na transferência, oferecer alternativa visível para cada atalho. Respeitar redução de movimento é uma recomendação de adaptação; não pressupor cobertura global já validada no projeto atual.

## 7. Navegação e mapa das telas

| Grupo | Rotas e rótulos |
| --- | --- |
| Visão Geral | `/dashboard` Dashboard; `/transacoes` Transações; `/contas` Contas; `/categorias` Categorias |
| Planejamento | `/metas` Metas; `/recorrentes` Recorrências; `/lembretes` Lembretes |
| Análise | `/simulador` Simulador; `/previsao` Previsão; `/projecao` Projeção; `/score` Score |
| Sistema | `/configuracoes` Configurações |

Marca no topo: símbolo de gráfico de 16px em bloco azul de 32px/raio 10px, “Wynston” em heading 14px e subtítulo “Assistente financeiro” em 12px muted. Item ativo usa estado visual da sidebar; ícones ficam visíveis ao recolher e recebem tooltip. Rodapé contém Suporte e Atalhos. Suporte abre formulário com tipo e mensagem; o envio atual abre cliente de e-mail.

### `/dashboard` — visão consolidada

1. Saudação/título e descrição.
2. Filtro de período e ação Nova transação.
3. Saldo acumulado até a referência, resumo de reservas, pendências e detalhamentos expansíveis de saldo, período e futuros.
4. Quatro KPIs: Resultado do período, Entradas, Saídas e Taxa de poupança; valor, ícone e comparação/contexto.
5. Evolução do saldo em largura total.
6. Duas colunas: categorias de entradas e de saídas, com barras horizontais.
7. Duas colunas: comparativo mensal e resumo de metas.
8. Duas colunas: transações recentes e lembretes.

### `/transacoes` — consulta e manutenção

Título/descrição → aviso de horizonte recorrente → resumo de pendências → período e Nova transação → pesquisa, filtro de situação e tipo → contagem de resultados → tabela.

Situações no filtro: todas, previstos, vencidos, realizados e cancelados. Formulário: tipo, valor, categoria, descrição, conta quando aplicável, situação, vencimento e efetivação quando pertinente. Edição de ocorrência recorrente oferece escopo individual/futuro e campos da série. Alterar situação usa diálogo próprio. Preservar a explicação de que o filtro usa vencimento e o saldo usa efetivação.

### `/contas` — patrimônio e distribuição

Título e Nova conta quando já existem contas. Sem contas: card “Organize suas contas”, explicação e ação Organizar histórico. Com contas: saldo realizado total → horizonte “Compromissos até” → grid de contas → Distribuir lançamentos → movimentações entre contas/conciliações.

Card de conta: nome, tipo, moeda, arquivamento, saldo realizado, valores previstos a receber/pagar, saldo após compromissos, reservado e livre; aviso de reserva sem cobertura quando necessário; Histórico e Editar. Distribuição: origem, destino, seleção de registros e revisão. Modais cobrem organização inicial, criar/editar, histórico, revisão e ações de conta. Formulário possui nome, tipo, saldo inicial e data de abertura. Transferência e conciliação têm componentes próprios.

### `/categorias` — taxonomia

Cabeçalho com Nova categoria → busca e filtro de entradas/saídas → contagem → coleção de categorias. Cada item apresenta identificação/cor, tipo e ações pertinentes de editar/excluir. Diálogo de criação/edição com nome, tipo e personalização visual. Preservar a distinção entre catálogo padrão e categorias customizadas e as restrições quando em uso.

### `/metas` — poupança e limites

Cabeçalho com Nova meta → contexto de saldo/reservas e composição → grids separados em Poupança, Limites de gasto (mês atual) e Metas arquivadas. Cards exibem objetivo, progresso, valor e ações; reservas/aportes usam diálogo próprio. Formulário: tipo de meta, nome, descrição opcional, alvo, categoria para limite, contribuição, prioridade, prazo e cor conforme o tipo. Exclusão e arquivamento têm fluxos próprios.

### `/recorrentes` — séries de compromissos

Cabeçalho com Nova recorrência → aviso de horizonte → seções Ativas e Pausadas com contagem → grid de cards. Card identifica tipo/categoria, valor, frequência e estado, com editar, pausar/retomar e excluir. Formulário de recorrência e edição da série reutilizam padrões de transação. Texto de exclusão esclarece que transações geradas permanecem; pausar não confirma nem remove compromissos existentes.

### `/lembretes` — tarefas financeiras

Cabeçalho e criação → seção Pendentes → seção Concluídos, dispensados ou suspensos, cada uma com contagem e grid. Cards de lembrete com cor, título, data e ações conforme o vínculo/situação. Formulário: vínculo, título, descrição opcional, data, frequência e cor; campos dependem do vínculo. Exclusão usa confirmação. Estados derivados dos vínculos devem permanecer distintos de uma conclusão manual.

### `/simulador` — impacto de compras

Cabeçalho “Simulador de compras” e criação → contexto do saldo disponível para simulação/reservas → grupos Necessidades e Desejos → grid de cards. Formulário: nome, descrição opcional, valor total, forma de pagamento, parcelas/juros quando aplicáveis, categoria, prioridade e cor. Cards oferecem análise e ações; Registrar compra abre confirmação, e a simulação permanece na lista após registro.

### `/previsao` — saldo até o fim do mês

Avisos/contexto → título “Previsão de Saldo”, ajuda, período e badges de risco/confiança → cards-resumo → gráfico de evolução projetada → Análise → Linha do tempo. Resumos distinguem saldo atual/final, entradas e saídas confirmadas e despesa variável estimada. Risco: Confortável/Atenção/Risco; confiança alta/média/baixa. Timeline tem detalhamento sob demanda. Ajuda abre dialog explicando as premissas.

### `/projecao` — acumulação por horizonte

Aviso de horizonte → título “Projeção de Poupança” e descrição → card de parâmetros/resultado ao lado do gráfico → três resumos → Detalhamento Mensal quando houver mais de um mês. Seleção de data e atalhos: 3 meses, 6 meses, fim do ano, 1 ano e 2 anos. Gráfico e tabela distinguem confirmado/estimado e acumulado. Estado vazio quando não há base financeira para projetar.

### `/score` — diagnóstico

Título “Score Financeiro” e descrição → resumo com gauge, classificação, variação e confiança ao lado dos pilares → fatores que ajudaram/prejudicaram → recomendações → comparação entre períodos quando disponível. Pilar: nome, peso/status, nota, progresso e explicação. Não trocar esse gauge por um valor monetário: usa escala de 0 a 100.

### `/configuracoes` — preferências e dados

Título e descrição → cards Perfil, Aparência, Moeda e Formato, Categorias e Dados. Perfil permite editar nome; Aparência oferece três temas; moeda tem seletor e prévia; categorias abre gerenciamento; Dados reúne backup e limpeza com confirmação. Ferramentas de desenvolvimento aparecem condicionalmente, com destaque amarelo, e não fazem parte obrigatória da experiência de produção.

## 8. Estados transversais

| Estado | Estrutura observada e regra de reprodução |
| --- | --- |
| Inicialização | Mensagem central “Carregando seus dados...” antes do shell estar pronto |
| Carregamento por tela | Skeletons com formato de linhas/cards/gráficos, respeitando a grade final |
| Coleção vazia | Ícone em círculo muted, título curto, explicação e CTA de primeiro cadastro quando pertinente |
| Busca vazia | Mensagem de nenhum resultado dentro da coleção, mantendo filtros acessíveis |
| Erro de ação | Texto destructive no contexto, `role=alert` em vários fluxos, formulário preservado |
| Horizonte recorrente indisponível | Aviso compartilhado com tentativa de recuperação |
| Dados locais indisponíveis/inválidos | Tela de recuperação: motivo, exportação de recuperação, tentar novamente e restauração anterior quando disponível |
| Modo somente consulta | Faixa informativa quando não é possível salvar com segurança entre abas |
| Migração de dados | Fluxo dedicado antes do uso regular quando há conversão pendente |
| Operação pendente | Botões/campos desabilitados e rótulo de andamento conforme o fluxo |
| Valores ocultos | Máscara compartilhada em textos e inputs; gráficos e detalhes também devem acompanhar |

## 9. Guia de reprodução em outro projeto

1. Configurar fontes, tokens dos dois temas, raios e sombras. Manter pares de superfície/texto.
2. Implementar primitivas: Button, Input, Label, Select, Badge, Card, Dialog, AlertDialog, Popover, Tooltip, Table, Tabs, Switch, Calendar, Skeleton, ScrollArea e Toast.
3. Montar o shell com sidebar recolhível, Sheet mobile, header, breadcrumb e toolbar.
4. Criar templates: página de coleção com filtros/grid; página tabular; dashboard com resumo/gráficos; análise com parâmetros/resultados; configurações em cards verticais.
5. Adicionar componentes transversais de valor/privacidade, seleção de conta, filtro de tipo, filtro de período, resumo de pendências, reservas e composição financeira.
6. Reproduzir cada rota conforme a seção 7; ligar ao domínio e à autenticação do destino.
7. Validar visualmente claro/escuro, sidebar aberta/recolhida, mobile/desktop e estados vazio/carregando/erro/dados preenchidos. Essa validação é um passo recomendado no destino, não uma validação já realizada nesta extração.

**Preservar:** papéis tipográficos, leitura tabular dos números, azul de ação, semântica de entradas/saídas, cards discretos, hierarquia de contexto/filtro/resumo/detalhe e visibilidade global de valores.

**Adaptar conscientemente:** nomes e regras financeiras, marca e contato de suporte, autenticação, armazenamento, excesso de padding em telas pequenas, selects nativos e detalhes locais de espaçamento. Essas decisões não exigem copiar a infraestrutura do Wynston.

**Evitar:** transformar o gráfico de categoria em donut apenas pelo nome do arquivo; misturar previsto com realizado; tratar reserva como nova despesa; usar fonte monoespaçada no corpo inteiro; esconder valores apenas nos cards; assumir que agrupamento de rotas fornece segurança.

## 10. Rastreabilidade e stack de referência

As referências abaixo são caminhos relativos do projeto original; o conteúdo necessário ao reaproveitamento foi descrito neste documento.

| Fonte | Conteúdo |
| --- | --- |
| `app/globals.css` | Paleta, temas, raios, sombras e classe financeira |
| `app/layout.tsx` | Fontes, idioma, providers e toast |
| `app/(private)/layout.tsx` | Shell, header e padding principal |
| `app/(private)/*/page.tsx` | Mapeamento das 12 rotas para os clients |
| `components/app-sidebar.tsx` | Marca, navegação, suporte e atalhos |
| `components/app-breadcrumb.tsx` | Contexto da rota |
| `components/ui/*` | Primitivas e suas variantes |
| `components/financial-value.tsx`, `components/financial-input.tsx` | Tipografia e máscara financeira |
| `components/local-data-boundary.tsx` | Inicialização, consulta e recuperação |
| `features/*/components/*` | Composição das telas e elementos de domínio |
| `hooks/use-mobile.ts` | Breakpoint mobile de 767px |
| `components/theme-toggle.tsx`, `components/theme-provider.tsx` | Tema e transição |

Stack original: Next.js 16.4.3, React 19.2, Tailwind CSS 4.2, shadcn/Radix, class-variance-authority, Motion 12, Lucide/Animate UI, Recharts 3.8, Sonner, next-themes e react-day-picker. São referências de implementação; o contrato visual é independente dessas bibliotecas. As versões vêm do `package.json`, sem auditoria de versões resolvidas do lockfile.
