# Switchboard

Interface visual para operações na API Twilio. Centraliza tarefas operacionais recorrentes — fechamento em lote de conversas, criação de workflows de roteamento e gerenciamento de workers — em uma única ferramenta web, sem necessidade de scripts manuais ou acesso direto ao Console Twilio.

## Stack

- [Next.js](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node)
- SSE (Server-Sent Events) para feedback em tempo real nas operações longas

## Rodando localmente

### Pré-requisitos

- Node.js 22+ ou [Bun](https://bun.sh/)
- Credenciais Twilio: `Account SID` e `Auth Token` (obtidos no [Console Twilio](https://console.twilio.com/))

### Instalação

```bash
git clone https://github.com/samuelgomes0/twilio-switchboard.git
cd twilio-switchboard
bun install        # ou npm install
```

### Rodando

```bash
bun dev            # ou npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e cadastre suas credenciais em **Configurações → Gerenciar Ambientes**.

> As credenciais são armazenadas apenas no navegador (localStorage) e nunca enviadas para nenhum servidor externo além da própria API Twilio.

## Como contribuir

1. Faça um fork do repositório
2. Crie uma branch para sua feature ou correção:
   ```bash
   git checkout -b feat/nome-da-feature
   ```
3. Faça suas alterações e commite seguindo [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: adiciona exportação de resultado como CSV"
   ```
4. Abra um Pull Request descrevendo o que foi feito e qual problema resolve
