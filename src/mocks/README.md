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
