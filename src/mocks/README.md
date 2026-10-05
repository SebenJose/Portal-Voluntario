# MSW

O MSW é iniciado pelo `MswProvider` somente no navegador e durante o desenvolvimento. Os handlers
ficam centralizados aqui e devem representar os contratos que a UI consumirá. Requisições sem handler
são liberadas para a rede (`onUnhandledFrame: "bypass"`).

Para adicionar um novo endpoint:

1. Defina o tipo da resposta junto ao domínio responsável;
2. Adicione o handler em `handlers.ts` ou extraia handlers por feature quando a quantidade crescer;
3. Cubra estados de sucesso, lista vazia e erro;
4. Mantenha o serviço da feature independente do mock para que a troca pelo backend real não exija
   alterações nos componentes.

O catálogo usa `GET /api/opportunities` e `POST /api/opportunities/:id/registrations`. O mock mantém
as inscrições e a contagem de vagas durante a sessão de desenvolvimento; respostas `404` e `409`
representam oportunidade inexistente, duplicidade de inscrição e falta de vagas.
Para revisar estados de lista vazia ou erro de servidor, consulte `/api/opportunities?scenario=empty`
ou `/api/opportunities?scenario=server-error`.
