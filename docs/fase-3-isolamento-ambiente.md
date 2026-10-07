# Isolamento por ambiente

O conteúdo da página usa um escopo composto pelo ambiente ativo e por sua revisão. Selecionar outro ambiente, excluir o ativo ou editar suas credenciais remonta o conteúdo e elimina resultados, formulários e contextos pertencentes ao escopo anterior.

Requests pertencentes às páginas abortam no unmount. Respostas observadas depois do cancelamento não atualizam estado nem histórico. Isso evita que uma resposta iniciada com credenciais antigas apareça sob o ambiente atual. Como em outras operações, abort não desfaz um write que já tenha sido aceito pela Twilio.

## Históricos

Históricos operacionais usam o formato:

```text
switchboard:<operação>-history:<environmentId>
```

Cada ambiente lê, grava e limpa somente sua própria chave. As chaves globais anteriores são preservadas sem alteração. Elas não são importadas para um ambiente porque as entradas antigas não registram a conta Twilio de origem; atribuí-las automaticamente poderia exibir dados da conta errada.

O histórico especializado de consulta de Conversation já possuía escopo por ambiente e mantém sua política própria de compatibilidade.

## Verificação

`tests/environment-isolation.test.mjs` cobre independência das chaves, preservação do armazenamento legado, adoção do escopo pelos formulários e os contratos de remount/abort.
