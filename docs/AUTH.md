# Contas e acesso

Cadastro e login usam Route Handlers reais, com validação Zod no servidor e no formulário.
O cadastro sempre cria um voluntário: campos como `role` enviados pelo cliente são ignorados.
Não existem credenciais embutidas, login de demonstração ou cadastro público de organizações.
O papel de organização deve ser provisionado por um fluxo administrativo confiável quando esse
backend estiver disponível; editar o navegador não concede esse papel no servidor.

## Cadastro e login

`POST /api/auth/register` recebe nome, e-mail, senha de 8–128 caracteres e confirmação.
E-mails são normalizados. Tanto cadastro novo quanto e-mail existente retornam `202`, com
a mesma mensagem e sem cookie de autenticação. A conta existente nunca é alterada. Depois
do cadastro, o usuário entra em `/entrar`. Os dois caminhos executam scrypt antes de responder.

`POST /api/auth/login` valida credenciais persistidas, retorna `401` para acesso incorreto
e cria uma sessão somente quando a senha confere. E-mail inexistente também executa scrypt;
isso reduz diferenças de tempo sem prometer igualdade absoluta de latência.
Senhas usam scrypt (N=32768, r=8, p=1), salt aleatório e comparação `timingSafeEqual`.
Senhas, hashes e confirmação nunca integram a resposta pública.

## Origem, tamanho e abuso

Todas as mutações reais exigem `Origin` igual à origem configurada e rejeitam
`Sec-Fetch-Site: cross-site`. Não há exceção para requisições sem `Origin`; clientes HTTP
devem enviar esse cabeçalho explicitamente. Login e cadastro exigem `application/json`,
limitam o corpo a 8192 bytes mesmo sem `Content-Length` e limitam a leitura a cinco segundos.

A autenticação tem orçamento agregado de 30 requisições/minuto por processo, compartilhado
entre login e cadastro, e 10 tentativas por e-mail normalizado em 15 minutos. Há no máximo
duas derivações scrypt simultâneas. O bloqueio retorna `429` e `Retry-After`.
Esses limites usam memória, expiram automaticamente e reiniciam com o processo. Não confiam
em IPs encaminhados pelo cliente. Para produção distribuída, substitua-os por limites
compartilhados e proteção de entrada; o orçamento agregado local pode afetar usuários legítimos.

## Configuração e sessões

Configure `SESSION_SECRET` com pelo menos 32 caracteres aleatórios, por exemplo com
`openssl rand -base64 32`. Nunca versione esse valor nem use `NEXT_PUBLIC_*`.
Em produção, `PORTAL_ORIGIN` é obrigatório, por exemplo `https://portal.example.org`,
sem caminho, query, credenciais ou fragmento. HTTPS é exigido fora de loopback.
Em desenvolvimento, a origem da requisição serve de padrão quando essa variável está ausente.
Use a origem externa do portal mesmo quando um proxy termina TLS e encaminha HTTP internamente.

O cookie `portal_session` é `HttpOnly`, `SameSite=Lax`, `Path=/`, dura oito horas e recebe
`Secure` conforme a origem canônica HTTPS. O token HMAC-SHA-256 contém apenas ID aleatório
de sessão e tempos; a identidade e o papel atuais são consultados no armazenamento do servidor.

As sessões ficam em `.local-data/sessions.json`. Token sem registro, adulterado, expirado
ou vinculado a uma conta removida é recusado. `POST /api/auth/logout` revoga o registro antes
de expirar o cookie (`204`); uma cópia desse token deixa de funcionar. Outras sessões da conta
continuam válidas. Respostas de autenticação e sessão usam `Cache-Control: no-store`.
Sem chave válida, a emissão e a validação de sessões falham de forma fechada.

**Migração:** tokens anteriores, inclusive da conta de demonstração antiga, são incompatíveis
com o novo schema e serão recusados. Contas persistidas continuam disponíveis e precisam entrar
novamente. Não reutilize o segredo antigo se houver suspeita de exposição.

## Persistência e autorização

Contas e inscrições ficam em `accounts.json` e `enrollments.json`, no diretório
`PORTAL_DATA_DIR` (padrão `.local-data`, ignorado pelo Git). A escrita usa arquivos
temporários exclusivos e renomeação, com arquivo novo `0600` e diretório novo `0700`.
O adaptador suporta uma única instância Node.js. Vários processos, serverless e réplicas
exigem banco transacional e armazenamento compartilhado de sessões e limites.

O catálogo é público. Inscrições exigem sessão válida e usam exclusivamente o ID da conta
autenticada; IDs no corpo não escolhem o proprietário. Duplicidade e vagas esgotadas retornam
`409`; oportunidade inexistente, `404`. O catálogo filtra inscrições por conta.
O painel exibe somente essas inscrições e zero horas homologadas enquanto não houver backend
de aprovação. Certificados locais em análise não concedem horas.

`/organizacao` exige papel `organization` no servidor. As APIs de gestão também verificam
sessão e papel: visitante recebe `401`, voluntário `403`. Para organizações, respondem
`501` quando atingidas diretamente, pois não há backend real de gestão/emissão.
O MSW pode simular esse contrato com autorização por sessão e estado separado por conta,
mas controles de mock não substituem autorização, tenant e persistência no backend futuro.

`/painel` e `/certificados` exigem sessão no Proxy e na página. Certificados em IndexedDB
e gestão simulada são habilitados apenas no modo de demonstração. Sem esse modo, as telas
informam indisponibilidade e não iniciam operações sem integração.

## Verificação local

Use Node.js 22.12 ou superior e `pnpm test`. A suíte gera dados e chave aleatórios em
diretórios temporários, testa rotas, revogação, isolamento, autorização, CSRF, limites e
reconciliação de lote, e remove somente seus próprios artefatos. Não usa contas existentes,
não instala dependências e não acessa serviços externos.
