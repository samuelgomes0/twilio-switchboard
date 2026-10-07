# Robustez da persistência local

O acesso direto ao `localStorage` está concentrado em `lib/browser-storage.ts`. A camada trata indisponibilidade, quota excedida, remoção negada, JSON malformado e conteúdo com formato inesperado sem propagar exceções para a interface.

Leitores de JSON fornecem um type guard do contrato persistido. Contatos, ambientes, variáveis e históricos rejeitam o valor inteiro quando sua estrutura não é válida e usam um fallback seguro. O dado inválido não é apagado automaticamente, evitando uma migração destrutiva implícita.

Falhas de leitura, validação ou escrita disparam `switchboard:storage-error`. O `AppShell` transforma esse evento em um alerta global genérico, sem incluir chave, valor, credencial ou detalhe técnico. Operações de ambiente atualizam o estado React somente quando a gravação principal tem sucesso.

## Concorrência e escopos

Mutações de autocomplete e inserções em históricos releem o valor mais recente imediatamente antes de gravar. Isso reduz perda de atualização quando mais de um componente montado usa a mesma chave; não é uma transação entre abas, pois `localStorage` não oferece compare-and-swap.

Cada entrada de `VARIABLE_GROUPS` declara `scope` explicitamente. `closeMessages` é global porque o `StoredTextarea` correspondente sempre usou a chave sem ambiente. Workspace SIDs, filas, skills, workflows, Workers, Conversations e os três grupos Flex usam o identificador do ambiente. Sem ambiente ativo, o gestor mantém acessível apenas o grupo global.

Históricos operacionais continuam limitados a cinco itens e isolados conforme a Etapa 3. Autocomplete continua limitado a dez valores, com trim e deduplicação. Chaves e dados legados válidos são preservados.

## Verificação

`tests/storage-hardening.test.mjs` cobre erros do adaptador, shapes de contatos e ambientes e a correspondência completa entre `STORED_KEYS` e o catálogo. `tests/operation-messages.test.mjs` cobre limites, recuperação de JSON inválido e mutações baseadas na leitura mais recente.
