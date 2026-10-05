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

As [credenciais de demonstração](docs/AUTH.md) permitem acessar o painel.

```bash
pnpm install
pnpm dev
```

O projeto ficará disponível em [http://localhost:3000](http://localhost:3000).

Para validar o projeto:

```bash
pnpm lint
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

Durante o desenvolvimento, o MSW é iniciado automaticamente no navegador e intercepta os handlers
em `src/mocks`. Para desativá-lo localmente, use `NEXT_PUBLIC_API_MOCKING=disabled`.

Os ícones devem ser importados diretamente do `lucide-react`, por exemplo:

```tsx
import { ArrowRight } from "lucide-react";

<ArrowRight aria-hidden="true" />;
```
