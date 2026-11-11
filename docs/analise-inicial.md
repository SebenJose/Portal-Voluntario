# Análise inicial do back-end

Análise realizada em 10/11/2026, a partir de `origin/main` (`fcd0f31`) e da leitura integral de `plano-de-trabalho.txt`. Este documento descreve o diagnóstico e o destino da implementação; endpoints propostos não devem ser interpretados como já implementados.

## Estrutura e diagnóstico

O projeto é um front-end Next.js 16.3.8 (App Router e Proxy), React 19, TypeScript estrito, Tailwind 4 e shadcn/ui. Usa React Hook Form com Zod, Motion e Lucide. Zustand está instalado, mas não é necessário para substituir a persistência. O código é organizado por domínio em `src/features`, com componentes compartilhados em `src/components`, serviços nas features e contratos Zod na borda.

Existe um back-end parcial em `src/app/api`: cadastro, login, sessão, logout, catálogo e inscrições. Não existe NestJS, TypeORM ou banco SQL na versão analisada. `src/lib/server/local-store.ts` persiste JSON em `.local-data` (ou `PORTAL_DATA_DIR`), com validação e renomeação de arquivos temporários, limitado a um processo. Contas usam scrypt; sessões usam HMAC e registros revogáveis no servidor. Isso deverá ser migrado deliberadamente para bcrypt/JWT, preservando a revogação e as proteções existentes.

As APIs reais de organizações verificam autenticação e papel, mas retornam `501` para uma organização autenticada. Não existem Route Handlers reais de certificados. Parte das telas só é habilitada por `isDemoModeEnabled`, e não basta trocar uma URL para concluir a integração.

## Inventário de telas e fluxos

| Página | Funcionalidade e componentes | Fonte atual e acesso |
| --- | --- | --- |
| `/` | Apresentação, navegação e chamadas para cadastro/oportunidades (`features/home`) | Conteúdo institucional estático; pública. Não necessita CRUD. |
| `/criar-conta` | Nome, e-mail, senha e confirmação; validação e feedback (`registration-form`) | `POST /api/auth/register`; contas JSON. Cria somente `volunteer`. Retorna `202` também para e-mail existente. |
| `/entrar` | Login e redirecionamento interno seguro (`login-form`, `safe-redirect`) | `POST /api/auth/login`; sessão HttpOnly. Usuário já autenticado é redirecionado no servidor. |
| `/oportunidades` | Catálogo, busca, filtros, contagens, inscrição e cancelamento com confirmação | Catálogo fixo validado no servidor + inscrições JSON; consulta pública, mutações autenticadas. Filtros no cliente. |
| `/minhas-atividades` | Inscrições da conta, agenda por encontros e cancelamento | Mesmo contrato do catálogo; autenticação no Proxy e página. |
| `/painel` | Inscrições, próximos encontros, horas por eixo e totais dos certificados | Resumo calculado no servidor sobre inscrições JSON; horas reais sempre zero. Certificados no cliente dependem de mock. |
| `/painel?demonstracao=horas` | Horas e atividades concluídas fictícias para apresentação | MSW em `/api/demo/dashboard`, fixtures isoladas. No modo demonstração, `/painel` também mostra esse exemplo por padrão; `demonstracao=conta` mostra dados da conta. |
| `/certificados` | Envio multipart, histórico, totais declarados e download do comprovante original | MSW + IndexedDB por usuário; somente modo demonstração. PDF/JPG/PNG, até 5 MB; status `Em análise`, sem homologação. |
| `/organizacao` | Seleção de atividade, busca/filtro de participantes, seleção em lote, presença e despacho | Papel `organization` obrigatório no servidor. MSW mantém cópias em memória por organização; APIs reais retornam `501`. |
| `/demonstracao/gestao` | Exemplo público da gestão com presenças e despacho simulados | MSW em `/api/demo/organizations/activities`, estado separado e reiniciado ao recarregar. Não concede papel nem altera contas reais. |
| Navegação compartilhada | Cabeçalho, AppShell, confirmação de logout, estados de carregamento | `GET /api/auth/session`, `POST /api/auth/logout`; preservam destino de retorno e revogam sessão. |

Os componentes da agenda reutilizam encontros explícitos (`date`, `startsAt`, `endsAt`); datas são locais, sem conversão automática para UTC. As operações em lote de presença já reconciliam sucessos e falhas individualmente. A migração deve preservar esses comportamentos.

## Dados fixos, mocks e armazenamento

- `src/features/opportunities/data/opportunities.ts`: cinco oportunidades, encontros e contagens iniciais fictícias de inscritos. O seed poderá aproveitar os textos e encontros, mas a contagem deverá ser calculada a partir de inscrições reais; não adicionar os números fictícios ao total persistido.
- `src/features/opportunities/services/enrollments.ts`: catálogo e inscrições, com `404` para recurso ausente e `409` para duplicidade/falta de vagas. A capacidade precisa de garantia transacional no SQLite.
- `src/features/auth/services/accounts.ts` e `session.ts`: contas, hash scrypt e sessões em arquivos. Identidade e papel são consultados no servidor; logout revoga apenas a sessão atual.
- `src/features/certificates/mocks/certificate-store.ts`: metadados e Blob no IndexedDB, isolados por conta. O navegador não deve continuar sendo a fonte de persistência no modo API real.
- `src/features/certificates/mocks/handlers.ts`: envio, listagem e download simulados; cenários vazio, loading, erro de rede e servidor.
- `src/features/organizations/mocks`: participantes fictícios, estado em memória por organização e cópia pública independente. Despacho exige pelo menos um presente e bloqueia posteriores alterações/novo despacho (`409`).
- `src/features/dashboard/mocks`: painel fictício, separado da conta. `dashboard/data/dashboard.ts` também contém exemplos; não serve como fonte para o saldo real.
- `src/mocks/handlers.ts`, `src/components/providers/msw-provider.tsx` e `src/lib/demo-mode.ts`: controlam interceptação/demonstração. Autenticação passa para a rede; catálogo normal e inscrições também. Há um health mock que não comprova disponibilidade do servidor.
- Não há armazenamento de JWT em localStorage. Não introduzir esse padrão na integração.

## Entidades e relacionamentos propostos

| Entidade | Atributos essenciais | Relacionamentos e restrições |
| --- | --- | --- |
| Usuário | UUID, nome, e-mail normalizado único, hash bcrypt, papel `volunteer` ou `organization`, criação | 1:N inscrições, submissões e sessões. Cadastro público jamais escolhe papel. O papel existente `organization` atende à autorização exigida; não inventar `ADMIN` sem necessidade. |
| Organização | UUID, nome, usuário responsável | Responsável autenticado; 1:N oportunidades. O nome não deve vir de uma conta voluntária nem ser duplicado por oportunidade. |
| Oportunidade/atividade | ID público compatível com os slugs existentes, título, descrição, categoria, formato, local, rótulos de data/duração, horas, vagas, destaque, despacho | N:1 organização, 1:N encontros e inscrições. A gestão usa a mesma atividade do catálogo, sem tabela paralela de atividades fictícias. |
| Encontro | UUID, data local, início, término | N:1 oportunidade, término posterior ao início. |
| Inscrição/presença | UUID, data de inscrição, status `Inscrito`, `Presente` ou `Ausente` | N:1 usuário e oportunidade; vínculo único por par. O ID do participante da gestão deverá identificar o vínculo persistido. |
| Submissão externa | UUID, título, categoria, horas declaradas (1–200), descrição, data, status `Em análise`, nome/MIME/tamanho/documento | N:1 usuário; acesso e download somente pelo proprietário. Documento persistido no servidor, inicialmente BLOB SQLite para manter backup e transação juntos e evitar caminhos fornecidos pelo cliente. |
| Certificado de participação | UUID, data de emissão, horas e categoria registradas | Vínculo único com inscrição presente; criado transacionalmente no despacho. Evidencia emissão no sistema; envio por e-mail não existe no produto e não será prometido. |
| Sessão | UUID, usuário, expiração e revogação | JWT assinado identifica sessão revogável. Logout precisa invalidar uma cópia do token antes do prazo. |

Categorias atuais: Ensino, Pesquisa e Extensão. Não criar CRUD de categorias ou um processo de homologação externa sem fluxo existente. Submissão em análise nunca aumenta o banco de horas. O saldo de participações poderá ser calculado a partir dos certificados emitidos, sem tabela redundante de saldo.

## Matriz de funcionalidades e endpoints necessários

As rotas abaixo usam prefixo `/api`. O navegador poderá continuar chamando os Route Handlers Next como adaptador para a API Nest; os contratos internos devem ser validados. `organization + dono` significa verificar papel **e** propriedade da atividade em cada operação.

| Método e rota planejados | Finalidade e entrada | Permissão | Situação inicial |
| --- | --- | --- | --- |
| `GET /health` | Verificar processo e conexão SQLite; `200` ou `503` | Pública, sem dados sensíveis | Só mock no front |
| `POST /auth/register` | Nome, e-mail, senha e confirmação; preservar resposta genérica `202` | Pública, sem concessão de papel | Next + JSON/scrypt |
| `POST /auth/login` | Credenciais; retornar JWT e usuário seguro ao adaptador | Pública; falha `401` | Next + HMAC |
| `GET /auth/session` | Validar sessão e obter usuário atual | JWT; `401` ausente/inválido/revogado | Next + JSON |
| `POST /auth/logout` | Revogar sessão; `204` sem corpo | JWT | Next + JSON |
| `GET /opportunities` | Catálogo e IDs inscritos do usuário; busca/categoria/formato quando necessários | Pública, contexto autenticado opcional | Fixtures + JSON |
| `GET /opportunities/:id` | Consultar atividade por ID; `404` ausente | Pública | Ainda inexistente |
| `POST /opportunities` | Criar atividade e encontros usando DTO | Organização responsável | Ainda inexistente; necessário CRUD principal |
| `PATCH /opportunities/:id` | Atualizar campos/encontros, respeitando vagas ocupadas e despacho | organization + dono | Ainda inexistente; necessário CRUD principal |
| `DELETE /opportunities/:id` | Excluir atividade sem inscrições/certificados; conflito `409` quando houver vínculos | organization + dono | Ainda inexistente; necessário CRUD principal |
| `POST /opportunities/:id/registrations` | Inscrever a conta autenticada; sem escolher `userId` pelo corpo; `201` | Voluntário | Next + JSON |
| `DELETE /opportunities/:id/registrations` | Cancelar o próprio vínculo, liberar vaga; respeitar presença encerrada | Voluntário | Next + JSON |
| `GET /organizations/activities` | Atividades da organização, participantes e estado de despacho | Organização responsável | `501` no Next, MSW na demo |
| `PATCH /organizations/activities/:id/participants/:participantId` | DTO de status de presença; `400`, `404`, `409` | organization + dono | `501` no Next, MSW na demo |
| `POST /organizations/activities/:id/certificates` | Emitir uma vez para participantes presentes e encerrar presença; `201` ou `409` | organization + dono | Simulação sem emissão real |
| `GET /submissions` | Histórico da própria conta, sem bytes do documento | JWT, proprietário | MSW + IndexedDB |
| `POST /submissions` | Metadados e documento multipart; `201`, limite 5 MB | JWT, proprietário | MSW + IndexedDB |
| `GET /submissions/:id` | Detalhes de um envio; `404` para ausência ou outro proprietário | JWT, proprietário | Ainda inexistente |
| `PATCH /submissions/:id` | Corrigir metadados enquanto em análise; sem alterar proprietário/status | JWT, proprietário | Ainda inexistente; necessário CRUD principal |
| `DELETE /submissions/:id` | Excluir envio em análise e documento na mesma transação | JWT, proprietário | Ainda inexistente; necessário CRUD principal |
| `GET /submissions/:id/document` | Baixar documento original com MIME e nome seguros | JWT, proprietário | MSW + IndexedDB |
| `GET /dashboard` | Resumo de inscrições, encontros e horas efetivamente emitidas | JWT | Cálculo local sobre JSON |

As rotas `/api/demo/*` pertencem à demonstração pública e poderão permanecer em MSW sem contaminar dados reais. CRUDs novos são operações das entidades existentes para cumprir o plano, não autorização para redesenhar a interface. A integração deverá decidir como expor edição/criação na gestão usando os componentes atuais e formulários RHF/Zod.

## Compatibilidade e decisões técnicas

1. Adicionar `backend/` como pacote pnpm do workspace, mantendo o front na raiz. Configuração TypeScript própria é necessária: Nest/TypeORM usam decorators com metadata e CommonJS; Next usa bundler/ES modules e não deve compilar o pacote do servidor.
2. Usar NestJS, `@nestjs/typeorm`, TypeORM e driver SQLite compatíveis entre si. Verificar peer dependencies antes da instalação, especialmente diante de mudanças entre versões de TypeORM. Não substituir por Prisma ou banco remoto.
3. Validar variáveis de ambiente; usar porta 3001 para o back-end e 3000 para o Next. Segredos permanecem apenas no servidor. Configurar origens CORS explícitas, sem curinga com credenciais.
4. Configurar `ValidationPipe` global com whitelist, rejeição de campos extras e transformação. DTOs com class-validator ficam no domínio; contratos Zod do cliente continuam válidos na borda.
5. Respostas Nest de sucesso: `{ data: ... }`; erros: `{ statusCode, error, message, details? }`. O futuro adaptador Next retira o envelope e traduz erros para os contratos atuais. Download binário e `204` não recebem envelope.
6. Logs incluem método, caminho sem query, status e duração; não incluir corpo, cabeçalhos, cookies, tokens, query ou hash de senha. Erros inesperados retornam mensagem genérica.
7. Sessão HttpOnly e controles de origem das mutações Next devem ser preservados. O BFF enviará JWT ao Nest no servidor; CORS sozinho não é autenticação nem proteção CSRF.
8. Trocar scrypt por bcrypt altera o formato do hash. Não converter contas silenciosamente ou apagar arquivos existentes. Definir migração explícita ou usar banco demonstrativo novo e comunicar que contas antigas não foram importadas.
9. Validar limite em bytes do bcrypt (72), além do comprimento visual; o front atual aceita até 128 caracteres. Resolver a incompatibilidade de forma explícita antes de integrar cadastro/login.
10. Usar migrations e `synchronize: false`; seed reproduzível, transacional e com credenciais fictícias fornecidas explicitamente. Não importar automaticamente nomes/e-mails fictícios de participantes como pessoas reais.

Referências técnicas consultadas: [integração de banco no Nest](https://docs.nestjs.com/techniques/database), [ValidationPipe](https://docs.nestjs.com/techniques/validation) e [drivers SQLite do TypeORM](https://typeorm.io/docs/drivers/sqlite/). Os guias locais do Next em `node_modules/next/dist/docs` devem ser lidos antes de modificar código da aplicação.

## Sequência de implementação e critérios

1. **Análise:** este documento estabelece inventário, dados, entidades, permissões e contratos.
2. **Estrutura:** criar pacote Nest isolado, configuração validada, conexão SQLite, logs, interceptor, filtro e health que consulta o banco. Verificar inicialização real e erros HTTP.
3. **Persistência:** entidades, relações, constraints, migrations e seed idempotente com papéis distintos. Testar reabertura do arquivo SQLite e relações.
4. **API:** serviços/repositórios e DTOs por domínio, CRUD de oportunidades e submissões, inscrições, presenças e emissão transacional.
5. **Autenticação:** bcrypt, JWT, sessão revogável, Guard de identidade e de papel/propriedade; testar `401`/`403` e cadastro sem privilégios.
6. **Revisão transversal:** validação, logs sem segredos e erros uniformes em todos os módulos.
7. **Integração:** adaptadores Next e serviços existentes, variável de URL, estados de erro/loading, retirada das dependências de mock nos fluxos reais e preservação da demo pública.
8. **Testes:** cobrir API e fluxos reais no navegador, concorrência de vagas, isolamento, revogação, arquivos e persistência após reinício. Executar também os checks existentes.
9. **Documentação:** atualizar instruções de execução conforme cada etapa existir; documentar seed, endpoints e configuração sem segredos reais.
10. **Auditoria:** preencher `docs/relatorio-final.md` somente com status e evidências reais. O sistema completo permanece pendente enquanto houver etapas obrigatórias sem implementação/testes.
