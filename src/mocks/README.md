# MSW

O MSW é iniciado pelo `MswProvider` somente no navegador, por padrão no desenvolvimento e
em produção apenas com `NEXT_PUBLIC_API_MOCKING=enabled` definido no build.
Use `NEXT_PUBLIC_API_MOCKING=disabled` para desativá-lo também no desenvolvimento. Os handlers
ficam centralizados aqui e devem representar os contratos que a UI consumirá. Requisições sem handler
são liberadas para a rede (`onUnhandledFrame: "bypass"`).

Para adicionar um novo endpoint:

1. Defina o tipo da resposta junto ao domínio responsável;
2. Adicione o handler em `handlers.ts` ou extraia handlers por feature quando a quantidade crescer;
3. Cubra estados de sucesso, lista vazia e erro;
4. Mantenha o serviço da feature independente do mock para que a troca pelo backend real não exija
   alterações nos componentes.

O catálogo usa `GET /api/opportunities` e `POST /api/opportunities/:id/registrations`. O MSW libera
o fluxo padrão para os Route Handlers locais, que usam fixtures validadas e persistem inscrições
por usuário. O servidor exige sessão válida para inscrições: `401` representa sessão ausente ou
expirada; `404` e `409` representam oportunidade inexistente, duplicidade e falta de vagas.
Para revisar estados de lista vazia ou erro de servidor, consulte `/api/opportunities?scenario=empty`
ou `/api/opportunities?scenario=server-error`.

As rotas `/api/auth/*` também passam para o servidor. Não simule cookies ou autenticação no
navegador, pois isso permitiria contornar a proteção das inscrições.

## Certificados externos

A feature `src/features/certificates` simula `POST /api/submissions`, `GET /api/submissions` e
`GET /api/submissions/:id/document`. Os handlers verificam a sessão pelo serviço de autenticação
existente e isolam os registros pelo ID da conta. Usuários sem sessão recebem `401`.

O mock guarda os dados e o arquivo original no IndexedDB do navegador. Os registros permanecem
ao recarregar e ao sair/entrar na mesma conta, mas não são sincronizados entre navegadores ou
dispositivos. Limpar os dados do site apaga os registros. Não há upload para servidor nem análise
real de certificados; o status `Em análise` representa apenas a demonstração.

A página privada `/certificados` lista os envios do usuário e permite baixar o comprovante original.
As submissões do mock anterior não podem ser recuperadas porque ele não armazenava os dados.

Os serviços consomem contratos Zod independentes da persistência do mock. Na integração futura,
implemente esses endpoints no backend e desative o MSW, preservando os componentes.
Enquanto essa integração não existe, a interface desabilita envio/histórico fora da demonstração.

## Gestão de organizações

Os handlers exigem sessão real com papel `organization` e criam cópias das atividades fictícias
separadas por conta. O cadastro público não concede esse papel. Nenhum certificado real ou e-mail
é emitido. Depois do despacho simulado, presença fica encerrada (`409` para alterações e novo despacho).
Os lotes esperam todas as requisições, aplicam os sucessos e preservam falhas para retry.
No servidor real, as APIs verificam sessão e papel e respondem `501` a organizações enquanto
a integração não existe. Autorização de mock é apenas parte da demonstração, nunca controle de backend.

Para verificar estados de listagem, consulte `/api/submissions?scenario=empty`,
`?scenario=server-error`, `?scenario=network-error` ou `?scenario=loading` a partir do navegador
autenticado com o MSW ativo.
