# Demonstração local

O portal usa o Mock Service Worker (MSW) para responder às chamadas de demonstração no navegador.
O worker começa antes de as páginas montarem seus componentes interativos; se o início falhar,
a página informa o problema e oferece uma ação para tentar novamente.

## Desenvolvimento

O MSW inicia por padrão durante `pnpm dev`. Para executar sem interceptação, defina
`NEXT_PUBLIC_API_MOCKING=disabled` no ambiente e reinicie o servidor.

## Build de produção

A demonstração em produção é opt-in. Configure `NEXT_PUBLIC_API_MOCKING=enabled` antes de gerar o
build e mantenha o mesmo valor ao iniciar o servidor:

```bash
NEXT_PUBLIC_API_MOCKING=enabled pnpm build
NEXT_PUBLIC_API_MOCKING=enabled pnpm start
```

O service worker já está versionado em `public/mockServiceWorker.js`. Em produção, a configuração
ausente ou qualquer valor diferente de `enabled` deixa o MSW desligado e preserva a comunicação
direta com os Route Handlers.

## Autenticação

As rotas `/api/auth/*` passam pelo navegador até os Route Handlers reais do Next.js. O MSW não cria
credenciais, sessões nem cookies de demonstração.
