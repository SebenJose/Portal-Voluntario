# Feature-Based Architecture

Cada domínio da aplicação deve ficar dentro de `src/features/<feature>`.

Uma feature pode conter:

- `components/`: componentes específicos do domínio;
- `hooks/`: hooks específicos do domínio;
- `services/`: chamadas a APIs e integrações;
- `types/`: tipos e contratos;
- `lib/`: regras e utilitários internos;
- `index.ts`: API pública da feature.

Componentes realmente compartilhados ficam em `src/components`. Os componentes gerados pelo
shadcn/ui ficam em `src/components/ui` e podem ser importados por qualquer feature.
