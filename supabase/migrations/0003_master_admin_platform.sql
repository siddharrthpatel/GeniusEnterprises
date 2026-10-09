-- Incremental: add master_admin / sub_broker + platform control tables
-- Use this if 0001/0002 already ran. For a brand-new project use supabase/IMPORT_ME.sql instead.

create schema if not exists internal;
revoke all on schema internal from public, anon, authenticated;
grant usage on schema internal to postgres, service_role;

alter type public.user_role add value if not exists 'master_admin';
alter type public.user_role add value if not exists 'sub_broker';

create table if not exists public.dashboard_modules (
  id text primary key,
  label text not null,
  role text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'notice' check (kind in ('notice','ad')),
  title text not null,
  body text,
  image_url text,
  link_url text,
  audience text not null default 'all',
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_settings (
  key text primary key,
  value text,
  is_secret boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists internal.platform_secrets (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

create or replace function public.current_app_role()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

create or replace function public.is_master_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.current_app_role() = 'master_admin';
$$;

create or replace function public.is_admin_staff()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.current_app_role() in ('master_admin', 'admin');
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.is_master_admin() from public;
revoke all on function public.is_admin_staff() from public;
grant execute on function public.current_app_role() to authenticated, anon;
grant execute on function public.is_master_admin() to authenticated, anon;
grant execute on function public.is_admin_staff() to authenticated, anon;

alter table public.dashboard_modules enable row level security;
alter table public.notices enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists dashboards_select on public.dashboard_modules;
create policy dashboards_select on public.dashboard_modules
  for select to anon, authenticated using (true);

drop policy if exists dashboards_write on public.dashboard_modules;
create policy dashboards_write on public.dashboard_modules
  for all to authenticated
  using (public.is_admin_staff())
  with check (public.is_admin_staff());

drop policy if exists notices_public_read on public.notices;
create policy notices_public_read on public.notices
  for select to anon, authenticated
  using (is_active = true and starts_at <= now() and (ends_at is null or ends_at >= now()));

drop policy if exists notices_admin_all on public.notices;
drop policy if exists notices_master_all on public.notices;
create policy notices_admin_all on public.notices
  for all to authenticated
  using (public.is_admin_staff())
  with check (public.is_admin_staff());

drop policy if exists settings_select on public.platform_settings;
create policy settings_select on public.platform_settings
  for select to authenticated
  using (public.is_admin_staff());

drop policy if exists settings_write on public.platform_settings;
create policy settings_write on public.platform_settings
  for all to authenticated
  using (public.is_admin_staff())
  with check (public.is_admin_staff());

grant select on public.dashboard_modules, public.notices to anon, authenticated;
grant select, insert, update, delete on public.dashboard_modules, public.notices, public.platform_settings to authenticated;

insert into public.dashboard_modules (id, label, role, is_active) values
  ('master_admin', 'Master Admin', 'master_admin', true),
  ('admin', 'Admin', 'admin', true),
  ('branch_manager', 'Branch Manager', 'branch_manager', true),
  ('rm', 'Relationship Manager', 'rm', true),
  ('arm', 'Assistant RM', 'arm', true),
  ('advisor', 'Advisor', 'advisor', true),
  ('sub_broker', 'Sub Broker', 'sub_broker', true),
  ('employee', 'Employee', 'employee', true),
  ('client', 'Client', 'client', true)
on conflict (id) do nothing;

insert into public.platform_settings (key, value, is_secret) values
  ('supabase_url', 'https://drkxuilxrhjjcixeuftj.supabase.co', false),
  ('supabase_anon_key', 'sb_publishable_udvTla9MSU9HSzF_lJb44A_EWfdZmWe', true),
  ('tejhq_api_key', 'tej_live_4174d96795dde3f1bdb397b1dcb417c3', true),
  ('tejhq_enabled', 'true', false),
  ('ticker_symbols', 'RELIANCE,TCS,HDFCBANK,INFY,ICICIBANK,SBIN,ITC,BHARTIARTL,LT,HINDUNILVR', false)
on conflict (key) do nothing;

insert into internal.platform_secrets (key, value) values
  ('supabase_anon_key', 'sb_publishable_udvTla9MSU9HSzF_lJb44A_EWfdZmWe'),
  ('tejhq_api_key', 'tej_live_4174d96795dde3f1bdb397b1dcb417c3'),
  ('supabase_service_role_key', '')
on conflict (key) do nothing;
