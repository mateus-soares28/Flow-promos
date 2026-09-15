# FlowPromos — checklist final

## Implementado

| Área | Entrega |
|---|---|
| Dashboard | Gráficos Recharts com cliques, conversões e comissões por marketplace, além de estados vazios quando ainda não existem eventos. |
| Analytics | Tabela `affiliate_events`, registro de cliques nas ofertas e webhook genérico `/api/webhooks/affiliate/:marketplace` para conversões e comissões com deduplicação por evento externo. |
| IA de ofertas | Mutação server-side com `invokeLLM` e modelo `gpt-5-mini`; botão “Gerar texto” no cadastro de oferta; análise opcional do conteúdo público do link; copy em português sem inventar dados. |
| Administração | Navegação oculta para usuários comuns, rotas protegidas por `adminProcedure` e validação adicional do `OWNER_OPEN_ID`; compradores não renderizam a tela administrativa. |
| Vendas | Landing page `/vendas` com hero, benefícios, etapas, planos dinâmicos e CTAs para `/login?next=/planos`; visitantes não autenticados na raiz também recebem a landing. |
| Integrações anteriores | WhatsApp Evolution/Z-API real, Amazon Creators API, Shopee Affiliate GraphQL, Stripe Checkout, Heartbeat, templates e grupos com JID real. |

## Validação

`pnpm check`, `pnpm test` e `pnpm build` foram executados com sucesso. A tabela `affiliate_events` foi criada por migration não destrutiva no banco. A landing e o dashboard foram inspecionados no preview.

## Configuração operacional

O proprietário precisa manter `OWNER_OPEN_ID` configurado para que a proteção do painel administrativo seja exclusiva. Para obter relatórios completos, cada integração deve apontar eventos de conversão para o webhook correspondente, enviando tag de afiliado, identificador externo, valor do pedido e comissão.

## Atualização desta etapa

| Área | Entrega |
|---|---|
| Relatórios | Filtro diário, semanal e mensal aplicado no backend e no gráfico do dashboard. |
| Tema | Botão global de modo claro/escuro, persistido no navegador, disponível no painel, login e landing. |
| Shopee | Endpoint oficial Push Mechanism com validação HMAC-SHA256 usando `callback_url|request_body`, resposta idempotente e associação às integrações cadastradas. |
| Amazon | Verificação documental confirmou que a Creators API oficial exposta é de catálogo e não documenta webhook de conversão; o endpoint genérico de eventos permanece pronto para fontes de relatório autorizadas. |
| Evolution | URL, token, instância e segredo agora são variáveis de servidor (`EVOLUTION_API_URL`, `EVOLUTION_API_TOKEN`, `EVOLUTION_INSTANCE_ID`, `EVOLUTION_WEBHOOK_SECRET`). O formulário foi removido da tela do usuário e a mutação de configuração ficou restrita ao proprietário. |

A tela WhatsApp exibe apenas QR Code, status e ações operacionais. Sem as variáveis Evolution configuradas no ambiente, ela mostra um aviso técnico e não solicita tokens ao afiliado.

## WhatsApp — etapa de observabilidade

- Polling de status da Evolution a cada 5 segundos enquanto a tela está aberta, sem polling em segundo plano.
- Botão de mensagem de teste com número, texto e confirmação explícita de autorização.
- Histórico persistente de QR Code, verificações de status, conexão, desconexão, teste e erros; telefones aparecem apenas com os quatro últimos dígitos.
- Migration `0005_ordinary_gambit.sql` aplicada criando `whatsapp_connection_logs`.
- `pnpm check`, `pnpm test` e `pnpm build` aprovados.

## Login administrativo fixo

O painel `/admin` agora oferece login administrativo separado. As credenciais ficam exclusivamente nos secrets `FLOWPROMOS_ADMIN_USERNAME` e `FLOWPROMOS_ADMIN_PASSWORD`; a aplicação cria um cookie HttpOnly assinado com validade de oito horas, e as rotas admin aceitam somente essa sessão ou o proprietário OAuth. Foi adicionado logout administrativo, tela de login, teste de credenciais, teste HTTP de sessão e validação visual. A suíte completa passou com 4 testes, o TypeScript passou e o build de produção foi concluído.
