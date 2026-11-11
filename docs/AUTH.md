# Contas e acesso

Cadastro, login e sessões são persistidos na API NestJS e no SQLite. O Next é o adaptador HTTP
usado pelo navegador e mantém o JWT em cookie HttpOnly; não existe autenticação simulada por MSW.

## Cadastro e login

`POST /api/auth/register` recebe nome, e-mail, senha e confirmação. O e-mail é normalizado;
a senha precisa de pelo menos 8 caracteres e até 72 bytes UTF-8, limite explícito do bcrypt.
O hash usa bcrypt com custo 12. Cadastro público sempre cria `volunteer`; campos extras de
privilégio são rejeitados no Nest. O schema do Next descarta campos desconhecidos, sem permitir
escolher papel. Cadastro novo e duplicado têm a mesma resposta `202`, sem autenticação automática
ou redefinição da conta existente.

`POST /api/auth/login` responde `401` para credenciais incorretas. Contas inexistentes também
executam bcrypt contra um hash descartável. O login bem-sucedido cria uma sessão no banco e emite
JWT HS256 com `sub` e `sid`, `iss=portal-voluntario`, `aud=portal-api`, emissão e expiração.
O Nest retorna token e usuário ao Next; o navegador recebe somente o usuário e o cookie.
Senhas e hashes não entram nas respostas.

## Cookie, expiração e revogação

`portal_session` usa HttpOnly, SameSite=Lax, Path=/ e duração de oito horas; Secure acompanha
a origem canônica HTTPS configurada no Next. O JWT não é salvo em localStorage.
O Guard verifica algoritmo, emissor, audiência, expiração e schema dos claims. Depois consulta
a sessão e o usuário atuais no SQLite: papel modificado, sessão removida/expirada ou conta
removida não são aceitos com identidade antiga do token.

`POST /api/auth/logout` revoga a sessão antes de expirar o cookie (`204`). Outras sessões da conta
continuam válidas. Uma cópia do token revogado deixa de funcionar. Logout de sessão já inválida
é idempotente no adaptador Next; falha de conexão não é apresentada como logout bem-sucedido.

## Autorização e isolamento

O JWT Guard protege as rotas por padrão. Apenas cadastro, login e health são públicos, e as
consultas do catálogo aceitam identidade opcional. Guard de papéis devolve `403` ao voluntário
que tenta gerenciar atividades; ausência ou invalidade de token resulta em `401`.
As operações de gestão também verificam a organização proprietária. Usuário autenticado não
escolhe dono de inscrição ou submissão pelo corpo. Detalhes e arquivos de submissões de outra
conta respondem `404`. O seed provisiona organizações fictícias, sem fluxo público de promoção.

## Origem, tamanho e abuso

Mutações recebidas pelo Next exigem `Origin` igual a `PORTAL_ORIGIN` e recusam `Sec-Fetch-Site:
cross-site`. `PORTAL_ORIGIN` é obrigatória em produção; HTTPS é exigido fora de loopback.
O CORS do Nest usa origens explícitas, sem curinga ou cookies. Clientes de API usam Bearer;
CORS não substitui autenticação ou a proteção das operações com cookie no Next.

O Next limita JSON a 8192 bytes e a leitura a cinco segundos, inclusive sem Content-Length.
Uploads têm orçamento total de 5 MB + 64 KB para multipart; o Nest limita o arquivo a 5 MB,
verifica MIME/assinatura, campos e tamanho e guarda o BLOB em transação com os metadados.
A API também limita a leitura JSON pelo parser HTTP do Nest.

Login e cadastro possuem orçamento agregado de 30 tentativas/minuto e 10 por e-mail em 15
minutos, por processo. No Next, o bloqueio informa Retry-After. O Nest possui limites próprios
para requisições diretas e até duas operações bcrypt simultâneas. Cabeçalhos de IP enviados
pelo cliente não escolhem a chave do limite. Os limites reiniciam com o processo; este projeto
acadêmico não implementa limitação distribuída.

## Migração e configuração

A chave atual é `JWT_SECRET` em `backend/.env`, com pelo menos 32 caracteres aleatórios.
`BACKEND_API_URL` fica apenas no servidor Next. Não use `NEXT_PUBLIC_` para tokens ou segredos.
A antiga chave `SESSION_SECRET`, tokens HMAC, contas scrypt/JSON e documentos no IndexedDB
não são convertidos automaticamente. Os arquivos antigos foram preservados, mas não são lidos
pelo fluxo ativo. Use novo cadastro ou as contas fictícias do seed.

A validação inclui `backend/test/api.test.ts`, `backend/test/infrastructure.test.ts`,
`tests/security.test.ts` e os fluxos reais de navegador em `tests/e2e/portal.spec.ts`.
