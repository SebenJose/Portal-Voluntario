<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Instruções do projeto — Portal Voluntário

Estas instruções se aplicam a todo o repositório. Se houver um `AGENTS.md` mais próximo do
arquivo sendo alterado, as regras mais específicas também devem ser respeitadas.

## Princípios de implementação

- O projeto utiliza `pnpm`. Não usar `npm`, `yarn` ou `bun` para instalar dependências ou executar
  scripts.
- Usar TypeScript com tipagem estrita. Todo código novo deve ser tipado de forma explícita e segura.
- É proibido usar `any`, `as any`, `@ts-ignore`, `@ts-nocheck`, `@ts-expect-error` ou non-null
  assertions (`!`) para silenciar erros de tipagem.
- Evitar type assertions (`as`) como atalho. Preferir inferência, narrowing, type guards e validação
  de dados na borda da aplicação.
- Valores externos — API, query params, formulários, localStorage e mocks — devem ser tratados como
  dados não confiáveis e validados antes de serem usados. Para dados estruturados, preferir schemas
  Zod e `z.infer`.
- Manter separação de responsabilidades (SoC): componentes de UI não devem conter regras de
  negócio, acesso direto à API ou transformação complexa de dados.
- Seguir DRY, KISS e SOLID sem criar abstrações prematuras. Reutilizar apenas quando houver uma
  responsabilidade ou comportamento realmente compartilhado.
- Componentes devem ser pequenos, coesos, acessíveis e preferencialmente compostos a partir dos
  componentes do shadcn/ui já instalados.
- Preservar o padrão Feature-Based: regras específicas de um domínio ficam em
  `src/features/<feature>`. Código compartilhado fica em `src/components`, `src/hooks` ou `src/lib`.
- Manter imports pelo alias `@/*` e evitar caminhos relativos longos.
- Não adicionar dependências sem necessidade. Antes de instalar uma biblioteca, verificar se o
  problema pode ser resolvido com as ferramentas existentes e manter o lockfile atualizado.
- Usar Zustand apenas para estado de cliente compartilhado entre componentes ou features. Estado
  local deve continuar em React; estado de formulário deve permanecer no React Hook Form; dados
  remotos devem ser tratados na camada de serviços.
- Stores Zustand devem ser pequenas, totalmente tipadas e organizadas por domínio, sem um store
  global monolítico ou ações genéricas demais.
- Usar Motion (`motion/react`) para animações de interface, mantendo animações separadas de regras
  de negócio e respeitando `prefers-reduced-motion` quando a animação não for essencial.
- Usar exclusivamente `lucide-react` para ícones da interface. Importar apenas os ícones usados
  diretamente, por exemplo `import { ArrowRight } from "lucide-react"`, para preservar tree-shaking.
- Ícones decorativos devem usar `aria-hidden="true"`. Ícones interativos precisam de nome acessível
  via `aria-label` ou texto visível; não usar ícone como substituto de uma ação sem acessibilidade.
- Não usar emojis, SVGs inline improvisados ou outra biblioteca de ícones sem uma justificativa
  técnica documentada.

## Formulários e validação

- Formulários devem usar React Hook Form em conjunto com Zod e `zodResolver`.
- Cada formulário deve ter um schema Zod próximo à feature responsável por ele, com mensagens de
  erro claras e acessíveis.
- Derivar os tipos do schema com `z.infer<typeof schema>` para evitar duplicação de contratos.
- Não duplicar as mesmas regras de validação em JSX, handlers e serviços. A validação deve acontecer
  no formulário e ser repetida na borda de qualquer integração externa quando necessário.
- Exibir erros associados aos respectivos campos, mantendo `label`, `id`, `aria-invalid` e mensagens
  acessíveis.
- Estados de loading, sucesso, erro e reenvio devem ser tratados explicitamente. Nunca depender
  apenas de feedback visual ou `console.log`.

## Dados, serviços e MSW

- A interface deve ser construída contra contratos tipados, mesmo antes da existência do backend.
- Usar MSW para simular as requisições durante o desenvolvimento e os testes. A UI não deve ser
  implementada com dados estáticos espalhados pelos componentes.
- Organizar mocks por domínio, preferencialmente em `src/mocks` e/ou dentro da feature, mantendo
  handlers, fixtures e tipos fáceis de substituir pela API real.
- Centralizar chamadas externas em serviços ou adaptadores da feature. Componentes não devem chamar
  `fetch` diretamente.
- Os mocks devem representar estados realistas: sucesso, lista vazia, loading, validação, erro de
  rede e erro de servidor.
- Quando o backend estiver disponível, trocar a implementação do adaptador ou a configuração de
  ambiente sem refatorar a UI. Os contratos públicos e estados de tela devem permanecer estáveis.
- Não mascarar erros de integração com fallback silencioso. Erros devem ser tipados, tratados e
  apresentados de forma adequada ao usuário.

## Git e fluxo de trabalho

- Nunca fazer commits diretamente na `main`.
- Toda alteração deve ser feita em uma branch de trabalho criada a partir da `main` atualizada.
- Usar nomes de branch no formato `<tipo>/<descricao-curta>`, por exemplo:
  `feat/cadastro-voluntario`, `fix/validacao-login` ou `chore/configurar-msw`.
- Usar Conventional Commits nas mensagens de commit:
  - `feat`: nova funcionalidade;
  - `fix`: correção de comportamento;
  - `refactor`: mudança interna sem alteração de comportamento;
  - `chore`: configuração, dependências ou manutenção;
  - `docs`: documentação;
  - `test`: testes.
- Formato obrigatório: `<tipo>(<escopo>): <descrição no imperativo>`; exemplo:
  `feat(auth): adicionar formulário de login`.
- Não misturar mudanças não relacionadas no mesmo commit. Commits devem ser pequenos, coesos e
  fáceis de revisar.
- Não reescrever histórico, fazer force push ou remover arquivos sem confirmar o escopo e o impacto.

## Validação antes de entregar

Executar, sempre que aplicável:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Antes de finalizar, revisar o diff, verificar que não existem arquivos sensíveis ou artefatos de
build versionados e confirmar que a alteração segue a estrutura Feature-Based.
