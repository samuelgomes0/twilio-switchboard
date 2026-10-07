# Contrato SSE das operações longas

Os seis fluxos SSE usam o mesmo contrato de transporte e ciclo de vida:

- cada frame útil contém `data: <JSON>` e termina com uma linha em branco;
- o payload possui `level`, `message` e, no último evento, `done: true`;
- `level` aceita somente `info`, `success`, `warning` ou `error`;
- EOF antes de `done: true`, JSON inválido ou payload inválido encerram o cliente em erro;
- o primeiro evento final encerra a leitura e impede efeitos duplicados de finais posteriores;
- o reader é sempre liberado;
- exceções inesperadas no servidor viram um evento final genérico, sem detalhes internos;
- abort do request ou cancelamento do response propaga um `AbortSignal` à operação.

## Limite do cancelamento

O cancelamento impede que a operação inicie o próximo passo depois que o sinal é observado. Ele não desfaz uma alteração já concluída e não consegue interromper uma chamada que já foi enviada à Twilio. A interface deve continuar tratando cancelamento como interrupção, nunca como rollback.

## Política de retry

Retries automáticos são permitidos somente para leituras. Writes não são repetidos automaticamente porque um timeout pode ocorrer depois de a Twilio já ter aplicado a alteração. O usuário recebe o resultado parcial e pode decidir se deve tentar novamente.

## Cancelamento de Tasks por fila

O endpoint consulta `TASK_LIST_LIMIT + 1` itens para detectar truncamento. No máximo `TASK_LIST_LIMIT` são processados por execução e o evento final informa `partial: true` quando ainda existem itens. Tasks são processadas sequencialmente. Se várias Tasks apontarem para a mesma Conversation, todas as Tasks elegíveis são canceladas, mas a mensagem e o fechamento da Conversation ocorrem uma única vez no lote.

## Cobertura

`tests/sse-client.test.mjs` valida framing, UTF-8, payload, final obrigatório, cleanup e cancelamento nos seis consumidores. `tests/sse-server.test.mjs` valida headers, final seguro e propagação de sinal nas seis rotas. `tests/cancel-queue-tasks.test.mjs` cobre elegibilidade, falhas parciais, retry apenas da listagem e lote incompleto.
