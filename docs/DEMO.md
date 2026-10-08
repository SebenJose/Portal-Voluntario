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

## Painel com horas de exemplo

Com os mocks ativos, **Meu painel** (`/painel`) já abre com os dados de demonstração
após o login. O exemplo mostra 74 horas (24 de Ensino, 18 de Pesquisa
e 32 de Extensão), três atividades concluídas e duas atividades futuras na agenda.
Use **Voltar aos meus dados** (`/painel?demonstracao=conta`) para consultar os dados
da conta, e **Ver dados de demonstração** para abrir os exemplos novamente.

Os exemplos vêm do endpoint MSW `/api/demo/dashboard` e não gravam horas,
inscrições ou certificados. Esse painel está disponível apenas com os mocks ativos.
O endpoint aceita os cenários `empty`, `loading`, `network-error` e `server-error`.

## Autenticação

As rotas `/api/auth/*` passam pelo navegador até os Route Handlers reais do Next.js. O MSW não cria
credenciais, sessões nem cookies de demonstração.

Em produção, configure também `PORTAL_ORIGIN` com a origem externa e `SESSION_SECRET`.
Não existe conta embutida: cadastre uma conta e entre no portal. O cadastro cria somente voluntários.
A demonstração de gestão em `/demonstracao/gestao` pode ser acessada pelo menu sem login.
Seus participantes e alterações ficam apenas na memória do navegador e são reiniciados ao recarregar.
Ela usa endpoints MSW próprios em `/api/demo/organizations/activities`, sem alterar contas,
inscrições, certificados ou os dados da gestão reservada.

A rota `/organizacao` e suas APIs continuam exigindo papel de organização verificado no servidor;
seu provisionamento não é público. A restrição veio da atualização de autenticação da `main`, que
também removeu o login embutido antigo; por isso o menu de gestão desapareceu para voluntários.
Os certificados locais continuam em IndexedDB por conta e não concedem horas homologadas.
Sem mocks, registro de certificados e gestão informam indisponibilidade em vez de iniciar chamadas
sem integração. Veja [os controles e limites do adaptador local](AUTH.md).
