-- =============================================================================
-- Genius Enterprises — Row Level Security (RLS) & Access Control Migration
-- Run in Supabase SQL Editor to protect all public tables against unauthorized access.
-- =============================================================================

-- 1. Helper functions to check caller role
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
as $$
  select role::text from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'master_admin')
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'master_admin', 'branch_manager', 'rm', 'arm', 'advisor', 'sub_broker', 'employee')
  );
$$;

-- 2. ENABLE ROW LEVEL SECURITY ON ALL TABLES
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

-- 3. PROFILES POLICIES
drop policy if exists "service_role has full access to profiles" on public.profiles;
create policy "service_role has full access to profiles"
  on public.profiles for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "users can read own profile or staff can read all" on public.profiles;
create policy "users can read own profile or staff can read all"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.is_staff()
  );

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "admin can insert or delete profiles" on public.profiles;
create policy "admin can insert or delete profiles"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4. CLIENTS POLICIES
drop policy if exists "service_role has full access to clients" on public.clients;
create policy "service_role has full access to clients"
  on public.clients for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "clients can view own client record" on public.clients;
create policy "clients can view own client record"
  on public.clients for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_staff()
  );

drop policy if exists "staff can manage client records" on public.clients;
create policy "staff can manage client records"
  on public.clients for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- 5. ACCOUNTS & TRANSACTIONS POLICIES
drop policy if exists "service_role has full access to accounts" on public.accounts;
create policy "service_role has full access to accounts"
  on public.accounts for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "clients see own accounts, staff see all" on public.accounts;
create policy "clients see own accounts, staff see all"
  on public.accounts for select
  to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = accounts.client_id and c.user_id = auth.uid()
    )
    or public.is_staff()
  );

drop policy if exists "service_role has full access to transactions" on public.transactions;
create policy "service_role has full access to transactions"
  on public.transactions for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "clients see own transactions, staff see all" on public.transactions;
create policy "clients see own transactions, staff see all"
  on public.transactions for select
  to authenticated
  using (
    exists (
      select 1 from public.accounts a
      join public.clients c on c.id = a.client_id
      where a.id = transactions.account_id and c.user_id = auth.uid()
    )
    or public.is_staff()
  );

-- 6. SUPPORT TICKETS POLICIES
drop policy if exists "service_role has full access to tickets" on public.support_tickets;
create policy "service_role has full access to tickets"
  on public.support_tickets for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "clients see own tickets, staff see all" on public.support_tickets;
create policy "clients see own tickets, staff see all"
  on public.support_tickets for select
  to authenticated
  using (
    client_id in (select id from public.clients where user_id = auth.uid())
    or public.is_staff()
  );

drop policy if exists "clients can create tickets" on public.support_tickets;
create policy "clients can create tickets"
  on public.support_tickets for insert
  to authenticated
  with check (
    client_id in (select id from public.clients where user_id = auth.uid())
    or public.is_staff()
  );

-- 7. GENERAL STAFF DATA (KYC, COMMISSIONS, SALARIES, ATTENDANCE, MEETINGS)
drop policy if exists "service_role full access to kyc" on public.kyc_documents;
create policy "service_role full access to kyc" on public.kyc_documents for all to service_role using (true) with check (true);

drop policy if exists "service_role full access to commissions" on public.commissions;
create policy "service_role full access to commissions" on public.commissions for all to service_role using (true) with check (true);

drop policy if exists "service_role full access to salary_slips" on public.salary_slips;
create policy "service_role full access to salary_slips" on public.salary_slips for all to service_role using (true) with check (true);

drop policy if exists "service_role full access to attendance" on public.attendance;
create policy "service_role full access to attendance" on public.attendance for all to service_role using (true) with check (true);

drop policy if exists "service_role full access to meetings_tasks" on public.meetings_tasks;
create policy "service_role full access to meetings_tasks" on public.meetings_tasks for all to service_role using (true) with check (true);

drop policy if exists "service_role full access to mutual_funds" on public.mutual_funds;
create policy "service_role full access to mutual_funds" on public.mutual_funds for all to service_role using (true) with check (true);

drop policy if exists "service_role full access to insurance_policies" on public.insurance_policies;
create policy "service_role full access to insurance_policies" on public.insurance_policies for all to service_role using (true) with check (true);

drop policy if exists "service_role full access to loans" on public.loans;
create policy "service_role full access to loans" on public.loans for all to service_role using (true) with check (true);

-- Authenticated staff access for internal operations
drop policy if exists "staff access to internal operational records" on public.kyc_documents;
create policy "staff access to internal operational records" on public.kyc_documents for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff access to commissions" on public.commissions;
create policy "staff access to commissions" on public.commissions for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff access to salary_slips" on public.salary_slips;
create policy "staff access to salary_slips" on public.salary_slips for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff access to attendance" on public.attendance;
create policy "staff access to attendance" on public.attendance for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff access to meetings_tasks" on public.meetings_tasks;
create policy "staff access to meetings_tasks" on public.meetings_tasks for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "read access to mutual funds" on public.mutual_funds;
create policy "read access to mutual funds" on public.mutual_funds for select to authenticated using (true);
