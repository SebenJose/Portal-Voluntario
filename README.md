# Portal Voluntário

Frontend do Portal Voluntário, desenvolvido como trabalho da disciplina de Desenvolvimento Web.

## Stack

- Next.js com App Router;
- React e TypeScript;
- Tailwind CSS;
- shadcn/ui;
- React Hook Form + Zod;
- Zustand;
- Motion;
- Lucide React para ícones;
- MSW para mocks de API;
- pnpm.

## Identidade visual

O portal usa preto e amarelo como cores principais, seguindo o
[manual de identidade visual da UTFPR](https://www.utfpr.edu.br/comunicacao/design/manual-de-uso-da-identidade-visual-da-utfpr/).
A marca horizontal em `public/brand/utfpr-logo-horizontal.png` foi obtida na
[página oficial de marcas da UTFPR](https://www.utfpr.edu.br/comunicacao/design/marca-da-utfpr/)
e é exibida sem alterar seus elementos ou proporções. O favicon foi obtido no
[portal institucional](https://www.utfpr.edu.br/favicon.ico). As cores de interface estão
centralizadas em `src/app/globals.css`.

## Desenvolvimento

Gere uma chave local para assinar sessões e salve o valor em `.env.local` na raiz do projeto:

```bash
openssl rand -base64 32
```

```dotenv
SESSION_SECRET=<cole aqui o valor gerado>
```

Use Node.js 22.12 ou superior. Crie uma conta em `/criar-conta` e entre em `/entrar` para acessar o painel e se inscrever nas oportunidades.
As contas e inscrições usam armazenamento local no servidor; veja [contas e acesso](docs/AUTH.md).

```bash
pnpm install
pnpm dev
```

O projeto ficará disponível em [http://localhost:3000](http://localhost:3000).

Para validar o projeto:

```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

O workflow [CI](.github/workflows/ci.yml) executa esses checks automaticamente em toda Pull
Request direcionada à `main` e também em pushes na `main`.

Para impedir o merge quando a validação falhar, configure no GitHub uma regra de proteção para a
branch `main` e marque o check obrigatório `CI / Quality checks` em **Require status checks to pass
before merging**.

## Organização

O código segue o padrão Feature-Based:

```text
src/
├── app/                    # Rotas e configuração do App Router
├── components/             # Componentes compartilhados
│   └── ui/                 # Componentes do shadcn/ui
├── features/               # Domínios independentes da aplicação
│   ├── auth/
│   ├── home/
│   ├── opportunities/
│   ├── organizations/
│   └── volunteers/
├── hooks/                  # Hooks compartilhados
└── lib/                    # Utilitários compartilhados
```

As pastas `hooks/` e `lib/` podem crescer conforme os primeiros fluxos forem implementados.

Novos componentes do shadcn/ui podem ser adicionados com:

```bash
pnpm dlx shadcn@latest add <componente>
```

O alias geral `@/*` aponta para `src/*`, permitindo imports como `@/features/home` e
`@/components/ui/button`.

O MSW é iniciado automaticamente no navegador durante o desenvolvimento. Em builds de produção,
a demonstração exige `NEXT_PUBLIC_API_MOCKING=enabled` antes do build; sem isso, os recursos ainda
sem backend informam indisponibilidade. `NEXT_PUBLIC_API_MOCKING=disabled` desativa os mocks
também no desenvolvimento. Consulte [a configuração da demonstração](docs/DEMO.md).

Em produção, configure `PORTAL_ORIGIN` com a origem HTTPS externa do portal, sem caminho
(por exemplo, `https://portal.example.org`), além de `SESSION_SECRET`. Essa origem é usada
para verificar operações de escrita e definir cookies seguros, inclusive atrás de proxy.
O armazenamento local suporta uma única instância Node.js; não é um backend distribuído.

O envio de certificados é uma simulação de frontend: os registros e arquivos ficam no armazenamento
local do navegador, separados por conta, e podem ser consultados e baixados na página privada
`/certificados`. A análise das horas é simulada. Veja [os contratos e limites do mock](src/mocks/README.md).

Os ícones devem ser importados diretamente do `lucide-react`, por exemplo:

```tsx
import { ArrowRight } from "lucide-react";

<ArrowRight aria-hidden="true" />;
```
