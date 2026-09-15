# Supabase, GitHub, Vercel e Stripe

## Estado atual

- A aplicacao usa `drizzle-orm/mysql2` e o schema em `drizzle/schema.ts` usa `mysqlTable`/`mysqlEnum`.
- A autenticacao atual mistura Manus OAuth, JWT proprio e login por credenciais.
- Portanto, trocar apenas `DATABASE_URL` por uma URL do Supabase nao conclui a migracao: o driver, o dialeto, o schema e a sessao precisam mudar juntos.
- O endpoint `POST /api/webhooks/stripe` ja valida `stripe-signature` e ativa o acesso de forma idempotente por `stripeSessionId`.

## Ordem de migracao recomendada

1. Criar o projeto Supabase e manter o banco atual intacto durante a transicao.
2. Migrar o schema para Postgres, trocando `mysqlTable`/`mysqlEnum` por `pgTable`/`pgEnum` e o driver para `drizzle-orm/node-postgres` ou `postgres-js`.
3. Criar uma tabela de perfil vinculada a `auth.users.id` (UUID). Todas as tabelas de negocio devem usar esse UUID como chave de proprietario; nao usar o `id` inteiro atual como identidade final.
4. Habilitar RLS no Supabase e criar politicas de proprietario para ofertas, grupos, segmentos, integracoes, eventos, dispatches, faturas e automacoes.
5. Migrar usuarios e dados com um script explicito, validando contagens e relacionamentos antes de remover o banco antigo.
6. Trocar o cliente para Supabase Auth e o servidor para validar o access token com o Supabase. Remover o Manus OAuth e os JWTs proprios somente depois que todos os clientes estiverem migrados.
7. Fazer um deploy de homologacao no Vercel, executar smoke tests e somente entao apagar o banco antigo e os secrets correspondentes.

## Secrets no Vercel

Configure os valores apenas em Vercel Project Settings > Environment Variables. Nunca coloque valores reais no GitHub, no frontend ou em `VITE_*` quando forem secretos.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (somente servidor; nunca exponha ao cliente)
- `DATABASE_URL` (pooler do Supabase, durante a migracao)
- `JWT_SECRET` (somente enquanto a sessao propria existir)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APP_ORIGIN`
- `FLOWPROMOS_ADMIN_USERNAME`
- `FLOWPROMOS_ADMIN_PASSWORD`
- credenciais privadas da Evolution/marketplaces

No Stripe, cadastre `https://SEU-DOMINIO/api/webhooks/stripe` para o evento `checkout.session.completed` e copie o signing secret para `STRIPE_WEBHOOK_SECRET`.

## GitHub

- Crie um repositorio privado e confirme que `.env*`, chaves e dumps do banco estao ignorados.
- Adicione o repositorio ao Vercel e use `pnpm install --frozen-lockfile` no build.
- Configure as variaveis separadamente para Preview e Production.
- Depois de conectar o repositorio, abra um Pull Request para cada alteracao de schema ou autenticacao; nao aplique migrations destrutivas diretamente em Production.

## Pendencias que exigem acesso externo

A conexao real nao pode ser finalizada neste workspace sem a URL/chaves do projeto Supabase, acesso ao repositorio GitHub/Vercel e as chaves Stripe. Esses valores devem ser inseridos diretamente nos paineis de secrets, nao enviados em chat.
