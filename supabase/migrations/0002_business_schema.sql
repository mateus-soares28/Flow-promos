-- FlowPromos: tabelas de negocio em PostgreSQL/Supabase.
-- Execute depois de 0001_profiles_and_auth.sql.

create type public.user_role as enum ('user', 'admin');
create type public.user_status as enum ('pending_payment', 'active', 'suspended');
create type public.billing_interval as enum ('month', 'year');
create type public.subscription_status as enum ('pending', 'active', 'canceled', 'failed');
create type public.whatsapp_status as enum ('disconnected', 'connecting', 'connected');
create type public.whatsapp_provider as enum ('evolution', 'zapi');
create type public.whatsapp_action as enum ('qr_requested', 'status_check', 'connected', 'disconnected', 'test_message', 'error');
create type public.log_status as enum ('success', 'failure');
create type public.marketplace as enum ('amazon', 'shopee', 'magalu', 'mercadolivre', 'aliexpress', 'kabum');
create type public.offer_status as enum ('detected', 'queued', 'published', 'rejected');
create type public.affiliate_event_type as enum ('click', 'conversion');
create type public.channel_type as enum ('whatsapp', 'telegram');
create type public.dispatch_status as enum ('scheduled', 'sending', 'sent', 'failed');
create type public.invoice_status as enum ('paid', 'open', 'void', 'uncollectible');

create table public.users (
  id serial primary key,
  "openId" varchar(64) not null unique,
  "authUserId" uuid unique references auth.users(id) on delete set null,
  name text,
  email varchar(320),
  "loginMethod" varchar(64),
  role public.user_role not null default 'user',
  "passwordHash" varchar(255),
  status public.user_status not null default 'active',
  "stripeCustomerId" varchar(128),
  "currentPlanId" varchar(64),
  "planExpiresAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "lastSignedIn" timestamptz not null default now()
);

create table public.plans (
  id varchar(64) primary key,
  name varchar(120) not null,
  description text,
  "interval" public.billing_interval not null default 'year',
  "priceCents" integer not null,
  "dailyLimitOffers" integer not null default 150,
  "maxWhatsappGroups" integer not null default 5,
  "maxTelegramChannels" integer not null default 5,
  "qualityScoreMax" integer not null default 80,
  "stripePriceId" varchar(128),
  "stripeProductId" varchar(128),
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now()
);

create table public.subscriptions (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  "planId" varchar(64) not null,
  "stripeSessionId" varchar(160) unique,
  "stripeSubscriptionId" varchar(160),
  "stripePaymentIntentId" varchar(160),
  status public.subscription_status not null default 'pending',
  "amountCents" integer not null,
  currency varchar(10) not null default 'BRL',
  "customerEmail" varchar(320) not null,
  "customerName" text,
  "tempPasswordGenerated" varchar(64),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table public.whatsapp_sessions (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  "instanceName" varchar(100) not null,
  status public.whatsapp_status not null default 'disconnected',
  "qrCodeData" text,
  "connectedPhone" varchar(40),
  "batteryLevel" integer default 100,
  "lastPingAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  provider public.whatsapp_provider not null default 'evolution',
  "apiBaseUrl" varchar(255),
  "apiToken" text,
  "externalInstanceId" varchar(120),
  "webhookSecret" varchar(180),
  "updatedAt" timestamptz not null default now()
);

create table public.whatsapp_connection_logs (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  "sessionId" integer,
  action public.whatsapp_action not null,
  status public.log_status not null,
  details text,
  "errorMessage" text,
  "createdAt" timestamptz not null default now()
);

create table public.whatsapp_groups (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  name varchar(160) not null,
  jid varchar(160) not null,
  "segmentId" integer,
  "participantsCount" integer not null default 0,
  "autoPostingEnabled" boolean not null default true,
  "delaySeconds" integer not null default 30,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table public.segments (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  name varchar(120) not null,
  keywords text not null,
  "excludedKeywords" text,
  "minDiscountPercent" integer not null default 10,
  "minQualityScore" integer not null default 50,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table public.affiliate_integrations (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  marketplace public.marketplace not null,
  "affiliateTag" varchar(120) not null,
  "apiKey" text,
  "apiSecret" text,
  "appId" varchar(120),
  "isConnected" boolean not null default true,
  "autoConvertLinks" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table public.offers (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  title text not null,
  "originalUrl" text not null,
  "affiliateUrl" text not null,
  marketplace varchar(60) not null,
  "originalPriceCents" integer not null,
  "discountPriceCents" integer not null,
  "discountPercent" integer not null,
  "couponCode" varchar(80),
  "imageUrl" text,
  "qualityScore" integer not null default 75,
  "isOfficialStore" boolean not null default false,
  "isFreeShipping" boolean not null default false,
  "segmentId" integer,
  status public.offer_status not null default 'detected',
  "publishedAt" timestamptz,
  "createdAt" timestamptz not null default now()
);

create table public.affiliate_events (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  "offerId" integer,
  marketplace varchar(60) not null,
  "eventType" public.affiliate_event_type not null,
  "orderValueCents" integer not null default 0,
  "commissionCents" integer not null default 0,
  source varchar(80),
  "externalEventId" varchar(160),
  "createdAt" timestamptz not null default now()
);
create unique index affiliate_events_external_id_idx on public.affiliate_events ("externalEventId") where "externalEventId" is not null;

create table public.coupons (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  marketplace varchar(60) not null,
  code varchar(80) not null,
  description text,
  "discountLabel" varchar(80),
  "minSpendCents" integer default 0,
  "expiresAt" timestamptz,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now()
);

create table public.dispatches (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  "offerId" integer,
  "groupId" integer,
  "channelType" public.channel_type not null default 'whatsapp',
  "formattedMessage" text not null,
  "scheduledFor" timestamptz not null default now(),
  "sentAt" timestamptz,
  status public.dispatch_status not null default 'scheduled',
  "errorMessage" text,
  "createdAt" timestamptz not null default now()
);

create table public.message_templates (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  title varchar(120) not null,
  content text not null,
  "isDefault" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create table public.invoices (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  "stripeInvoiceId" varchar(160),
  "stripePaymentIntentId" varchar(160),
  "amountCents" integer not null,
  currency varchar(10) not null default 'BRL',
  status public.invoice_status not null default 'paid',
  "planName" varchar(120) not null,
  "pdfUrl" text,
  "paidAt" timestamptz not null default now(),
  "createdAt" timestamptz not null default now()
);

create table public.automation_jobs (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  name varchar(120) not null,
  "scheduleCronTaskUid" varchar(65),
  "cronExpression" varchar(80) not null default '0 */15 * * * *',
  "isEnabled" boolean not null default false,
  "lastRunAt" timestamptz,
  "lastError" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

insert into public.plans (id, name, "interval", "priceCents", "dailyLimitOffers", "maxWhatsappGroups", "maxTelegramChannels", "qualityScoreMax")
values
  ('essential_annual', 'Essencial', 'year', 23880, 50, 1, 1, 60),
  ('pro_annual', 'Pro', 'year', 59880, 150, 5, 5, 80),
  ('expert_annual', 'Expert', 'year', 119880, 9999, 10, 10, 100)
on conflict (id) do nothing;

alter table public.users enable row level security;
create index users_email_idx on public.users (lower(email));
create index subscriptions_user_id_idx on public.subscriptions ("userId");
create index offers_user_id_idx on public.offers ("userId");
create index dispatches_user_id_idx on public.dispatches ("userId");

create or replace function public.current_business_user_id()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where "authUserId" = auth.uid() limit 1;
$$;

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.whatsapp_sessions enable row level security;
alter table public.whatsapp_connection_logs enable row level security;
alter table public.whatsapp_groups enable row level security;
alter table public.segments enable row level security;
alter table public.affiliate_integrations enable row level security;
alter table public.offers enable row level security;
alter table public.affiliate_events enable row level security;
alter table public.coupons enable row level security;
alter table public.dispatches enable row level security;
alter table public.message_templates enable row level security;
alter table public.invoices enable row level security;
alter table public.automation_jobs enable row level security;

create policy users_owner_or_admin on public.users for all to authenticated
using ("authUserId" = auth.uid() or public.is_admin())
with check ("authUserId" = auth.uid() or public.is_admin());

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'subscriptions', 'whatsapp_sessions', 'whatsapp_connection_logs',
    'whatsapp_groups', 'segments', 'affiliate_integrations', 'offers',
    'affiliate_events', 'coupons', 'dispatches', 'message_templates',
    'invoices', 'automation_jobs'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using ("userId" = public.current_business_user_id() or public.is_admin()) with check ("userId" = public.current_business_user_id() or public.is_admin())',
      table_name || '_owner_or_admin', table_name
    );
  end loop;
end $$;
