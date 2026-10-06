# Contas e acesso

O portal oferece cadastro em `/criar-conta` e login em `/entrar`, implementados com Route Handlers
do Next.js. O cadastro recebe nome, e-mail, senha com pelo menos oito caracteres e confirmação de
senha. React Hook Form e Zod validam o formulário; a API repete a validação. E-mails são normalizados
e duplicidades retornam `409`. Ao concluir o cadastro, a conta já fica autenticada.

As contas são persistidas no servidor em `.local-data/accounts.json`, ignorado pelo Git, com senhas
derivadas usando scrypt, salt aleatório por conta e comparação com `timingSafeEqual`. Senhas e hashes
nunca são incluídos na resposta da API. A confirmação de senha não é armazenada.

Este adaptador local atende à demonstração em uma única instância Node.js. Para produção ou várias
instâncias, substitua a persistência por banco de dados ou provedor de identidade mantendo os
contratos da feature. `PORTAL_DATA_DIR` permite escolher outro diretório, inclusive para testes
isolados. A conta permanece disponível após reiniciar o servidor.

As credenciais são verificadas no servidor; uma senha incorreta recebe `401` e não cria sessão.

Uma conta de demonstração continua disponível para testes, sem exibir suas credenciais na interface:

- E-mail: `rh@portalvoluntario.dev`
- Senha: `Voluntario2026!`

Configure `SESSION_SECRET` no ambiente do servidor com pelo menos 32 caracteres aleatórios. Gere um valor novo para cada ambiente, por exemplo com `openssl rand -base64 32`, e nunca o inclua no repositório nem em variáveis `NEXT_PUBLIC_*`. Sem essa variável, a criação de sessão falha de forma fechada.

A sessão usa um cookie `HttpOnly`, `SameSite=Lax` e assinatura HMAC-SHA-256, expira após oito horas e é validada tanto pelo Proxy quanto no servidor de `/painel`. O atributo `Secure` é aplicado quando a requisição usa HTTPS; em desenvolvimento HTTP local, o cookie não recebe esse atributo para que o fluxo funcione.

`POST /api/auth/register` cria a conta e a sessão com status `201`. `POST /api/auth/login` valida as
credenciais e cria a sessão. `GET /api/auth/session` devolve os dados públicos da conta autenticada
e não permite cache. `POST /api/auth/logout` expira o cookie e responde `204`; o cliente então navega
para a página inicial usando a origem atual. Login e cadastro aceitam `next` somente como caminho
local seguro; caminhos absolutos e destinos externos retornam ao painel.

O catálogo é público. Visitantes veem ações para entrar ou criar uma conta; somente usuários
autenticados podem enviar inscrições. `POST /api/opportunities/:id/registrations` valida o cookie
assinado no servidor e retorna `401` se ele estiver ausente, inválido ou expirado, sem alterar vagas.
As inscrições ficam em `.local-data/enrollments.json`, vinculadas ao ID da conta. O catálogo retorna
somente as inscrições do usuário atual; visitantes recebem uma lista vazia de inscrições.
Duplicidade e falta de vagas retornam `409`; oportunidades inexistentes retornam `404`.
