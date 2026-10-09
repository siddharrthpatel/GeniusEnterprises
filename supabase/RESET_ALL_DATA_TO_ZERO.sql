-- =============================================================================
-- Genius Enterprises — RESET ALL DATA TO ZERO (KEEP LOGIN CREDENTIALS)
-- Paste and Run in Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Run
--
-- This removes all demo portfolio, account, and transactional records
-- so all dashboards show 0, while keeping user login credentials intact.
-- =============================================================================

-- 1. Safely truncate all business and transactional tables (cascading)
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'transactions', 'accounts', 'loan_emis', 'loans', 
    'insurance_renewals', 'insurance_policies', 'mutual_funds', 
    'kyc_documents', 'attendance', 'salary_slips', 
    'commissions', 'support_tickets', 'meetings_tasks'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('TRUNCATE TABLE public.%I CASCADE;', tbl);
    END IF;
  END LOOP;
END $$;

-- 2. Confirm authentication and user records remain intact
-- The following accounts remain active for authentication:
--   admin@genius.com      / Admin@123   (Admin)
--   bm@genius.com         / Bm@123      (Branch Manager)
--   rm1@genius.com        / Rm@123      (Relationship Manager)
--   arm@genius.com        / Arm@123     (Associate RM)
--   advisor@genius.com    / Adv@123     (Financial Advisor)
--   broker@genius.com     / Broker@123  (Sub-Broker)
--   employee@genius.com   / Emp@123     (Staff Employee)
--   client1@genius.com    / Client@123  (Investor Client)
