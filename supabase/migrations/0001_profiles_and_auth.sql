-- FlowPromos: identidade e perfil no Supabase Auth.
-- Execute no SQL Editor do projeto Supabase antes de remover o banco antigo.

create type public.app_role as enum ('user', 'admin');
create type public.app_status as enum ('active', 'suspended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'user',
  status public.app_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_lower_idx on public.profiles (lower(email));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, profiles.full_name);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Cria o perfil do admin caso ele ja exista no Auth antes desta migration.
insert into public.profiles (id, email, full_name, role, status)
select id, lower(email), 'Mateus Soares', 'admin', 'active'
from auth.users
where lower(email) = lower('matheuus_ssoares28@hotmail.com')
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    status = excluded.status;

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

grant select, update on public.profiles to authenticated;
revoke all on public.profiles from anon;
