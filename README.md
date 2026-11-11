# Portal Voluntário

Aplicação acadêmica para encontrar oportunidades de voluntariado, gerenciar inscrições e presenças,
registrar comprovantes externos e acompanhar horas de participação.

O front-end usa Next.js 16, React 19, TypeScript, Tailwind, shadcn/ui, React Hook Form/Zod,
Motion e Lucide. A API usa NestJS 12, TypeORM 0.3, SQLite, class-validator, bcrypt e JWT.
O banco e a autenticação são locais, sem serviços externos.

## Executar a partir de um clone

Use Node.js 24 (validado no projeto; mínimo 22.12) e pnpm 12.8.1. Na raiz:

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
cp backend/.env.example backend/.env
openssl rand -base64 32
```

Cole a chave gerada em `JWT_SECRET` no arquivo `backend/.env` e escolha uma senha demonstrativa
em `SEED_PASSWORD`, por exemplo `PortalDemo2026!`. Esses valores ficam apenas no ambiente local.
A senha deve ter pelo menos 8 caracteres e ocupar até 72 bytes em UTF-8.

Prepare o banco e os exemplos:

```bash
pnpm backend:migrate
pnpm backend:seed
```

Em dois terminais:

```bash
pnpm backend:dev
```

```bash
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000). A API fica em
`http://127.0.0.1:3001/api`; `GET /api/health` verifica a conexão com SQLite. A documentação Swagger fica em
`http://127.0.0.1:3001/api/docs`.
O script de desenvolvimento do back-end recompila antes de iniciar, mas não observa alterações:
reinicie-o após editar o servidor. O Next possui recarga durante o desenvolvimento.

O banco é criado em `backend/.data/portal.sqlite`. Migrations são aplicadas na inicialização,
com `synchronize: false`; `backend:migrate` permite aplicá-las sem iniciar HTTP. O seed é
transacional: repetir o comando não duplica vínculos, não redefine senhas e não sobrescreve
atividades ou presenças editadas. As contagens de inscritos são calculadas de registros reais.

## Contas demonstrativas

Todas usam a senha escolhida em `SEED_PASSWORD`. As contas são fictícias:

| E-mail | Papel e dados iniciais |
| --- | --- |
| `voluntario@portal.example` | Voluntário com duas inscrições, sendo uma presença confirmada. |
| `outro@portal.example` | Outro voluntário, sem inscrições, para verificar isolamento. |
| `organizacao@portal.example` | Organização responsável pela horta comunitária. |
| `organizacao2@portal.example` | Organização responsável pela monitoria de programação. |
| `organizacao3@portal.example` | Organização responsável pelo projeto do Rio Paraná. |
| `organizacao4@portal.example` | Organização responsável pelo clube de leitura. |
| `organizacao5@portal.example` | Organização responsável pelo projeto de dados abertos. |

O cadastro público cria somente voluntários. Cada organização só gerencia suas próprias
atividades. Ao emitir certificados para os presentes, o sistema registra as horas uma vez e
encerra presenças/inscrições da atividade. Não há envio de e-mail.

Comprovantes externos ficam persistidos no servidor e permanecem `Em análise`; suas horas
declaradas não aumentam o saldo homologado. A tela permite criar, consultar, editar, excluir
e baixar o arquivo original. PDF, JPG e PNG são aceitos, com limite de 5 MB.

## Configuração

| Ambiente | Variável | Uso |
| --- | --- | --- |
| `backend/.env` | `JWT_SECRET` | Chave obrigatória de pelo menos 32 caracteres, gerada aleatoriamente. |
| `backend/.env` | `DATABASE_PATH` | Padrão `.data/portal.sqlite`, relativo a `backend/`, ou caminho absoluto. |
| `backend/.env` | `API_HOST` / `API_PORT` | Padrões `127.0.0.1` e `3001`. |
| `backend/.env` | `CORS_ORIGINS` | Origens HTTP(S) exatas, separadas por vírgula. |
| `backend/.env` | `SEED_PASSWORD` | Senha fornecida explicitamente ao executar o seed. |
| `.env.local` | `BACKEND_API_URL` | URL da API vista pelo servidor Next; padrão `http://127.0.0.1:3001/api`. |
| `.env.local` | `PORTAL_ORIGIN` | Origem externa do portal; obrigatória em produção. |
| `.env.local` | `NEXT_PUBLIC_API_MOCKING` | `disabled` para uso real; `enabled` habilita somente as demonstrações. |

JWTs ficam em cookie HttpOnly, SameSite=Lax, Secure em HTTPS, com validade de oito horas.
O Next envia o Bearer ao Nest pelo servidor e não expõe o token no corpo do login ou no localStorage.
Logout revoga a sessão no SQLite. `SESSION_SECRET` do antigo adaptador JSON não é mais utilizado.

Em produção, configure a origem HTTPS externa em `PORTAL_ORIGIN`, gere o build com as variáveis
públicas desejadas e use `pnpm backend:build`, `pnpm backend:start`, `pnpm build` e `pnpm start`.
Não use os exemplos demonstrativos como credenciais de produção.

## Validar

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm typecheck
pnpm backend:typecheck
pnpm test
pnpm backend:test
pnpm build
pnpm backend:build
```

`pnpm test` testa os adaptadores Next contra um Nest real. `backend:test` cobre DTOs, JWT,
permissões, CRUDs, inscrições concorrentes, migrations, seed, uploads e persistência após reinício.
As duas suítes criam seus próprios bancos e contas temporários; não usam o banco local do usuário.

Para testar a interface no Chromium:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

A automação compila os dois projetos, inicia os servidores em portas temporárias, prepara um
SQLite isolado e valida os fluxos pelo navegador. Os artefatos ficam em `test-results/`, ignorado
pelo Git. Em Linux sem bibliotecas do navegador, use `pnpm exec playwright install --with-deps chromium`.
O CI inclui lint, tipos, testes, builds e navegador; `pnpm check` reúne os checks sem navegador.

## Organização e documentação

```text
src/app/                    páginas, Proxy e adaptadores HTTP do Next
src/features/               UI, schemas e serviços por domínio
src/components/             layout e componentes compartilhados
src/lib/server/             cliente central da API e proteção das requisições
src/mocks/                  registro dos mocks exclusivos de demonstração
backend/src/features/       Controllers, Services, DTOs e Entities por domínio
backend/src/database/       configuração, migrations e seed
backend/test/               testes HTTP e de persistência
tests/                      integração do Next e testes de navegador
docs/                       análise, API, arquitetura e relatório de validação
```

Consulte [os endpoints e exemplos da API](docs/API.md), [a arquitetura do back-end](docs/backend.md),
[os controles de autenticação](docs/AUTH.md) e [o relatório de atendimento ao plano](docs/relatorio-final.md).
A [análise inicial](docs/analise-inicial.md) registra o diagnóstico anterior à implementação.

As antigas contas JSON, inscrições locais e arquivos no IndexedDB não são importados automaticamente.
Os arquivos anteriores foram preservados; faça novo cadastro ou use o seed para a base SQLite.
Os adaptadores JSON remanescentes no código não fazem parte do fluxo ativo. A demonstração pública
continua separada dos dados reais; veja [como habilitá-la](docs/DEMO.md).
O PDF e a apresentação anteriores descrevem a versão do protótipo e foram preservados como material histórico.

## Identidade visual

O portal usa preto e amarelo como cores principais, seguindo o
[manual de identidade visual da UTFPR](https://www.utfpr.edu.br/comunicacao/design/manual-de-uso-da-identidade-visual-da-utfpr/).
A marca horizontal em `public/brand/utfpr-logo-horizontal.png` foi obtida na
[página oficial de marcas da UTFPR](https://www.utfpr.edu.br/comunicacao/design/marca-da-utfpr/)
e é exibida sem alterar seus elementos ou proporções. O favicon foi obtido no
[portal institucional](https://www.utfpr.edu.br/favicon.ico). As cores de interface estão
centralizadas em `src/app/globals.css`.
