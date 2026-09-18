# Fase 2D — caracterização SSE

Inventário registrado antes da alteração produtiva. Os testes executam as funções reais de submissão extraídas pela AST TypeScript, com fetch/reader e setters controlados; não montam React. Os Route Handlers são executados com operações Twilio substituídas. Não representam teste de navegador nem cancelamento real na Twilio.

## Protocolo comum

Os seis fluxos usam POST e `data: ${JSON.stringify({ level, message, ...data })}\n\n`. Os headers são `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive` e `X-Accel-Buffering: no`. Campos extras sobrescrevem level/message na serialização atual; erros de serialização propagam.

Todos os clientes decodificam UTF-8 com `{ stream: true }`, acumulam buffer e separam por `\n\n`. Processam somente a primeira linha que começa exatamente com `data:`. Não interpretam event/id/retry, não concatenam múltiplas linhas data, ignoram frames sem data e não aceitam CRLF como separador. Fragmentos e vários frames por chunk preservam a ordem. EOF descarta o buffer incompleto, mesmo se faltar apenas um LF; não há flush final do decoder. `done` não interrompe a leitura: eventos posteriores e finais repetidos ainda são processados.

## Matriz dos consumidores

Endpoints abaixo têm prefixo `/api/`. Formulários ficam em `features/<domínio>/components/`.

| Endpoint / cliente | Eventos e campos adicionais | Término e efeitos | Erros | Cancelamento |
|---|---|---|---|---|
| conversations/close / close-form.tsx | Início info; busca com progress {current,total}; info/success/warning/error; final info com done,totalClosed,totalErrors | Atualiza progresso/log; final cria resumo/histórico e done; EOF sem final vira done | Ignora JSON inválido e exceções no callback; erro de leitura vira error | AbortError vira idle + aviso; signal apenas no fetch; não libera reader |
| taskrouter/assign-workers / assign-workers-form.tsx | Início info; busca com progress; info/success/warning/error, inclusive retry; final info com done,totalUpdated,totalSkipped,totalErrors | Progresso/log; final cria resumo/histórico e done; EOF vira done | Mesma política de close | Mesma política de close |
| taskrouter/cancel-queue-tasks / cancel-queue-tasks-form.tsx | Primeiro info de busca na lib; contagem info; success/warning/error; progress por task processada; final info com done,totalSuccess,totalSkipped,totalErrors | Progresso/log; final cria resumo/histórico e done; EOF vira done | Mesma política de close | Mesma política de close |
| taskrouter/create-workflow / create-workflow-form.tsx | Primeiro info carregando filas; info/warning e success; final success com done,workflowSid,workflowName,totalFilters ou error com done | Log; final com SID cria resumo/histórico; sem SID marca error, mas EOF troca error por done | JSON/callback ignorados; HTTP/leitura tratados fora do loop | Mesma política de close; leitura CSV ocorre antes do controller |
| taskrouter/add-particular-filter / add-particular-filter-form.tsx | Info por workflow; success/warning/error; final success se adicionou/pulou algum, senão error; done,totalAdded,totalSkipped,totalErrors | Log; final cria resumo/histórico; zero adicionados/pulados marca error; EOF preserva error/done | JSON/callback ignorados | Mesma política de close |
| taskrouter/update-worker-feature / use-update-worker-feature.ts | Info com progress por Worker; success/error; final success ou warning com done,totalUpdated,totalErrors; exceção final error com done,totalErrors:1 | Valida objeto, level e message; exige done === true; final marca error se totalErrors numérico > 0, senão done; ignora progress; sem histórico | JSON inválido, payload inválido, callback ou EOF sem done viram erro de conexão; libera reader em finally | Usa signal.aborted para distinguir cancelamento, marca idle + aviso; impede execução concorrente e aborta ao desmontar |

Nos cinco formulários, `done` é testado por truthiness, não há validação estrutural nova e erros no bloco de processamento inteiro são ignorados. Em HTTP inválido/body ausente, leem response.text(), aproveitam json.error truthy ou usam erro genérico. No hook, HTTP/body inválido sempre usa erro de conexão. Falha de rede sobrescreve até um done anterior. Nenhum dos seis chama reader.cancel(). Somente o hook chama releaseLock(), em sucesso e falha após aquisição.

## Servidor e cancelamento

Close, assign-workers e cancel-queue-tasks não capturam exceções inesperadas no start: o stream falha sem evento final. Create-workflow e add-particular-filter convertem falhas em evento error/done e fecham o controller depois do catch. Seus tratamentos de erro não são idênticos: create-workflow preserva safeMessage de AppError; add-particular-filter usa mensagem genérica para erros não Twilio.

Esses cinco endpoints não encaminham req.signal à lib e não definem cancel(). Cancelar fetch não garante parar operações Twilio. Um enqueue após cancelamento pode falhar; não existe garantia de conclusão cooperativa do lote. Nenhuma lib correspondente recebe AbortSignal.

Worker Feature liga req.signal a um controller próprio, trata sinal já abortado, repassa o signal à lib e aborta também em cancel() do stream. Emit ignora mensagens após abort; finally remove o listener e fecha somente se não abortado. Logo abortar somente o request pode deixar o stream local sem close (o teste cancela explicitamente seu reader para limpeza). A lib verifica o signal antes de cada Worker e depois da resolução, antes da escrita. Escrita já iniciada não é interrompida/desfeita; não há retry de escrita. Os testes anteriores de Worker Feature já cobrem abortar após fetch e após update.

## Limites da consolidação

Compartilhável: leitura do reader, decoder, buffer, separação de frames e seleção da primeira linha data; headers constantes. Parsing JSON fica no callback local para preservar trim e fronteiras de catch. Aquisição/liberação do reader, conclusão, estado, histórico, HTTP, AbortSignal e lifecycle do servidor permanecem locais.

Não unificar controles do stream, não interromper em done, não adicionar reader.cancel/releaseLock, validação ou suporte SSE completo. sleep/withRetry/sseEvent já compartilham implementação: sua mudança de localização não é necessária para extrair transporte e headers nesta rodada.

## Achados preservados

- EOF sem done pode ser apresentado como sucesso nos cinco formulários; create-workflow sobrescreve error por done no EOF.
- Os cinco formulários não liberam explicitamente o reader e não oferecem cancelamento cooperativo no servidor.
- Finais repetidos podem duplicar efeitos de histórico; frames incompletos e CRLF são descartados pelo protocolo atual.
- No hook, erro SSE sem totalErrors positivo pode resultar em done; req abortado suprime close do stream no servidor.

## Resultado da extração

Antes de alterar qualquer arquivo produtivo, passaram 30 testes de cliente e 19 de servidor/serialização; a suíte completa passou com 89 testes (40 anteriores + 49 novos). Os mesmos testes passaram após a extração, sem alteração de suas expectativas.

A comparação direta das funções antigas e novas passou em 198 execuções pareadas (33 streams/cenários × 6 clientes), comparando estado e registro ordenado de leituras, logs, callbacks, payload HTTP, histórico e cleanup. Typecheck passou; lint manteve os mesmos 17 erros anteriores; build passou com 42/42 páginas; diff sem erros de whitespace. O build precisou de acesso à rede para obter as fontes Geist.

`lib/sse-reader.ts` contém somente consumeSseStream(reader,onDataLine), usado nos seis consumidores. O callback recebe a primeira linha data completa; cada consumidor mantém JSON.parse e seu catch original. `lib/sse-headers.ts` compartilha os quatro headers nos seis endpoints. Nenhum TextEncoder, start/cancel, emit, controller.close, retry, mensagem ou payload de negócio foi alterado.

| Chunks/caso | Eventos e ordem | Erro/conclusão | Cancelamento/reader |
|---|---|---|---|
| UTF-8 byte a byte ou vários eventos completos no mesmo chunk | Mesmos textos e callbacks na ordem | done produz mesmos estados/resumos | Liberação somente no hook |
| Evento sem separador final ou CRLF | Tail não emitido | Cinco forms chegam a done; hook exige final válido | Sem cancel automático |
| Linhas vazias, metadados e múltiplas linhas data | Ignora frames sem data; usa só a primeira linha data | Sem ampliação do protocolo | Inalterado |
| JSON/payload inválido ou callback lançando | Cinco forms continuam; hook para | Mesmas políticas de catch | Hook libera reader |
| Final seguido de outro final | Processa ambos, inclusive histórico repetido | Leitura continua até EOF | Sem cancel no done |
| Falha de leitura/rede após final | Logs anteriores permanecem | Estado final error | Hook libera reader |
| HTTP inválido/body ausente | Não cria reader | Erro HTTP aproveitado nos forms; genérico no hook | Ref limpa em finally |
| AbortError sem signal abortado | Forms classificam como cancelamento; hook como erro | idle nos forms, error no hook | Sem cancel explícito do reader |
| Signal abortado com erro de outro nome | Forms classificam como erro; hook como cancelamento | error nos forms, idle no hook | Sem uniformização |
| Abort do request/cancel da resposta no servidor | Cinco rotas não repassam signal; hook repassa | Mantém supressão de emit/close após abort no hook | Checks de negócio originais preservados |
