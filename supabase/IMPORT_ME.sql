-- =============================================================================
-- Genius Enterprises — paste this entire file in Supabase SQL Editor (new project)
-- Dashboard → SQL → New query → Run
-- After it succeeds, demo logins work against Auth + public.profiles
--
-- Demo passwords (all): role-specific as listed below
--   admin@genius.com      / Admin@123
--   bm@genius.com         / Bm@123       (branch_manager)
--   rm1@genius.com        / Rm@123
--   arm@genius.com        / Arm@123
--   advisor@genius.com    / Adv@123
--   broker@genius.com     / Broker@123   (sub_broker)
--   employee@genius.com   / Emp@123
--   client1@genius.com    / Client@123
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

create schema if not exists internal;
revoke all on schema internal from public;
revoke all on schema internal from anon, authenticated;
grant usage on schema internal to postgres, service_role;

do $$ begin
  create type public.user_role as enum (
    'admin',
    'branch_manager',
    'rm',
    'arm',
    'advisor',
    'sub_broker',
    'employee',
    'client'
  );
exception when duplicate_object then null;
end $$;

alter type public.user_role add value if not exists 'master_admin';

-- ---------------------------------------------------------------------------
-- Migration safety: Drop legacy camelCase tables (from 0001) if they exist
-- so that table definitions with standard snake_case (user_id, client_id, etc.)
-- can be created cleanly.
-- ---------------------------------------------------------------------------
do $$ begin
  if exists (
    select 1 from information_schema.tables where table_schema = 'public' and table_name = 'clients'
  ) and not exists (
    select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'user_id'
  ) then
    raise notice 'Detected legacy camelCase tables. Dropping to apply updated schema...';
    drop table if exists public.salary_slips cascade;
    drop table if exists public.attendance cascade;
    drop table if exists public.support_tickets cascade;
    drop table if exists public.commissions cascade;
    drop table if exists public.meetings_tasks cascade;
    drop table if exists public.kyc_documents cascade;
    drop table if exists public.mutual_funds cascade;
    drop table if exists public.insurance_renewals cascade;
    drop table if exists public.insurance_policies cascade;
    drop table if exists public.loan_emis cascade;
    drop table if exists public.loans cascade;
    drop table if exists public.transactions cascade;
    drop table if exists public.accounts cascade;
    drop table if exists public.clients cascade;
    drop table if exists public.users cascade;
  end if;

  if exists (
    select 1 from information_schema.tables where table_schema = 'public' and table_name = 'branches'
  ) and not exists (
    select 1 from information_schema.columns where table_schema = 'public' and table_name = 'branches' and column_name = 'created_at'
  ) then
    drop table if exists public.branches cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Core org
-- ---------------------------------------------------------------------------
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  address text,
  zone text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'client',
  name text not null,
  email text unique not null,
  username text unique,
  phone text,
  branch_id uuid references public.branches(id) on delete set null,
  reports_to uuid references public.profiles(id) on delete set null,
  rm_id uuid references public.profiles(id) on delete set null,
  arm_id uuid references public.profiles(id) on delete set null,
  advisor_id uuid references public.profiles(id) on delete set null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_reports_to on public.profiles (reports_to);
create index if not exists idx_profiles_branch_id on public.profiles (branch_id);
create index if not exists idx_profiles_rm_id on public.profiles (rm_id);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  customer_id text unique not null,
  dob date,
  pan text,
  aadhaar_masked text,
  nominee_name text,
  nominee_relation text,
  risk_profile text not null default 'Moderate',
  created_at timestamptz not null default now()
);

create index if not exists idx_clients_user_id on public.clients (user_id);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null check (type in ('savings','current','fd','rd','ppf')),
  number text unique not null,
  ifsc text,
  balance numeric not null default 0,
  open_date date,
  maturity_date date,
  interest_rate numeric,
  status text not null default 'active'
);
create index if not exists idx_accounts_client_id on public.accounts (client_id);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  tx_date date not null,
  amount numeric not null,
  direction text not null check (direction in ('CR','DR')),
  narration text,
  category text,
  reference text
);
create index if not exists idx_transactions_account_id on public.transactions (account_id);
create index if not exists idx_transactions_tx_date on public.transactions (tx_date);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  rm_id uuid references public.profiles(id) on delete set null,
  product text,
  principal_amount numeric,
  disbursed_amount numeric,
  rate numeric,
  tenor_months int,
  emi numeric,
  outstanding numeric,
  apply_date date,
  disburse_date date,
  status text not null default 'application'
);
create index if not exists idx_loans_client_id on public.loans (client_id);
create index if not exists idx_loans_rm_id on public.loans (rm_id);

create table if not exists public.loan_emis (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  due_date date not null,
  principal numeric,
  interest numeric,
  total numeric,
  status text not null default 'Scheduled' check (status in ('Paid','Upcoming','Scheduled')),
  paid_date date
);
create index if not exists idx_loan_emis_loan_id on public.loan_emis (loan_id);

create table if not exists public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  advisor_id uuid references public.profiles(id) on delete set null,
  product text,
  policy_no text unique not null,
  premium numeric,
  frequency text not null default 'monthly' check (frequency in ('monthly','quarterly','half-yearly','yearly')),
  sum_assured numeric,
  next_due date,
  status text not null default 'proposal'
);
create index if not exists idx_insurance_client_id on public.insurance_policies (client_id);
create index if not exists idx_insurance_advisor_id on public.insurance_policies (advisor_id);

create table if not exists public.insurance_renewals (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.insurance_policies(id) on delete cascade,
  due_date date not null,
  amount numeric,
  status text not null default 'pending'
);
create index if not exists idx_insurance_renewals_policy_id on public.insurance_renewals (policy_id);

create table if not exists public.mutual_funds (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  advisor_id uuid references public.profiles(id) on delete set null,
  scheme text,
  folio text,
  units numeric,
  avg_nav numeric,
  current_value numeric,
  xirr numeric,
  sip_amount numeric not null default 0,
  sip_day int,
  status text not null default 'active'
);
create index if not exists idx_mf_client_id on public.mutual_funds (client_id);
create index if not exists idx_mf_advisor_id on public.mutual_funds (advisor_id);

create table if not exists public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  doc_type text not null,
  status text not null default 'Uploaded',
  uploaded_at timestamptz not null default now(),
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  document_url text,
  notes text
);
create index if not exists idx_kyc_user_id on public.kyc_documents (user_id);
create index if not exists idx_kyc_client_id on public.kyc_documents (client_id);

create table if not exists public.meetings_tasks (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  assigned_to uuid not null references public.profiles(id) on delete cascade,
  related_client_id uuid references public.clients(id) on delete set null,
  type text not null check (type in ('meeting','task','followup')),
  title text not null,
  scheduled_at timestamptz,
  status text not null default 'pending',
  priority text not null default 'medium',
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_meetings_assigned_to on public.meetings_tasks (assigned_to);
create index if not exists idx_meetings_related_client on public.meetings_tasks (related_client_id);

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  earner_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  product_type text,
  source_table text,
  source_id uuid,
  amount numeric not null,
  period text not null,
  status text not null default 'pending',
  payout_date date,
  created_at timestamptz not null default now()
);
create index if not exists idx_commissions_earner_id on public.commissions (earner_id);
create index if not exists idx_commissions_period on public.commissions (period);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  subject text not null,
  status text not null default 'Open',
  assigned_to uuid references public.profiles(id) on delete set null,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_support_client_id on public.support_tickets (client_id);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  in_time time,
  out_time time,
  status text not null default 'Present',
  unique (user_id, work_date)
);

create table if not exists public.salary_slips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month text not null,
  payslip_no text unique not null,
  basic numeric,
  hra numeric,
  incentive numeric,
  pf numeric,
  pt numeric,
  net numeric,
  status text not null default 'generated'
);
create index if not exists idx_salary_user_id on public.salary_slips (user_id);

-- ---------------------------------------------------------------------------
-- Platform control (admin)
-- ---------------------------------------------------------------------------
create table if not exists public.dashboard_modules (
  id text primary key,
  label text not null,
  role public.user_role not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
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
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_notices_active on public.notices (is_active, starts_at);

create table if not exists public.platform_settings (
  key text primary key,
  value text,
  is_secret boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

-- Secrets never exposed via Data API
create table if not exists internal.platform_secrets (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers (invoker; role comes from JWT app_metadata, never user_metadata)
-- ---------------------------------------------------------------------------
create or replace function public.current_app_role()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.current_app_role() in (
    'admin','branch_manager','rm','arm','advisor','sub_broker','employee'
  );
$$;

create or replace function public.is_admin_staff()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.current_app_role() = 'admin';
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.is_staff() from public;
revoke all on function public.is_admin_staff() from public;
grant execute on function public.current_app_role() to authenticated, anon;
grant execute on function public.is_staff() to authenticated, anon;
grant execute on function public.is_admin_staff() to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Views (security_invoker so RLS of underlying tables applies)
-- ---------------------------------------------------------------------------
create or replace view public.v_user_hierarchy
with (security_invoker = true) as
with recursive hierarchy as (
  select
    p.id, p.name, p.role, p.branch_id, p.reports_to,
    b.name as branch_name,
    1 as level,
    cast(p.name as text) as role_chain
  from public.profiles p
  left join public.branches b on b.id = p.branch_id
  where p.reports_to is null
  union all
  select
    p.id, p.name, p.role, p.branch_id, p.reports_to,
    b.name,
    h.level + 1,
    cast(h.role_chain || ' -> ' || p.name as text)
  from public.profiles p
  join hierarchy h on h.id = p.reports_to
  left join public.branches b on b.id = p.branch_id
)
select * from hierarchy;

create or replace view public.v_client_portfolio_summary
with (security_invoker = true) as
select
  c.id as client_id,
  c.user_id,
  c.customer_id,
  coalesce(sum(a.balance), 0) as total_accounts_balance,
  coalesce((select sum(l.outstanding) from public.loans l where l.client_id = c.id), 0) as total_loan_outstanding,
  coalesce((select sum(mf.current_value) from public.mutual_funds mf where mf.client_id = c.id), 0) as total_mutual_fund_value,
  coalesce((select sum(ip.sum_assured) from public.insurance_policies ip where ip.client_id = c.id), 0) as total_insurance_sum_assured
from public.clients c
left join public.accounts a on a.client_id = c.id
group by c.id, c.user_id, c.customer_id;

create or replace view public.v_commission_earnings_monthly
with (security_invoker = true) as
select
  earner_id,
  period,
  coalesce(sum(case when product_type = 'loan' then amount else 0 end), 0) as loan_commission,
  coalesce(sum(case when product_type = 'insurance' then amount else 0 end), 0) as insurance_commission,
  coalesce(sum(case when product_type = 'mutual_fund' then amount else 0 end), 0) as mutual_fund_commission,
  coalesce(sum(amount), 0) as total_commission,
  count(*) as transaction_count
from public.commissions
group by earner_id, period;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.loans enable row level security;
alter table public.loan_emis enable row level security;
alter table public.insurance_policies enable row level security;
alter table public.insurance_renewals enable row level security;
alter table public.mutual_funds enable row level security;
alter table public.kyc_documents enable row level security;
alter table public.meetings_tasks enable row level security;
alter table public.commissions enable row level security;
alter table public.support_tickets enable row level security;
alter table public.attendance enable row level security;
alter table public.salary_slips enable row level security;
alter table public.dashboard_modules enable row level security;
alter table public.notices enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists branches_select on public.branches;
create policy branches_select on public.branches
  for select to authenticated using (true);

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or public.current_app_role() in ('admin','branch_manager','rm','arm')
  );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select p.role from public.profiles p where p.id = (select auth.uid())));

drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_staff()
  );

drop policy if exists accounts_select on public.accounts;
create policy accounts_select on public.accounts
  for select to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = accounts.client_id
        and (c.user_id = (select auth.uid()) or public.is_staff())
    )
  );

drop policy if exists transactions_select on public.transactions;
create policy transactions_select on public.transactions
  for select to authenticated
  using (
    exists (
      select 1 from public.accounts a
      join public.clients c on c.id = a.client_id
      where a.id = transactions.account_id
        and (c.user_id = (select auth.uid()) or public.is_staff())
    )
  );

drop policy if exists loans_select on public.loans;
create policy loans_select on public.loans
  for select to authenticated
  using (
    exists (select 1 from public.clients c where c.id = loans.client_id and (c.user_id = (select auth.uid()) or public.is_staff()))
  );

drop policy if exists loan_emis_select on public.loan_emis;
create policy loan_emis_select on public.loan_emis
  for select to authenticated
  using (
    exists (
      select 1 from public.loans l
      join public.clients c on c.id = l.client_id
      where l.id = loan_emis.loan_id
        and (c.user_id = (select auth.uid()) or public.is_staff())
    )
  );

drop policy if exists insurance_select on public.insurance_policies;
create policy insurance_select on public.insurance_policies
  for select to authenticated
  using (
    exists (select 1 from public.clients c where c.id = insurance_policies.client_id and (c.user_id = (select auth.uid()) or public.is_staff()))
  );

drop policy if exists insurance_renewals_select on public.insurance_renewals;
create policy insurance_renewals_select on public.insurance_renewals
  for select to authenticated
  using (
    exists (
      select 1 from public.insurance_policies ip
      join public.clients c on c.id = ip.client_id
      where ip.id = insurance_renewals.policy_id
        and (c.user_id = (select auth.uid()) or public.is_staff())
    )
  );

drop policy if exists mf_select on public.mutual_funds;
create policy mf_select on public.mutual_funds
  for select to authenticated
  using (
    exists (select 1 from public.clients c where c.id = mutual_funds.client_id and (c.user_id = (select auth.uid()) or public.is_staff()))
  );

drop policy if exists kyc_select on public.kyc_documents;
create policy kyc_select on public.kyc_documents
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

drop policy if exists meetings_select on public.meetings_tasks;
create policy meetings_select on public.meetings_tasks
  for select to authenticated
  using (
    created_by = (select auth.uid())
    or assigned_to = (select auth.uid())
    or public.current_app_role() in ('admin','branch_manager')
  );

drop policy if exists commissions_select on public.commissions;
create policy commissions_select on public.commissions
  for select to authenticated
  using (
    earner_id = (select auth.uid())
    or public.current_app_role() in ('admin','branch_manager')
  );

drop policy if exists tickets_select on public.support_tickets;
create policy tickets_select on public.support_tickets
  for select to authenticated
  using (
    exists (select 1 from public.clients c where c.id = support_tickets.client_id and c.user_id = (select auth.uid()))
    or public.is_staff()
  );

drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance
  for select to authenticated
  using (user_id = (select auth.uid()) or public.current_app_role() in ('admin','branch_manager'));

drop policy if exists salary_select on public.salary_slips;
create policy salary_select on public.salary_slips
  for select to authenticated
  using (user_id = (select auth.uid()) or public.current_app_role() in ('admin'));

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
  using (
    is_active = true
    and starts_at <= now()
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists notices_admin_all on public.notices;
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

grant usage on schema public to anon, authenticated;
grant select on public.dashboard_modules, public.notices to anon, authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on public.dashboard_modules, public.notices, public.platform_settings to authenticated;

-- ---------------------------------------------------------------------------
-- Seed modules / notices / settings
-- ---------------------------------------------------------------------------
insert into public.dashboard_modules (id, label, role, is_active) values
  ('admin', 'Admin', 'admin', true),
  ('branch_manager', 'Branch Manager', 'branch_manager', true),
  ('rm', 'Relationship Manager', 'rm', true),
  ('arm', 'Assistant RM', 'arm', true),
  ('advisor', 'Advisor', 'advisor', true),
  ('sub_broker', 'Sub Broker', 'sub_broker', true),
  ('employee', 'Employee', 'employee', true),
  ('client', 'Client', 'client', true)
on conflict (id) do nothing;

insert into public.notices (kind, title, body, audience, is_active) values
  ('notice', 'Welcome to Genius Enterprises Portal', 'Role-based dashboards are live. Contact your RM for onboarding support.', 'all', true),
  ('ad', 'SIP Top-up Month', 'Increase your SIP by 10% this month and stay on track for long-term goals.', 'client', true)
on conflict do nothing;

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

-- ---------------------------------------------------------------------------
-- Demo auth users + profiles
-- ---------------------------------------------------------------------------
create or replace function internal.upsert_demo_user(
  p_email text,
  p_password text,
  p_role public.user_role,
  p_name text,
  p_username text
) returns uuid
language plpgsql
security definer
set search_path = auth, public, extensions
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where email = p_email;
  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_id,
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers', jsonb_build_array('email'), 'role', p_role::text),
      jsonb_build_object('name', p_name, 'username', p_username),
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      v_id,
      jsonb_build_object('sub', v_id::text, 'email', p_email),
      'email',
      p_email,
      now(), now(), now()
    );
  else
    update auth.users
      set encrypted_password = crypt(p_password, gen_salt('bf')),
          raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
            || jsonb_build_object('role', p_role::text),
          email_confirmed_at = coalesce(email_confirmed_at, now())
      where id = v_id;
  end if;

  insert into public.profiles (id, role, name, email, username, status)
  values (v_id, p_role, p_name, p_email, p_username, 'active')
  on conflict (id) do update
    set role = excluded.role, name = excluded.name, username = excluded.username, status = 'active';

  return v_id;
end;
$$;

revoke all on function internal.upsert_demo_user(text, text, public.user_role, text, text) from public, anon, authenticated;

do $$
declare
  v_admin uuid;
  v_bm uuid;
  v_rm uuid;
  v_arm uuid;
  v_adv uuid;
  v_broker uuid;
  v_emp uuid;
  v_client uuid;
  v_branch uuid;
  v_client_row uuid;
begin
  insert into public.branches (code, name, zone, status)
  values ('GE-VNS-01', 'Varanasi Main', 'East', 'active')
  on conflict (code) do update set name = excluded.name
  returning id into v_branch;
  if v_branch is null then
    select id into v_branch from public.branches where code = 'GE-VNS-01';
  end if;

  v_admin  := internal.upsert_demo_user('admin@genius.com','Admin@123','admin','Siddharth Patel','admin');
  v_bm     := internal.upsert_demo_user('bm@genius.com','Bm@123','branch_manager','Neha Kapoor','branch');
  v_rm     := internal.upsert_demo_user('rm1@genius.com','Rm@123','rm','Rahul Verma','rm');
  v_arm    := internal.upsert_demo_user('arm@genius.com','Arm@123','arm','Priya Sharma','arm');
  v_adv    := internal.upsert_demo_user('advisor@genius.com','Adv@123','advisor','Anita Gupta','advisor');
  v_broker := internal.upsert_demo_user('broker@genius.com','Broker@123','sub_broker','Karan Malhotra','broker');
  v_emp    := internal.upsert_demo_user('employee@genius.com','Emp@123','employee','Vikram Singh','employee');
  v_client := internal.upsert_demo_user('client1@genius.com','Client@123','client','Rajesh Kumar','client');

  update public.profiles set branch_id = v_branch, reports_to = v_admin where id = v_bm;
  update public.profiles set branch_id = v_branch, reports_to = v_bm where id = v_rm;
  update public.profiles set branch_id = v_branch, reports_to = v_rm, rm_id = v_rm where id = v_arm;
  update public.profiles set branch_id = v_branch, reports_to = v_rm, rm_id = v_rm where id = v_adv;
  update public.profiles set branch_id = v_branch, reports_to = v_adv, advisor_id = v_adv where id = v_broker;
  update public.profiles set branch_id = v_branch, reports_to = v_rm, rm_id = v_rm where id = v_emp;
  update public.profiles set branch_id = v_branch, rm_id = v_rm, advisor_id = v_adv where id = v_client;

  -- Create client profile with zero balances (no dummy demo balances)
  insert into public.clients (user_id, customer_id, pan, risk_profile)
  values (v_client, 'GE-C-1001', 'ABCDE1234F', 'Moderate')
  on conflict (user_id) do nothing;
end $$;

-- =============================================================================
-- LOGIN SPLIT: CLIENT | EMPLOYEE toggle
-- Additive-only: run on already-provisioned databases safely (if not exists,
-- on conflict do nothing, create or replace view).
-- =============================================================================

alter table public.dashboard_modules
  add column if not exists is_login_visible boolean not null default true;

alter table public.profiles
  add column if not exists login_type text,
  add column if not exists designation text,
  add column if not exists joining_date date;

alter table public.branches
  add column if not exists city text;

update public.profiles
   set login_type = case
       when role = 'client'::public.user_role then 'client'
       else 'employee'
     end
 where login_type is null;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_login_type_check'
  ) then
    alter table public.profiles
      add constraint profiles_login_type_check
      check (login_type in ('client','employee'));
  end if;
end $$;

create table if not exists public.login_flow_presets (
  flow_id text primary key,
  display_name text not null,
  description text,
  roles public.user_role[] not null default '{}',
  hero_gradient text,
  accent_color text,
  is_default boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.login_flow_presets enable row level security;

drop policy if exists login_flow_select on public.login_flow_presets;
create policy login_flow_select on public.login_flow_presets
  for select using (true);

drop policy if exists login_flow_write on public.login_flow_presets;
create policy login_flow_write on public.login_flow_presets
  for all using (public.is_admin_staff()) with check (public.is_admin_staff());

grant select on public.login_flow_presets to anon, authenticated;
grant insert, update, delete on public.login_flow_presets to authenticated;

insert into public.login_flow_presets (flow_id, display_name, description, roles, hero_gradient, accent_color, is_default)
values
  ('client', 'Client Portal', 'Public investor login — clients only.',
   ARRAY['client']::public.user_role[],
   'linear-gradient(135deg, #0b1c3b 0%, #1a3c6d 100%)',
   '#d12020',
   true),
  ('employee', 'Staff & Employee Portal', 'Genius Enterprises internal staff log in here.',
   ARRAY['employee','admin','sub_broker','branch_manager','rm','arm','advisor']::public.user_role[],
   'linear-gradient(135deg, #0b1c3b 0%, #1a3c6d 100%)',
   '#d12020',
   false)
on conflict (flow_id) do nothing;

create or replace view public.staff_directory_view
with (security_invoker = true)
as
select p.id,
       p.name,
       p.email,
       p.role,
       p.login_type,
       p.branch_id,
       p.reports_to,
       p.status,
       p.phone,
       coalesce(p.designation, p.role::text) as designation,
       p.joining_date,
       b.name as branch_name,
       coalesce(b.city, b.zone, '') as city,
       h.level as hierarchy_level,
       h.role_chain
  from public.profiles p
  left join public.branches b on b.id = p.branch_id
  left join public.v_user_hierarchy h on h.id = p.id
 where p.role <> 'client'::public.user_role;

grant select on public.staff_directory_view to authenticated;

create or replace function public.login_flow_allowed_roles(p_flow_id text)
returns setof public.user_role
language sql stable
as $$
  select unnest(roles) from public.login_flow_presets where flow_id = p_flow_id;
$$;

revoke all on function public.login_flow_allowed_roles(text) from public;
grant execute on function public.login_flow_allowed_roles(text) to anon, authenticated;

insert into public.platform_settings (key, value, is_secret)
values
  ('login_default_tab', 'client', false)
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
alter table if exists public.profiles enable row level security;
alter table if exists public.clients enable row level security;
alter table if exists public.accounts enable row level security;
alter table if exists public.transactions enable row level security;
alter table if exists public.branches enable row level security;
alter table if exists public.support_tickets enable row level security;
alter table if exists public.kyc_documents enable row level security;
alter table if exists public.commissions enable row level security;
alter table if exists public.salary_slips enable row level security;
alter table if exists public.attendance enable row level security;
alter table if exists public.meetings_tasks enable row level security;
alter table if exists public.mutual_funds enable row level security;
alter table if exists public.insurance_policies enable row level security;
alter table if exists public.insurance_renewals enable row level security;
alter table if exists public.loans enable row level security;
alter table if exists public.loan_emis enable row level security;

-- service_role full bypass
create policy if not exists "service_role has full access to profiles" on public.profiles for all to service_role using (true) with check (true);
create policy if not exists "service_role has full access to clients" on public.clients for all to service_role using (true) with check (true);
create policy if not exists "service_role has full access to accounts" on public.accounts for all to service_role using (true) with check (true);
create policy if not exists "service_role has full access to transactions" on public.transactions for all to service_role using (true) with check (true);
create policy if not exists "service_role has full access to support_tickets" on public.support_tickets for all to service_role using (true) with check (true);

-- User self-access & staff access
create policy if not exists "users read own profile or staff read all" on public.profiles for select to authenticated using (id = auth.uid() or role <> 'client'::public.user_role);
create policy if not exists "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy if not exists "clients read own client record" on public.clients for select to authenticated using (user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role <> 'client'::public.user_role));
create policy if not exists "clients read own accounts" on public.accounts for select to authenticated using (exists (select 1 from public.clients c where c.id = accounts.client_id and c.user_id = auth.uid()) or exists (select 1 from public.profiles where id = auth.uid() and role <> 'client'::public.user_role));

