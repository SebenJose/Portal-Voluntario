# Acesso de demonstração

O portal oferece um fluxo de autenticação de demonstração implementado com Route Handlers do Next.js. As credenciais são verificadas no servidor; uma senha incorreta recebe `401` e não cria sessão.

Credenciais para entrar:

- E-mail: `rh@portalvoluntario.dev`
- Senha: `Voluntario2026!`

Configure `SESSION_SECRET` no ambiente do servidor com pelo menos 32 caracteres aleatórios. Gere um valor novo para cada ambiente, por exemplo com `openssl rand -base64 32`, e nunca o inclua no repositório nem em variáveis `NEXT_PUBLIC_*`. Sem essa variável, a criação de sessão falha de forma fechada.

A sessão usa um cookie `HttpOnly`, `SameSite=Lax` e assinatura HMAC-SHA-256, expira após oito horas e é validada tanto pelo Proxy quanto no servidor de `/painel`. O atributo `Secure` é aplicado quando a requisição usa HTTPS; em desenvolvimento HTTP local, o cookie não recebe esse atributo para que o fluxo funcione.

`POST /api/auth/login` valida as credenciais e cria a sessão. `GET /api/auth/session` devolve os dados públicos da conta autenticada e não permite cache. `POST /api/auth/logout` expira o cookie e redireciona para a página inicial. A página de login aceita `next` somente como caminho local seguro; caminhos absolutos e destinos externos retornam ao painel.

Esta conta fixa serve apenas para demonstração e não representa uma integração com cadastro persistente ou um provedor de identidade.
