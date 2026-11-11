# Relatório de implementação e validação

Data da validação final: 11/11/2026. Branch de trabalho: `feat/backend-nestjs`, criada a partir
da `main` atualizada no início da implementação. A implementação foi organizada em commits
temáticos locais com autoria e committer de Fernando Buligon, conforme solicitado. Não houve
push ou reescrita de histórico.

A referência desta auditoria é o conteúdo integral de `plano-de-trabalho.txt`. O PDF existente
em `docs/Documentação Portal Voluntário.pdf` descreve o protótipo anterior, não um enunciado
adicional do professor. Este relatório não atesta exigências que não constam do plano fornecido.

## Implementação entregue

O portal mantém Next.js/React no front-end e passa a usar uma API NestJS com TypeORM e SQLite.
Foram implementadas oito entidades, duas migrations, seed transacional, autenticação bcrypt/JWT,
sessões revogáveis, autorização por papel/propriedade e 22 endpoints REST. O catálogo, inscrições,
agenda, gestão, certificados e painel usam os dados persistidos.

Os CRUDs de oportunidades e submissões externas podem ser realizados pela interface. Na gestão,
a organização cria/edita/exclui atividades, acompanha participantes, registra presença e emite
certificados para os presentes. A emissão registra as horas uma vez e encerra as alterações
da participação. O envio de comprovantes externos preserva o arquivo original e os metadados;
esses registros permanecem em análise e não concedem horas automaticamente.

Foram preservados o layout preto/amarelo, navegação, componentes shadcn/ui, React Hook Form/Zod,
Motion e ícones Lucide. O MSW ficou restrito às rotas públicas de demonstração, sem interceptar
operações da conta. Os artefatos do protótipo e os arquivos de dados antigos foram preservados;
os adaptadores JSON/IndexedDB remanescentes não são a fonte do fluxo ativo.

## Decisões arquiteturais

- Pacote `backend/` separado no workspace pnpm, com TypeScript estrito, alias e build próprios.
- Entidades tipadas por `EntitySchema<T>`, sem `any`, assertions de inicialização ou supressões
  de erros de tipos. Repositories TypeORM são a camada de persistência usada pelos Services.
- SQLite com chaves estrangeiras, restrições únicas, checks, WAL e migrations; `synchronize: false`.
- Escritas transacionais serializadas por conexão; triggers também protegem capacidade e presença.
- JWT contém identificadores de usuário/sessão e tempos, com algoritmo/emissor/audiência definidos.
  Identidade e papel atuais são consultados no banco; logout remove a sessão persistida.
- Cookie HttpOnly no Next; Bearer enviado somente pelo servidor. O navegador não recebe o JWT
  no corpo do login e não o armazena em localStorage.
- DTOs class-validator na API; Zod no ambiente, seed e bordas do Next/cliente. O limite de 72 bytes
  do bcrypt é validado explicitamente, com contagem consistente de caracteres Unicode no cadastro.
- Documentos em BLOB junto dos metadados, sem caminhos controlados pelo usuário ou arquivo perdido
  quando uma transação falha. Listagens não selecionam os bytes nem hashes de senha.
- Controllers delegam regras aos Services; UI usa serviços da feature e adaptadores HTTP centrais.
- Resposta Nest `{data: ...}`; erros uniformes. O Next adapta o envelope aos contratos existentes,
  sem fallback silencioso para mocks quando a API falha.

O desenho e os contratos completos estão em [backend.md](backend.md) e [API.md](API.md).
O diagnóstico anterior à implementação permanece em [analise-inicial.md](analise-inicial.md).

## Endpoints implementados

| Domínio | Métodos e rotas após `/api` |
| --- | --- |
| Disponibilidade | `GET /health` |
| Autenticação | `POST /auth/register`, `POST /auth/login`, `GET /auth/session`, `POST /auth/logout` |
| Oportunidades | `GET /opportunities`, `GET /opportunities/:id`, `POST /opportunities`, `PATCH /opportunities/:id`, `DELETE /opportunities/:id` |
| Inscrições | `POST /opportunities/:id/registrations`, `DELETE /opportunities/:id/registrations` |
| Gestão | `GET /organizations/activities`, `PATCH /organizations/activities/:id/participants/:participantId`, `POST /organizations/activities/:id/certificates` |
| Comprovantes externos | `GET /submissions`, `POST /submissions`, `GET /submissions/:id`, `PATCH /submissions/:id`, `DELETE /submissions/:id`, `GET /submissions/:id/document` |
| Painel | `GET /dashboard` |

Métodos, parâmetros, corpos, permissões, respostas e erros estão detalhados em [API.md](API.md).

## Testes efetivamente executados

Ambiente: Node.js 24.21.0, pnpm 12.8.1, Next.js 16.3.8 e Chromium headless instalado pelo
Playwright 1.65.0. As suítes usaram portas, senhas e bancos temporários próprios.

| Comando / verificação | Resultado final |
| --- | --- |
| `pnpm install --frozen-lockfile` | Aprovado com o lockfile atualizado. |
| `pnpm lint` | Aprovado, sem erros ou warnings de lint na rodada final. |
| `pnpm typecheck` | Geração de tipos Next e TypeScript aprovados. |
| `pnpm exec tsc --noEmit` | Aprovado. |
| `pnpm backend:typecheck` | Fontes e testes Nest aprovados. |
| `pnpm test` | 14 testes aprovados, zero falhas, com adaptadores Next e processo Nest real. |
| `pnpm backend:test` | 27 resultados aprovados no runner Node, zero falhas, incluindo subtestes. |
| `pnpm build` | Build de produção Next aprovado. |
| `pnpm backend:build` | Compilação Nest e resolução de aliases aprovadas. |
| `pnpm check` | Pipeline local completo aprovado. |
| `pnpm test:e2e` | 3 cenários de navegador aprovados sobre builds de produção e SQLite real. |
| Cópia limpa dos arquivos de entrega | Instalação frozen, builds de Next/Nest, migrations e seed aprovados sem dependências, ambiente ou builds reaproveitados do checkout. |

A reprodução limpa foi feita em diretório temporário, copiando apenas arquivos versionados e
novos arquivos de entrega, sem `.git`, `node_modules`, `.next`, `.env`, banco local ou artefatos
de teste. `pnpm install --frozen-lockfile`, `pnpm backend:build`, `pnpm build`,
`pnpm backend:migrate` e `pnpm backend:seed` concluíram nessa cópia. Isso verifica a reprodução
do conteúdo preparado localmente; não representa um push ou clone de uma revisão já publicada.

Os testes de persistência verificam migrations sem diferenças de schema, reexecução do seed,
preservação de senhas/edições, rollback por conflito, unicidade, chaves estrangeiras e reabertura
do mesmo arquivo SQLite por uma nova instância. `PRAGMA foreign_key_check` não encontrou vínculos inválidos.

Os testes HTTP cobrem cadastro válido/inválido/duplicado, tentativa de privilégio, bcrypt,
JWT adulterado/expirado, `401`/`403`, papel atualizado no banco, propriedade de atividades,
CRUDs, filtros, concorrência na última vaga, cancelamento, emissão única, limites de login,
upload inválido/maior que 5 MB, download e acesso indevido a arquivos. Também verificam
DTOs, CORS, logs sem os segredos enviados no cenário e respostas `201`, `204`, `400`, `404`,
`409`, `500` e `503`.

Os cenários de navegador em [portal.spec.ts](../tests/e2e/portal.spec.ts) verificam:

1. Cadastro, login, cookie HttpOnly, criação/edição/exclusão de comprovante, download idêntico
   ao original, persistência após recarregar, logout e inscrição/cancelamento na agenda.
2. Criação/edição/exclusão de atividade por organização, inscrição de outro navegador,
   presença, emissão e atualização das horas no painel do voluntário.
3. Erro de catálogo recuperável e exibição em viewport de 390 pixels, sem overflow horizontal.

Capturas de certificados, gestão e catálogo móvel foram geradas em `test-results/` e conferidas
visualmente. Esse diretório é ignorado pelo Git; a automação reproduz as evidências.

## Auditoria por requisito

A conferência foi realizada em uma passagem separada da implementação, confrontando cada item
do plano com código, contratos, execuções reais e artefatos. Não foi uma revisão externa de terceiro.

| Requisito do plano | Status | Arquivos responsáveis e evidência |
| --- | --- | --- |
| API atende às funcionalidades do front-end | ATENDIDO | `backend/src/features/*`, `src/app/api/*`; API, adaptadores e 3 fluxos de navegador executados. |
| Métodos, parâmetros, query params e status adequados | ATENDIDO | Controllers, DTOs e `docs/API.md`; filtros, CRUDs e códigos HTTP verificados. |
| DTOs com class-validator | ATENDIDO | `auth.dto.ts`, `opportunity.dto.ts`, `attendance.dto.ts`, `submission.dto.ts`; rejeição de dados inválidos e campos extras nos testes. |
| Middleware de log | ATENDIDO | `backend/src/common/logging/request-logger.middleware.ts`; teste verifica método, caminho, status, duração e ausência de segredos. |
| Interceptor global de respostas | ATENDIDO | `backend/src/common/http/response.interceptor.ts`; envelope, arquivos e `204` verificados. |
| Filtro global de exceções | ATENDIDO | `backend/src/common/http/http-exception.filter.ts`; validação, conflito e erros inesperados padronizados. |
| Controller, Service e Repository separados | ATENDIDO | Controllers delegam a Services; Services usam repositories TypeORM e `TransactionsService`; inspeção dos módulos. |
| Regras de negócio nos Services | ATENDIDO | `opportunities.service.ts`, `organizations.service.ts`, `submissions.service.ts`, `auth.service.ts`, `dashboard.service.ts`; UI não acessa banco. |
| Persistência SQLite com TypeORM | ATENDIDO | `backend/src/database/options.ts`, `database.module.ts`; testes em arquivo com reabertura após reinício. |
| Entidades com relacionamentos | ATENDIDO | Oito `*.entity.ts`, `database/entities.ts` e migrations; constraints e foreign_key_check verificados. |
| Seed de dados de exemplo | ATENDIDO | `backend/src/database/seed.ts`, `seed-opportunities.ts`, `cli.ts`; 7 usuários, 5 organizações, 5 oportunidades, 21 encontros e 2 inscrições; reexecução sem duplicidade. |
| CRUD das principais entidades | ATENDIDO | Oportunidades e submissões: Controllers/Services, Route Handlers e formulários; CRUDs executados em API e navegador. |
| Cadastro com hash bcrypt | ATENDIDO | `auth.service.ts`, `passwords.ts`, `user.entity.ts`; hash com custo 12, sem exposição e sem concessão de papel. |
| Login com JWT | ATENDIDO | `auth.module.ts`, `auth.service.ts`; tokens usados efetivamente nas suítes e pelo Next. |
| Guard protegendo rotas privadas | ATENDIDO | `JwtGuard` global em `app.module.ts`, sessão persistida e verificada a cada acesso. |
| `401` sem autenticação | ATENDIDO | Testes de sessão, painel, gestão, submissões e inscrição sem token/adulterado/revogado. |
| Rota restrita por papel | ATENDIDO | `RolesGuard`, `@Roles("organization")` na gestão e CRUD de oportunidades; voluntário não recebe privilégios. |
| `403` sem permissão | ATENDIDO | Testes de papel e alteração de atividade de outra organização; guarda também consulta papel atual no banco. |
| Front-end integrado à API | ATENDIDO | `src/lib/server/backend-api.ts`, `backend-route.ts`, serviços das features; cookie HttpOnly/Bearer e dados SQLite nos testes do navegador. |
| Fluxos principais testados | ATENDIDO | `backend/test/*`, `tests/security.test.ts`, `tests/e2e/portal.spec.ts`; 27 + 14 + 3 resultados finais aprovados. |
| README com instruções | ATENDIDO | `README.md`, `.env.example`, `backend/.env.example`, `docs/API.md`, `docs/AUTH.md`, `docs/backend.md`; comandos, seed, credenciais fictícias e limites documentados. |
| Repositório preparado para entrega | ATENDIDO | Preparo local: branch de trabalho, workspace/lockfile, CI, exemplos de ambiente e exclusão de bancos/segredos/builds revisados. Publicação não realizada, conforme a regra de não fazer push sem autorização. |

Nenhum item obrigatório de implementação do plano ficou marcado como PARCIAL ou NÃO ATENDIDO.
As limitações e ações externas abaixo não são apresentadas como funcionalidades implementadas.

## Limitações e ações externas

- Não há envio de e-mail. A emissão registra certificados de participação e horas no sistema;
  `sentCount` foi mantido por compatibilidade do contrato, sem significar mensagens enviadas.
- Comprovantes externos permanecem em análise. Um processo de avaliação administrativa não
  existia no front-end e não foi inventado para aprovar automaticamente suas horas.
- Dados do adaptador JSON/scrypt e documentos IndexedDB antigos não são importados automaticamente.
  Foram preservados; a base SQLite usa novo cadastro ou seed demonstrativo.
- SQLite e limites de autenticação por processo atendem ao escopo acadêmico. Não foi validado
  um ambiente com réplicas, balanceador ou armazenamento distribuído.
- A validação do navegador usa Chromium; não foi executada em Firefox/Safari ou dispositivo físico.
- O workflow GitHub foi atualizado, mas sua execução remota não foi observada. Não houve push,
  deploy, merge ou reescrita do histórico. Os commits locais foram feitos com autoria e committer
  de Fernando Buligon; a publicação permanece sob controle do usuário.
- Os servidores de teste foram encerrados. Para uso local, configure os arquivos de ambiente e
  execute os comandos do README; nenhuma chave real foi criada ou versionada para o usuário.
- O PDF e a apresentação antigos foram mantidos como material histórico do protótipo. A documentação
  atual da API e da execução é a do README e dos arquivos Markdown atualizados.

## Roteiro para demonstração ao professor

1. Preparar `.env.local` e `backend/.env`, gerar JWT_SECRET, escolher SEED_PASSWORD e executar
   `pnpm backend:migrate`, `pnpm backend:seed`, `pnpm backend:dev` e `pnpm dev` em dois terminais.
2. Mostrar `GET http://127.0.0.1:3001/api/health` e a estrutura dos módulos/entidades/migrations.
3. Criar uma conta em `/criar-conta`, entrar e inscrever-se pelo catálogo. Recarregar e consultar
   a agenda; cancelar uma inscrição e conferir a vaga liberada.
4. Em `/certificados`, enviar um PDF/JPG/PNG, editar metadados, recarregar, baixar o arquivo e
   comparar com o original. Mostrar que horas em análise não aumentam o saldo homologado.
5. Entrar em outro navegador como `organizacao@portal.example`, com a senha escolhida no seed.
   Criar/editar uma atividade sem inscrições e demonstrar sua exclusão com confirmação.
6. Selecionar a horta comunitária, que já possui um presente no seed; emitir os certificados.
   Recarregar e verificar que presença/emissão estão encerradas e que não é possível emitir outra vez.
7. Entrar como `voluntario@portal.example` e mostrar o acréscimo de 20 horas de Extensão no painel.
   Uma conta distinta não vê o mesmo saldo ou os comprovantes alheios.
8. Mostrar as respostas `401` sem token, `403` para voluntário tentando gestão e `409` para
   duplicidade/conflito. Rodar `pnpm check` e `pnpm test:e2e` para reproduzir as evidências.

As credenciais são fictícias e usam a senha explicitamente configurada no seed. Para repetir
a demonstração de uma atividade já encerrada, crie outra atividade pelos formulários; o seed
não apaga emissões nem redefine presenças existentes.
