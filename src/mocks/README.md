# Mocks e integração

O registro ativo em `handlers.ts` contém apenas `/api/demo/dashboard` e
`/api/demo/organizations/activities`, habilitados explicitamente por
`NEXT_PUBLIC_API_MOCKING=enabled`. O padrão é desligado. Requisições não interceptadas seguem
para o Next, que envia os dados à API Nest.

Contas, catálogo, inscrições, gestão privada e certificados externos sempre usam a API real.
Erros de conexão são apresentados na interface; não existe fallback para fixtures ou IndexedDB.
Schemas Zod verificam as respostas recebidas pelos serviços das features e pelo adaptador Next.

As fixtures antigas de catálogo, participantes e certificados foram preservadas para cenários
isolados. Os handlers privados de gestão e certificados e o armazenamento IndexedDB não estão
no registro ativo. Não os registre novamente para substituir operações reais da conta.

As demonstrações públicas têm dados separados e cenários `empty`, `loading`, `network-error`
e `server-error`. Novos testes de UI podem interceptar uma requisição de maneira explícita,
como o cenário de erro recuperável do Playwright, sem mudar o comportamento padrão do produto.

O seed do back-end reaproveita um snapshot dos textos e encontros do catálogo original. Seus
valores são validados antes de entrar na transação. Contagens fictícias de inscritos são ignoradas.
