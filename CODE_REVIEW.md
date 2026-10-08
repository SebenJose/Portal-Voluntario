# Code review — correções e revalidação

Data: 7 de outubro de 2026. Base recebida por pull:
`a1f5edf3b0db013fccf8d0ee30afa315f92cc1c1`. Branch de trabalho:
`fix/corrigir-auditoria`.

## Resumo executivo atual

Os cinco achados funcionais da revisão inicial foram tratados. O painel usa inscrições da
conta autenticada e não apresenta horas fictícias; recursos sem backend ficam indisponíveis
fora da demonstração; lotes reconciliam sucessos e falhas; presença é encerrada depois do
despacho simulado. O histórico de certificados com arquivo em IndexedDB já veio no pull,
foi preservado e testado em navegador.

Os seis achados de segurança foram corrigidos no adaptador local, conforme
[AUDITORIA_SEGURANCA.md](AUDITORIA_SEGURANCA.md). Não foi implementado um backend real
de gestão, homologação ou emissão de certificados como parte dessas correções.

## Fechamento dos achados

Severidade/confiança referem-se ao achado original. Causa, pré-condições, impacto e evidência
original estão no registro histórico abaixo, com referências à base antiga.

| ID | Severidade / confiança | Situação e localização atual | Evidência de regressão |
| --- | --- | --- | --- |
| CR-01 | Média / alta | Corrigido: `src/features/dashboard/services/dashboard-summary.ts:7` deriva atividades/contagem das inscrições do proprietário; horas homologadas são zero enquanto não existir aprovação real. `src/app/painel/page.tsx:7` passa o resumo validado ao componente. | `tests/security.test.ts:167`; HTTP H06 e navegador B02/B04: conta nova vazia, inscrição da própria conta aparece e horas declaradas não geram crédito (D03). |
| CR-02 | Média / alta | Corrigido por indisponibilidade explícita: `src/lib/demo-mode.ts:2` exige opt-in em produção. Dashboard, certificados e gestão não chamam integrações inexistentes fora da demonstração. APIs de organização verificam sessão/papel e respondem 501 para papel autorizado. | HTTP H05/H06 e builds nos dois modos; navegador D01/D04 confirma preservação da demonstração e recusa de gestão ao voluntário. Essa correção não entrega serviços reais de upload/emissão. |
| CR-03 | Baixa / alta | Corrigido no pull e revalidado: `src/features/certificates/mocks/certificate-store.ts:50` persiste dados/arquivo, `:80` filtra proprietário, `:93` verifica proprietário no download. UI informa armazenamento local e análise simulada. | Navegador D01/D02/D03: upload pelo formulário, histórico após reload, download e outra conta sem acesso. Registro local não promete homologação real. |
| CR-04 | Média / alta | Corrigido: `src/features/organizations/services/organization-activities.ts:97` aguarda Promise.allSettled e retorna sucessos/falhas. `src/features/organizations/components/organization-management-page.tsx:120` aplica respostas reais e deixa falhas selecionadas para retry. | `tests/security.test.ts:214`: uma falha imediata e um sucesso tardio; função só termina depois de ambos e conserva o sucesso. Resultado com ID inesperado é recusado pelo serviço. |
| CR-05 | Baixa / alta | Corrigido com encerramento após despacho: `src/mocks/handlers.ts:95` recusa PATCH posterior com 409; UI bloqueia presença individual/em lote depois de despacho. Feedback informa que nenhum e-mail foi enviado. | `tests/security.test.ts:233`: despacho 201, mudança de presença 409, novo despacho 409; segunda organização usa estado próprio sem a flag da primeira. |

## Plano de correção e continuidade

| Prioridade | Entrega | Situação |
| --- | --- | --- |
| P0/P1 | Controles SEC-01–SEC-06 | Implementados no servidor local e testados; configuração de produção documentada. |
| P1 | Dados pessoais corretos no painel e estado vazio | Implementado; nenhuma hora é homologada por mock/declaração. |
| P1 | Contrato de demonstração versus funcionalidades integradas | Implementado: opt-in em produção e indisponibilidade explícita no modo real. |
| P1 | Reconciliação de lote e retry dos participantes restantes | Implementado no serviço e na UI. |
| P2 | Presença após despacho e mensagens de simulação | Implementado no mock/UI; emissão real futura requer modelo persistente e autorização por organização. |
| Próxima integração | Gestão, emissão, aprovação e arquivos no backend | Fora do escopo dessas correções; funcionalidade ausente permanece claramente indicada, sem falso sucesso. |

## Validação e compatibilidade

`pnpm test` passou com **14 testes** e entrou na CI/`pnpm check`. Passaram também
`pnpm lint`, `pnpm exec tsc --noEmit`, build padrão e build de demonstração.
Foram aprovados 8 cenários HTTP e 11 cenários de navegador (7 reais + 4 de demonstração),
usando somente loopback, contas sintéticas e diretórios temporários.

Cadastro agora responde 202 sem sessão automática e pede login posterior. Sessões anteriores
são incompatíveis com o novo schema e exigem novo login. Em produção, `PORTAL_ORIGIN`
é obrigatório e mocks só iniciam com `NEXT_PUBLIC_API_MOCKING=enabled` definido no build.
Nenhuma dependência foi adicionada ou segredo real alterado.

---

## Registro histórico da revisão inicial

**A partir daqui, descrições, linhas, testes e plano se referem à base
`bf188428d8e451dda5f7cc083224dc004d277410`, anterior ao pull/correções.
Este histórico conserva a evidência e não reabre os achados tratados acima.**
# Code review — Portal Voluntário

Data: 7 de outubro de 2026. Base: `bf188428d8e451dda5f7cc083224dc004d277410`.

## Resumo executivo

A revisão identificou cinco problemas ou limitações funcionais confirmados: três de severidade média e dois de severidade baixa. O painel combina identidade real com histórico fixo; operações de organização e documentos dependem exclusivamente do MSW; o recibo de upload sugere uma homologação que não é persistida; atualização em lote pode deixar a UI divergente; o despacho simulado não trata mudanças posteriores de presença.

Os seis achados de segurança, incluindo a credencial pública ativa em produção, login CSRF e falta de revogação no logout, estão em [AUDITORIA_SEGURANCA.md](AUDITORIA_SEGURANCA.md), com fluxos, pré-condições, provas locais e regressões. São prioridades anteriores ao uso com contas reais. Este relatório não duplica esses achados nem transforma limitações do protótipo em comprometimento de um backend inexistente.

| ID | Severidade | Confiança | Tipo/alcance | Problema |
| --- | --- | --- | --- | --- |
| CR-01 | Média | Alta | Integridade da informação exibida | Conta nova recebe horas e atividades fictícias como histórico pessoal |
| CR-02 | Média | Alta | Limitação funcional no build padrão | Gestão e submissão sem endpoints reais |
| CR-03 | Baixa | Alta | Feedback enganoso da demonstração | Recibo afirma recebimento/análise sem persistência |
| CR-04 | Média | Alta | Falha de lógica com erro parcial | Lote de presenças não reconcilia operações que já tiveram sucesso |
| CR-05 | Baixa | Alta | Máquina de estados do mock | Presença pode mudar após despacho, sem novo despacho possível |

## Escopo e arquitetura revisada

Foram examinadas todas as features presentes, rotas, serviços, tipos/schemas, componentes compartilhados, configuração Next.js/TypeScript/ESLint/pnpm, mocks e workflow. A skill disponível `security-code-audit` orientou a revisão. `code-review` e `code-security` não estavam instaladas.

O projeto mantém a estrutura Feature-Based e usa serviços para chamadas HTTP. Cadastro/login/inscrição são reais no servidor Node, com armazenamento local isolável por `PORTAL_DATA_DIR`. Organização, presença, certificados e upload são mocks; horas e próximas atividades vêm de constantes. Não existem backend Spring/PostgreSQL, papéis administrativos, cadastro de organizações ou autorização por tenant implementados nesta base. Isso é diferente do escopo previsto na proposta acadêmica, e deve orientar os próximos incrementos.

Somente estes dois relatórios foram adicionados ao repositório, na branch `docs/auditoria-seguranca`, sem commits. Provas e dados sintéticos ficaram em `/tmp`; nenhuma dependência ou código de produção foi alterado.

## Achados

### CR-01 — Média: painel apresenta histórico fixo como pertencente ao usuário

- **Confiança:** alta. **Local:** `src/features/dashboard/components/dashboard-page.tsx:12`, `:22`, `:58`, `:109`; `src/features/dashboard/data/dashboard.ts:3`, `:9`.
- **Causa:** `hoursSummary` e `upcomingActivities` são importados diretamente de fixtures e não consultam identidade, inscrições ou registros homologados. O número de participações é o literal `08`. O usuário recebido pela página personaliza apenas o shell, não os dados de progresso.
- **Pré-condições:** qualquer conta autenticada, inclusive recém-criada, com MSW ligado ou desligado.
- **Fluxo:** `/painel` autentica usuário → `DashboardPage` soma os mesmos 24/18/32 valores → exibe 74h e oito participações → lista duas atividades fixas como inscrita/presença pendente.
- **Impacto:** o usuário interpreta dados demonstrativos como progresso e inscrições reais. Uma inscrição feita no catálogo não atualiza coerentemente esse painel. Não há evidência de vazamento de histórico real de outra pessoa ou de crédito efetivo de horas no banco.
- **Evidência:** R01 criou uma conta sintética nova, confirmou `registeredIds: []` no catálogo e recebeu HTML de `/painel` com 74h, oito participações e presença pendente. O comportamento coincide com as constantes e ocorre no build real sem MSW.
- **Correção:** definir contrato de dashboard por usuário, buscar dados na camada de serviços/DAL e validar respostas com Zod. Estado inicial vazio deve mostrar zero/nenhuma atividade conforme as regras. Calcular créditos apenas de registros autorizados/homologados. Se a entrega continuar demonstrativa, tornar isso explícito no conteúdo, sem atribuir o histórico fictício à conta real.
- **Regressão:** conta nova tem histórico vazio; A não recebe registros de B; inscrição de A aparece corretamente em suas atividades; presença e homologação influenciam horas segundo o contrato; limites por eixo são aplicados na regra de negócio, não só na barra visual.

### CR-02 — Média: build padrão expõe operações sem backend implementado

- **Confiança:** alta. **Local:** `src/components/providers/msw-provider.tsx:14`; `src/features/organizations/services/organization-activities.ts:62`, `:78`, `:100`; `src/features/dashboard/services/external-submissions.ts:39`; `src/features/dashboard/components/dashboard-page.tsx:136`; `src/app/organizacao/page.tsx:7`.
- **Causa:** os serviços solicitam `/api/organizations/...` e `/api/submissions`, mas não há Route Handlers, rewrites ou adaptador externo para esses caminhos. MSW fica desligado por padrão em produção. A UI mantém essas funcionalidades disponíveis sem um contrato de capacidade do ambiente.
- **Pré-condições:** build/start de produção sem `NEXT_PUBLIC_API_MOCKING=enabled` no build, ou desenvolvimento com mocking desabilitado.
- **Fluxo:** UI oferece gestão/upload → serviço chama caminho relativo → Next não encontra rota → `404` → serviço converte para mensagem de erro. Repetir a operação não resolve a ausência do endpoint.
- **Impacto:** gestão não carrega e envio de documentos não conclui. O tratamento de erro evita sucesso silencioso nesse modo, mas os recursos aparecem utilizáveis. É uma limitação funcional confirmada do protótipo; não demonstra acesso sem autorização a banco real.
- **Evidência:** T08: listagem, despacho e submissão retornaram `404` no `next start`; R02: PATCH de presença também `404`. O inventário de rotas do build contém somente seis APIs reais de auth/oportunidades. `docs/DEMO.md` documenta o opt-in para demonstrar essas operações, não a existência de backend real.
- **Correção:** implementar/integrar adaptadores reais antes de disponibilizar a capacidade em produção. Os endpoints devem validar identidade, papel, ownership, payload e persistência. Enquanto ausentes, indicar a indisponibilidade ou restringir a feature ao ambiente de demonstração com comunicação explícita. Evitar fallback que transforme um `404` real em falso sucesso MSW.
- **Regressão:** testar build padrão com mocks desligados: funcionalidades anunciadas possuem APIs operacionais ou indicação clara de indisponibilidade. Testar também sucesso, vazio, `401`, `403`, validação, rede e `500` na integração real. Um healthcheck real não deve depender do handler `/api/health` do navegador.

### CR-03 — Baixa: upload simulado promete análise futura sem guardar o documento

- **Confiança:** alta. **Local:** `src/mocks/handlers.ts:106`, `:133`; `src/features/dashboard/components/external-certificate-form.tsx:43`, `:65`, `:68`.
- **Causa:** o handler lê/valida `FormData` e gera um ID, mas não armazena documento, campos ou submissão. O formulário reseta os dados e anuncia recebimento para análise e acompanhamento de homologação, sem indicar simulação nessa mensagem.
- **Pré-condições:** MSW ativo e upload aceito. O servidor real recusa a rota com `404`, conforme CR-02.
- **Fluxo:** formulário → serviço → mock gera protocolo efêmero → componente guarda recibo em estado React → formulário é resetado → refresh descarta estado → inexiste submissão recuperável.
- **Impacto:** o usuário pode acreditar que entregou um documento para avaliação e que poderá acompanhá-lo. O protocolo não identifica um registro persistido. Não há upload real, análise real nem atribuição de horas; a presença de um ID aleatório não prova essas etapas.
- **Evidência:** U06 obteve recibo `201`; leitura completa do handler mostrou ausência de qualquer store/arquivo/integração. `receipt` existe somente em `useState`. Os únicos arquivos reais usados pelo backend são accounts/enrollments.
- **Correção:** no modo demonstrativo, marcar o recibo como simulado e explicar sua ausência de persistência; não prometer acompanhamento implementado. No fluxo real, emitir recibo somente após persistir submissão e documento com usuário autorizado, oferecendo consulta posterior. Implementar autenticação/autorização e validação de conteúdo no servidor antes disso.
- **Regressão:** demonstração identifica a simulação antes e depois do envio. Integração real permite recuperar o recibo e seu status após reload/login; falha de armazenamento não produz confirmação de recebimento. Usuário B não pode consultar documento/recibo de A.

### CR-04 — Média: erro parcial de atualização em lote deixa estado local divergente

- **Confiança:** alta para serviços/fluxo de controle; o componente não foi montado no harness. **Local:** `src/features/organizations/components/organization-management-page.tsx:119`, `:125`, `:149`; `src/features/organizations/services/organization-activities.ts:72`.
- **Causa:** `Promise.all` dispara PATCHs independentes e rejeita ao primeiro erro. Operações bem-sucedidas já podem ter alterado o destino, inclusive outras ainda pendentes. `setActivities` só é executado se todas tiverem sucesso; o catch exibe erro sem reconciliar ou recarregar resultados.
- **Pré-condições:** seleção de pelo menos dois participantes; um PATCH bem-sucedido e outro falhando. No estado atual isso pode ser exercitado por mock de erro; o mesmo código de UI será usado por um backend integrado.
- **Fluxo:** lote → múltiplos PATCHs → participante A alterado → participante B falha → Promise rejeita → atualização local do lote é pulada → tela conserva o status antigo de A.
- **Impacto:** tela e serviço discordam sobre presenças; operador pode despachar certificados com contagem desatualizada ou repetir comandos supondo que ninguém foi alterado. Nenhuma atomicidade é fornecida por `Promise.all`.
- **Evidência:** U07 usou os serviços e handlers MSW originais, injetando `500` em um PATCH. A Promise do lote rejeitou e a leitura posterior confirmou que o outro participante mudou para presente. Inspeção das linhas 125–154 confirmou que a UI não aplica esse sucesso quando ocorre o erro. O teste não afirma ter reproduzido pixels/interações do componente montado.
- **Correção:** decidir o contrato: lote transacional no backend, ou resultado individual explícito. Para resultado parcial, aguardar todas as operações, aplicar sucessos retornados, informar falhas por participante e reconciliar a lista ao final. Evitar habilitar despacho enquanto a reconciliação estiver pendente. Não sintetizar o estado somente a partir do status solicitado se a resposta do serviço puder divergir.
- **Regressão:** dois PATCHs, um sucesso e um erro: a tela reflete o sucesso e identifica a falha; retry atinge somente pendentes conforme política. Testar também resposta tardia após a primeira falha, falha de rede e erro ao recarregar. Em endpoint transacional, confirmar rollback completo e nenhuma emissão com base em estado parcial.

### CR-05 — Baixa: presença continua editável após despacho e novo envio é bloqueado

- **Confiança:** alta. **Local:** `src/mocks/handlers.ts:79`, `:90`, `:100`; `src/features/organizations/components/organization-management-page.tsx:288`, `:339`.
- **Causa:** uma única flag `certificatesDispatched` bloqueia todo despacho futuro. Atualização de presença não consulta essa flag, e os botões de presença continuam ativos após o envio. Não há estado por destinatário ou política explícita de correção/reemissão.
- **Pré-condições:** MSW ativo, ao menos um presente e despacho já realizado; operador altera presença posteriormente.
- **Fluxo:** despacho simulado marca flag → PATCH altera inscrito/ausente para presente ou presente para ausente → segundo despacho retorna `409` → novo presente não pode receber o certificado no modelo; certificado anterior fica incompatível com a presença corrigida.
- **Impacto:** estado de frequência e despacho fica incoerente dentro da demonstração. Não há e-mail real ou certificado autêntico afetado nesta base. Portar essa máquina de estados sem mudança para o backend criaria problemas operacionais.
- **Evidência:** U05: primeiro despacho `201`, repetição `409`, alteração posterior de presença `200`. O handler permite qualquer transição entre os três estados válidos independentemente do despacho.
- **Correção:** definir quando presença é encerrada e como corrigir registros após emissão. Se encerrada, bloquear alterações no servidor e oferecer fluxo auditável de retificação; se houver correção, acompanhar emissão por participante, com idempotência e política de revogação/reemissão. O mock deve representar a mesma regra.
- **Regressão:** após emissão, alteração segue a política escolhida e não deixa certificados incompatíveis. Novo participante confirmado recebe emissão individual se permitida; reenvio não duplica certificado/e-mail; retificação exige permissão e gera histórico apropriado no backend real.

## Revisão de implementação e manutenção

Estas observações são recomendações preventivas, não novos bugs confirmados:

| Área | Evidência | Recomendação e teste relevante |
| --- | --- | --- |
| Separação de responsabilidades | `organization-management-page.tsx:109` coordena mutação em lote; `dashboard-page.tsx:22` agrega fixtures | Extrair orquestração/regra quando houver contrato real; manter a UI pequena. Testar comportamento, não detalhes de hooks |
| Contratos duplicados | `src/features/organizations/types/index.ts:5` e schemas privados em `services/organization-activities.ts:5`; `src/features/dashboard/types/index.ts:1` | Derivar contrato de schema compartilhado pela feature; fixtures devem ser validadas. Divergência futura é risco, não falha observada hoje |
| Validação do serviço de submissão | `src/features/dashboard/services/external-submissions.ts:18` usa valores tipados sem repetir o schema completo | Não confiar somente no chamador tipado ao integrar fonte externa. A validação obrigatória continua na API real; MIME e FileList do cliente são feedback, não segurança |
| Carregamentos assíncronos | `organization-management-page.tsx:41`, `:58`; catálogo usa AbortController | Ao evoluir a tela, tratar cancelamento/respostas antigas; não foi confirmado incidente de dados por essa hipótese |
| Sessão no estado de UI | `src/components/layout/app-shell.tsx:82`; usuário inicial evita novas consultas | Definir revalidação de sessão no cliente para melhorar feedback. A proteção efetiva deve continuar no servidor; props não substituem autorização |
| Testes/CI | `package.json:5`; `.github/workflows/ci.yml:41` | Não há suíte de testes versionada nem comando test. Incorporar regressões de auth, ownership, CSRF, capacidade e erros parciais, com dados isolados |
| Runtime | Next exige Node `>=20.9.0`; MSW instalado exige `>=22.12.0`; workflow usa Node 24 | Fixar/documentar runtime compatível via engines/arquivo de versão para evitar PATH local incompatível. Node 24 já instalado permitiu validar o build |
| Zustand e CLI | Dependência Zustand sem uso; `shadcn` em dependencies | Revisar dependências necessárias e classificação de ferramentas quando houver mudança autorizada; nenhuma remoção foi feita |
| Persistência local | `src/lib/server/local-store.ts:24`; restrição documentada em AUTH | Preservar uma instância para demonstração; planejar transações/ownership no banco antes de escala. Não chamar rename atômico de transação distribuída |

Os schemas de auth repetem validação no servidor; registros e respostas não contêm senhas/hashes. O fluxo de inscrição tem checagens de duplicidade, capacidade e usuário autenticado. Ícones observados usam Lucide e nome acessível/texto ou `aria-hidden`; formulários principais usam RHF/Zod e mensagens associadas. Essas propriedades positivas não eliminam os achados de autorização e CSRF do relatório de segurança.

## Verificação executada e limites

| Verificação | Resultado |
| --- | --- |
| `pnpm lint` | Passou |
| `pnpm exec tsc --noEmit` | Falhou por referências antigas de `.next/dev/types` a `/sobre`; antes do build havia também tipos antigos de produção |
| `pnpm build` com Node 18 do PATH | Recusado pelo requisito de runtime |
| `pnpm build` com Node 24.21.0 já instalado | Passou; Next 16.3.8/webpack; seis APIs reais e páginas esperadas |
| TypeScript com configuração temporária, fontes e tipos de produção, sem `.next/dev` antigo | Passou; não substitui o registro do erro do comando original |
| HTTP/navegador/módulos | 27 grupos direcionados no total; detalhes e matriz em AUDITORIA_SEGURANCA |
| Lote parcial | Serviços/MSW reais testados com falha injetada; fluxo do componente lido; sem teste montado de React |

Não foram removidos caches para fazer o typecheck parecer limpo. Recomenda-se regenerar os tipos de desenvolvimento no fluxo normal autorizado ou validar a suíte em checkout limpo. Os erros de cache não foram classificados como defeitos do TypeScript de produção.

Todos os ensaios usaram loopback, fixtures e contas sintéticas. O servidor real foi iniciado com storage e chave temporários. Não foram executados testes destrutivos, alterações em contas preexistentes, testes de carga ou acesso a serviços externos. Scripts adicionais estão em `/tmp/portal-security-audit`, fora do diff; os cenários e critérios de regressão documentados aqui permanecem reproduzíveis sem esses arquivos efêmeros.

## Plano de correção

| Ordem | Prioridade | Entrega | Aceite |
| --- | --- | --- | --- |
| 1 | P0/P1 | Resolver SEC-01–SEC-05 do relatório de segurança | Demo desativada no real; CSRF recusado; logout revoga; RBAC e abuso controlados |
| 2 | P1 | Contrato de funcionalidades reais versus demonstração (CR-02/03) | Operações têm backend autorizado/persistente ou indicação explícita de simulação/indisponibilidade |
| 3 | P1 | Dashboard por usuário e estado vazio (CR-01) | Conta nova sem histórico fictício; dados de terceiros não aparecem |
| 4 | P1 | Contrato de lote e reconciliação (CR-04) | Erro parcial tem resultados consistentes e retry correto |
| 5 | P2 antes de emissão real | Máquina de estados de presença/certificados (CR-05) | Correção/reemissão/idempotência definidas no servidor e reproduzidas pelo mock |
| 6 | P2 | Contratos derivados, runtime consistente e regressões em CI | Checks passam em checkout limpo; testes cobrem comportamento e negativas de autorização |

Cada incremento deve preservar a estrutura Feature-Based e usar pnpm. A integração futura não deve transferir a responsabilidade de autorização para React, Zod, Zustand ou MSW.
