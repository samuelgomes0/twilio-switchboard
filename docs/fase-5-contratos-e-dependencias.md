# Contratos residuais e dependências

A Etapa 5 revalidou as dívidas D10 a D15 contra o código atual. Expressões TaskRouter, navegação mobile, exportação CSV e paginação de participante já possuíam as correções e testes necessários; o relatório da auditoria foi sincronizado com essa evidência.

## Flex

O contrato condicional de criação de endereço agora é o mesmo no formulário e no Route Handler:

- integração Studio exige SID `FW` seguido de 32 caracteres hexadecimais;
- integração Webhook exige URL absoluta HTTP ou HTTPS;
- auto-criação habilitada exige um tipo de integração;
- SIDs opcionais e URLs fornecidas também são validados, mesmo quando recebidos fora da interface.

O botão de confirmação permanece indisponível enquanto a configuração ativa estiver incompleta. O servidor repete a validação antes de instanciar o cliente Twilio.

## Exportação XLSX

`xlsx@0.18.5` foi removido porque o registro npm não oferece correção para seus advisories. A exportação existente foi mantida com `write-excel-file@4.1.1`, usando a entrada de navegador somente de escrita e importação dinâmica. Cabeçalhos, linhas, nome do arquivo, nome da planilha, escopo dos resultados e neutralização de fórmulas foram preservados.

Em 7 de outubro de 2026, `npm audit --omit=dev` retornou zero vulnerabilidades. A auditoria completa ainda registra nove alertas altos no grafo de ferramentas de desenvolvimento, originados por `eslint-config-next`, `shadcn` e dependências transitivas. O reparo automático sugerido exige downgrades major; ele não foi aplicado sem uma atualização compatível.

## Verificação

`tests/boundary-hardening.test.mjs` protege as combinações condicionais do Flex, a rejeição no Route Handler antes do cliente Twilio e a política da dependência usada na exportação Excel.
