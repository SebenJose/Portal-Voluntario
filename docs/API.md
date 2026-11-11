# API REST do Portal Voluntário

Base direta: `http://127.0.0.1:3001/api`. Use `Authorization: Bearer <JWT>` nas rotas privadas.
O navegador chama as rotas equivalentes no Next (`http://localhost:3000/api`); o adaptador lê o
cookie HttpOnly, envia Bearer ao Nest e remove o envelope de sucesso. Não cole JWT em localStorage.

## Respostas e erros

Sucesso com corpo: `{ "data": ... }`. Logout e exclusões que retornam `204` não têm corpo.
Download retorna os bytes originais, MIME do documento e Content-Disposition attachment.

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Confira os dados enviados.",
  "details": ["hours must not be less than 1"]
}
```

Os exemplos de status nas tabelas se somam aos erros gerais: `400` para DTO/parâmetro inválido,
`401` para ausência, expiração ou invalidade de JWT, `403` para papel/propriedade incompatíveis,
`404` para recurso ausente, `409` para conflito de estado e `429` para limite de autenticação.
Falhas inesperadas retornam `500` genérico, sem SQL, senha ou stack. O adaptador Next responde
`503` se não conectar à API e `502` se o contrato recebido for inválido. Mutações pelo Next
exigem Origin correspondente à origem do portal; JSON tem limite de 8192 bytes.

## Endpoints

| Método e rota após `/api` | Finalidade / entrada | Acesso | Sucesso e erros específicos |
| --- | --- | --- | --- |
| `GET /health` | Consulta real da conexão SQLite, sem parâmetros. | Público | `200` com status/database; `503` com banco indisponível. |
| `POST /auth/register` | Nome, e-mail, senha e confirmação (JSON abaixo). | Público | `202` genérico para novo/duplicado; `400` inválido. Não autentica. |
| `POST /auth/login` | E-mail e senha. | Público | `200` com accessToken, expiresAt e usuário sem hash; `401` credencial incorreta. |
| `GET /auth/session` | Consultar usuário e papel atuais. | JWT | `200` com `{user}`; `401` inclui sessão revogada. |
| `POST /auth/logout` | Revogar somente a sessão atual, sem corpo. | JWT | `204`; cópias do token deixam de funcionar. |
| `GET /opportunities` | Catálogo, `items` e `registeredIds`; filtros abaixo. | Público, JWT opcional | `200`; IDs inscritos apenas da conta autenticada. |
| `GET /opportunities/:id` | Consultar oportunidade por slug. | Público, JWT opcional | `200`; `404` ausente. |
| `POST /opportunities` | Criar oportunidade e encontros, JSON abaixo. | Organização | `201`; `409` slug duplicado; `403` conta sem organização. |
| `PATCH /opportunities/:id` | Atualizar qualquer campo da criação, exceto ID; campos ausentes são preservados. | Organização proprietária | `200`; `409` encerrada ou vagas menores que inscrições existentes. |
| `DELETE /opportunities/:id` | Excluir oportunidade sem vínculos. | Organização proprietária | `204`; `409` se tiver inscrições/certificados; `404` ausente. |
| `POST /opportunities/:id/registrations` | Inscrever o voluntário autenticado, sem corpo. | Voluntário | `201` com opportunityId/registered/enrolled; `409` lotada, duplicada ou encerrada. |
| `DELETE /opportunities/:id/registrations` | Cancelar a própria inscrição. | Voluntário | `200`, registered=false; `404` sem vínculo; `409` encerrada. |
| `GET /organizations/activities` | Listar atividades e participantes da organização autenticada. | Organização | `200` com array, inclusive vazio. |
| `PATCH /organizations/activities/:id/participants/:participantId` | Alterar presença; participantId é UUID da inscrição. JSON `{ "status": "Presente" }`. | Organização proprietária | `200` com participant; `404` se vínculo não pertence à atividade; `409` encerrada. |
| `POST /organizations/activities/:id/certificates` | Emitir certificados para presentes, sem corpo. | Organização proprietária | `201` com activityId, sentCount e certificatesDispatched=true; `409` sem presentes ou já emitida. |
| `GET /submissions` | Consultar envios da própria conta, sem bytes do documento. | JWT | `200` com `{items: [...]}`. |
| `POST /submissions` | Enviar metadados e documento em multipart, campos abaixo. | JWT | `201` com registro; `400` conteúdo inválido; `413` arquivo acima do limite. |
| `GET /submissions/:id` | Consultar registro por UUID. | Proprietário | `200`; `404` para outra conta ou ausência; `400` UUID inválido. |
| `PATCH /submissions/:id` | Corrigir metadados em análise; mesmos campos textuais/horas, todos opcionais, sem arquivo/status/dono. | Proprietário | `200`; `404` para outra conta/ausência; `400` inválido. |
| `DELETE /submissions/:id` | Excluir envio e BLOB juntos. | Proprietário | `204`; `404` para outra conta/ausência. |
| `GET /submissions/:id/document` | Baixar arquivo original por UUID. | Proprietário | `200` binário; `404` para outra conta/ausência. |
| `GET /dashboard` | Resumo da conta: inscrições, atividades e horas homologadas por eixo. | JWT | `200`; envios externos em análise não concedem horas. |

Os caminhos de gestão e oportunidades referenciam a mesma atividade. `sentCount` preserva o
contrato do protótipo e conta certificados registrados; não significa e-mails enviados.

## Cadastro e login

```json
{
  "name": "Pessoa demonstrativa",
  "email": "pessoa@portal.example",
  "password": "PortalDemo2026!",
  "passwordConfirmation": "PortalDemo2026!"
}
```

Nome tem 2–100 caracteres; e-mail válido até 254, normalizado. Senha tem mínimo de 8 caracteres
e máximo de 72 bytes UTF-8; a confirmação precisa coincidir. O Nest rejeita campos extras como
`role`; o cadastro nunca concede organização. O hash bcrypt possui custo 12.

Login recebe somente `email` e `password`. No acesso direto ao Nest:

```json
{
  "data": {
    "accessToken": "<JWT emitido para a sessão>",
    "expiresAt": "2026-11-11T18:00:00.000Z",
    "user": { "id": "<UUID>", "name": "Pessoa demonstrativa", "email": "pessoa@portal.example", "role": "volunteer" }
  }
}
```

No Next, o retorno é `{ "user": ... }` e o token fica no Set-Cookie HttpOnly. Nunca versionar
um token real. Para um cliente HTTP direto, envie o token em Authorization nas próximas chamadas.

## Oportunidades

`GET /opportunities` aceita `search` (até 100 caracteres, busca título/organização), `category`
(Ensino/Pesquisa/Extensão), `format` (Presencial/Híbrido/Online) e `sort` (`title` ou `hours`, crescente).
Sem sort, ordena por título. Filtros não alteram o proprietário das inscrições retornadas.
Exemplo: `/api/opportunities?category=Ensino&search=Monitoria&sort=hours`.
O cliente também filtra título, organização e local sobre o catálogo validado.

Criação:

```json
{
  "id": "oficina-comunitaria",
  "title": "Oficina comunitária",
  "description": "Oficina de educação ambiental na comunidade.",
  "category": "Extensão",
  "format": "Presencial",
  "location": "Santa Helena",
  "dateLabel": "15 de janeiro de 2027",
  "durationLabel": "Das 8h às 12h",
  "hours": 4,
  "vacancies": 20,
  "featured": false,
  "sessions": [{ "date": "2027-01-15", "startsAt": "08:00", "endsAt": "12:00" }]
}
```

O slug usa letras minúsculas/números e hífens, até 100 caracteres. Título: 5–150; descrição:
10–5000; local/rótulos: 2–200; horas: inteiro 1–200; vagas: inteiro 1–10000; featured é opcional.
Deve haver 1–100 encontros, sem repetição de data/início; datas devem ser válidas e término
posterior ao início. Datas e horários representam o calendário local, sem deslocamento UTC.
O servidor determina a organização pela conta autenticada. Atualização não permite mudar o ID.

Presença aceita somente `Inscrito`, `Presente` ou `Ausente`. Emissão é transacional e única;
após emitir, alterar presença, oportunidade, inscrição ou cancelar participação é recusado.

## Submissões e arquivos

O multipart de criação possui `title` (5–150), `category`, `hours` (inteiro 1–200), `description`
(10–5000) e `document` (um arquivo). PDF, JPG e PNG são aceitos, com MIME e assinatura compatíveis,
tamanho maior que zero e até 5 MB. O Next limita o corpo total a 5 MB + 64 KB e leitura a cinco segundos.

```bash
curl -X POST http://127.0.0.1:3001/api/submissions \
  -H "Authorization: Bearer $PORTAL_TOKEN" \
  -F "title=Comprovante externo" \
  -F "category=Ensino" \
  -F "hours=4" \
  -F "description=Atividade realizada fora do portal." \
  -F "document=@comprovante.pdf;type=application/pdf"
```

`PORTAL_TOKEN` representa um token obtido no login pelo próprio usuário. Arquivos e metadados
são vinculados à conta autenticada; não há campo userId confiável no cliente. O arquivo original
é preservado no SQLite. Atualizações só corrigem os metadados; o status permanece `Em análise`.
Não há endpoint para autoaprovar horas nem para mudar o proprietário.
