# Demonstração pública

Os dados reais de contas, oportunidades, inscrições, certificados e gestão vêm do Nest/SQLite,
independentemente do MSW. O worker intercepta somente `/api/demo/*`.

Para habilitar as apresentações, defina `NEXT_PUBLIC_API_MOCKING=enabled` antes de iniciar
o desenvolvimento ou gerar o build. Em produção:

```bash
NEXT_PUBLIC_API_MOCKING=enabled pnpm build
NEXT_PUBLIC_API_MOCKING=enabled pnpm start
```

O padrão é desligado, inclusive em desenvolvimento. Requisições sem handler passam para a rede.
O provider mostra erro e permite tentar novamente caso o worker não inicie.

`/demonstracao/gestao` é pública e usa `/api/demo/organizations/activities`. Participantes,
presença e despacho são fictícios, isolados em memória e reiniciados ao recarregar. Essa demo
não altera organizações, contas, horas ou certificados reais.

O painel real permanece em `/painel`. Com o modo habilitado, o botão **Ver dados de demonstração**
abre `/painel?demonstracao=horas`, que usa `/api/demo/dashboard`. O exemplo mostra 74 horas,
três atividades concluídas e duas futuras. **Voltar aos meus dados** retorna à conta real.
As horas apresentadas não são gravadas. Os endpoints de demo aceitam `empty`, `loading`,
`network-error` e `server-error` para revisão de estados da interface.

A autenticação continua real mesmo durante a apresentação: mantenha o Nest em execução e
configure a URL, a origem e a chave conforme o README. As contas demonstrativas atuais são
criadas pelo seed; não existem credenciais embutidas no cliente.
