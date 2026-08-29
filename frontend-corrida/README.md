# Running frontend

Interface web do Running, um diário privado para registro manual de corridas. O frontend usa Next.js App Router, renderização no servidor para rotas protegidas e cookies de sessão `HttpOnly` mantidos pela API.

## Desenvolvimento

Requisitos: Node.js 24 e a API disponível em `http://127.0.0.1:3333`.

```bash
npm ci
API_INTERNAL_URL=http://127.0.0.1:3333 npm run dev
```

O rewrite same-origin encaminha `/api/*` para `API_INTERNAL_URL`. Em produção, o Caddy executa esse encaminhamento antes do Next.js.

## Validação

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright test
```

Os testes E2E esperam a aplicação integrada em `http://127.0.0.1:3000` por padrão. Use `PLAYWRIGHT_BASE_URL` para outro endereço.

## Rotas

- Públicas: `/entrar` e `/cadastro`.
- Protegidas: dashboard, atividades, tênis e provas.
- Dados e autenticação: somente `/api/*`; nenhum dado é persistido em `localStorage`.
