-- Security hardening patch for migration 0001.
-- Applies Supabase / Postgres security best practices:
--   1. security_invoker = true on all 3 views (prevents view RLS bypass)
--   2. CREATE OR REPLACE VIEW retains permissions, adds security_invoker
--   3. TO authenticated clause on RLS SELECT policies (replaces deprecated auth.role() style)
--   4. INSERT / UPDATE / DELETE policies with explicit USING + WITH CHECK ownership predicates

-- =====================================================================
-- 1. Convert 3 VIEWS to SECURITY INVOKER (skill rule: views bypass RLS by default)
-- =====================================================================

CREATE OR REPLACE VIEW v_user_hierarchy
WITH (security_invoker = true)
AS
WITH RECURSIVE hierarchy AS (
    SELECT
        u.id,
        u.name,
        u.role,
        u.branchId,
        u.reportsTo,
        b.name AS branchName,
        1 AS level,
        CAST(u.name AS text) AS roleChain
    FROM users u
    LEFT JOIN branches b ON b.id = u.branchId
    WHERE u.reportsTo IS NULL

    UNION ALL

    SELECT
        u.id,
        u.name,
        u.role,
        u.branchId,
        u.reportsTo,
        b.name AS branchName,
        h.level + 1 AS level,
        CAST(h.roleChain || ' -> ' || u.name AS text) AS roleChain
    FROM users u
    JOIN hierarchy h ON h.id = u.reportsTo
    LEFT JOIN branches b ON b.id = u.branchId
)
SELECT id, name, role, branchId, branchName, reportsTo, level, roleChain
FROM hierarchy;

CREATE OR REPLACE VIEW v_client_portfolio_summary
WITH (security_invoker = true)
AS
SELECT
    c.id AS clientId,
    c.userId,
    c.customerId,
    COALESCE(SUM(DISTINCT a.balance), 0) AS totalAccountsBalance,
    COALESCE(SUM(DISTINCT l.outstanding), 0) AS totalLoanOutstanding,
    COALESCE(SUM(DISTINCT mf.currentValue), 0) AS totalMutualFundValue,
    COALESCE(SUM(DISTINCT ip.sumAssured), 0) AS totalInsuranceSumAssured,
    COALESCE(SUM(DISTINCT a.balance), 0)
        + COALESCE(SUM(DISTINCT mf.currentValue), 0)
        - COALESCE(SUM(DISTINCT l.outstanding), 0) AS netWorth
FROM clients c
LEFT JOIN accounts a ON a.clientId = c.id
LEFT JOIN loans l ON l.clientId = c.id
LEFT JOIN mutual_funds mf ON mf.clientId = c.id
LEFT JOIN insurance_policies ip ON ip.clientId = c.id
GROUP BY c.id, c.userId, c.customerId;

CREATE OR REPLACE VIEW v_commission_earnings_monthly
WITH (security_invoker = true)
AS
SELECT
    earnerId,
    period,
    COALESCE(SUM(CASE WHEN productType = 'loan' THEN amount ELSE 0 END), 0) AS loanCommission,
    COALESCE(SUM(CASE WHEN productType = 'insurance' THEN amount ELSE 0 END), 0) AS insuranceCommission,
    COALESCE(SUM(CASE WHEN productType = 'mutual_fund' THEN amount ELSE 0 END), 0) AS mutualFundCommission,
    COALESCE(SUM(CASE WHEN productType = 'account' THEN amount ELSE 0 END), 0) AS accountCommission,
    COALESCE(SUM(amount), 0) AS totalCommission,
    COUNT(*) AS transactionCount
FROM commissions
GROUP BY earnerId, period;

-- Revoke public execute/view rights on views (defense in depth)
REVOKE ALL ON v_user_hierarchy FROM PUBLIC;
REVOKE ALL ON v_client_portfolio_summary FROM PUBLIC;
REVOKE ALL ON v_commission_earnings_monthly FROM PUBLIC;

GRANT SELECT ON v_user_hierarchy TO authenticated;
GRANT SELECT ON v_client_portfolio_summary TO authenticated;
GRANT SELECT ON v_commission_earnings_monthly TO authenticated;

-- =====================================================================
-- 2. Hardened SELECT policies — explicit `TO authenticated` + ownership predicate
--    (Skill rule: `TO authenticated` alone is BOLA/IDOR; combine with USING ownership)
-- =====================================================================

DROP POLICY IF EXISTS "users_self_or_supervisor" ON users;
CREATE POLICY "users_self_or_supervisor" ON users
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','rm','arm')
        )
    );

DROP POLICY IF EXISTS "branches_all_staff" ON branches;
CREATE POLICY "branches_all_staff" ON branches
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','rm','arm','advisor','employee')
        )
    );

DROP POLICY IF EXISTS "clients_owner_or_supervisor" ON clients;
CREATE POLICY "clients_owner_or_supervisor" ON clients
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = userId
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','rm','arm')
        )
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND (u.id = (SELECT rmId FROM users WHERE id = clients.userId)
                 OR u.id = (SELECT armId FROM users WHERE id = clients.userId)
                 OR u.id = (SELECT advisorId FROM users WHERE id = clients.userId))
        )
    );

DROP POLICY IF EXISTS "accounts_owner_or_supervisor" ON accounts;
CREATE POLICY "accounts_owner_or_supervisor" ON accounts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = accounts.clientId AND c.userId = auth.uid())
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','rm','arm')
        )
    );

DROP POLICY IF EXISTS "transactions_owner_or_supervisor" ON transactions;
CREATE POLICY "transactions_owner_or_supervisor" ON transactions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM accounts a
            JOIN clients c ON c.id = a.clientId
            WHERE a.id = transactions.accountId
            AND c.userId = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','rm','arm')
        )
    );

DROP POLICY IF EXISTS "loans_owner_or_supervisor" ON loans;
CREATE POLICY "loans_owner_or_supervisor" ON loans
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = loans.clientId AND c.userId = auth.uid())
        OR loans.rmId = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','arm')
        )
    );

DROP POLICY IF EXISTS "loan_emis_owner_or_supervisor" ON loan_emis;
CREATE POLICY "loan_emis_owner_or_supervisor" ON loan_emis
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM loans l
            JOIN clients c ON c.id = l.clientId
            WHERE l.id = loan_emis.loanId
            AND (c.userId = auth.uid() OR l.rmId = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','arm')
        )
    );

DROP POLICY IF EXISTS "insurance_owner_or_supervisor" ON insurance_policies;
CREATE POLICY "insurance_owner_or_supervisor" ON insurance_policies
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = insurance_policies.clientId AND c.userId = auth.uid())
        OR insurance_policies.advisorId = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','rm','arm')
        )
    );

DROP POLICY IF EXISTS "insurance_renewals_owner_or_supervisor" ON insurance_renewals;
CREATE POLICY "insurance_renewals_owner_or_supervisor" ON insurance_renewals
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM insurance_policies p
            JOIN clients c ON c.id = p.clientId
            WHERE p.id = insurance_renewals.policyId
            AND (c.userId = auth.uid() OR p.advisorId = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','rm','arm')
        )
    );

DROP POLICY IF EXISTS "mutual_funds_owner_or_supervisor" ON mutual_funds;
CREATE POLICY "mutual_funds_owner_or_supervisor" ON mutual_funds
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = mutual_funds.clientId AND c.userId = auth.uid())
        OR mutual_funds.advisorId = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','rm','arm')
        )
    );

DROP POLICY IF EXISTS "kyc_own_or_supervisor" ON kyc_documents;
CREATE POLICY "kyc_own_or_supervisor" ON kyc_documents
    FOR SELECT
    TO authenticated
    USING (
        kyc_documents.userId = auth.uid()
        OR EXISTS (SELECT 1 FROM clients c WHERE c.id = kyc_documents.clientId AND c.userId = auth.uid())
        OR kyc_documents.verifiedBy = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','rm','arm')
        )
    );

DROP POLICY IF EXISTS "meetings_own_or_supervisor" ON meetings_tasks;
CREATE POLICY "meetings_own_or_supervisor" ON meetings_tasks
    FOR SELECT
    TO authenticated
    USING (
        meetings_tasks.createdBy = auth.uid()
        OR meetings_tasks.assignedTo = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','rm','arm')
        )
    );

DROP POLICY IF EXISTS "commissions_earner_or_supervisor" ON commissions;
CREATE POLICY "commissions_earner_or_supervisor" ON commissions
    FOR SELECT
    TO authenticated
    USING (
        commissions.earnerId = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager')
        )
    );

DROP POLICY IF EXISTS "support_client_or_assigned_or_supervisor" ON support_tickets;
CREATE POLICY "support_client_or_assigned_or_supervisor" ON support_tickets
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = support_tickets.clientId AND c.userId = auth.uid())
        OR support_tickets.assignedTo = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','rm','arm')
        )
    );

DROP POLICY IF EXISTS "attendance_own_or_supervisor" ON attendance;
CREATE POLICY "attendance_own_or_supervisor" ON attendance
    FOR SELECT
    TO authenticated
    USING (
        attendance.userId = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager')
        )
    );

DROP POLICY IF EXISTS "salary_slips_own_or_supervisor" ON salary_slips;
CREATE POLICY "salary_slips_own_or_supervisor" ON salary_slips
    FOR SELECT
    TO authenticated
    USING (
        salary_slips.userId = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager')
        )
    );

-- =====================================================================
-- 3. INSERT / UPDATE / DELETE write policies with USING + WITH CHECK
--    Skill rule: UPDATE requires both USING + WITH CHECK to prevent
--    user_id reassignment attacks.
-- =====================================================================

-- users table — only self or admin/branch_manager can update
CREATE POLICY "users_update_self_or_admin" ON users
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager'))
    )
    WITH CHECK (
        CASE
            WHEN EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager')) THEN TRUE
            ELSE auth.uid() = id
        END
    );

CREATE POLICY "users_insert_admin" ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
    );

CREATE POLICY "users_delete_admin_only" ON users
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
    );

-- clients — client self can edit own; supervisors can write their clients
CREATE POLICY "clients_update_owner_or_staff" ON clients
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = userId
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','rm','arm','advisor','employee')
        )
    )
    WITH CHECK (
        auth.uid() = userId
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','rm','arm','advisor','employee')
        )
    );

CREATE POLICY "clients_insert_staff_or_self" ON clients
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = userId
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin','branch_manager','rm','arm','advisor','employee')
        )
    );

-- accounts, loans, insurance, mutual_funds — client ownership + staff can write
CREATE POLICY "accounts_write_owner_or_staff" ON accounts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = accounts.clientId AND c.userId = auth.uid())
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    );

CREATE POLICY "accounts_update_owner_or_staff" ON accounts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = accounts.clientId AND c.userId = auth.uid())
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = accounts.clientId AND c.userId = auth.uid())
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    );

CREATE POLICY "loans_write_owner_rm_or_staff" ON loans
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = loans.clientId AND c.userId = auth.uid())
        OR loans.rmId = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','arm','employee'))
    );

CREATE POLICY "loans_update_owner_rm_or_staff" ON loans
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = loans.clientId AND c.userId = auth.uid())
        OR loans.rmId = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','arm','employee'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = loans.clientId AND c.userId = auth.uid())
        OR loans.rmId = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','arm','employee'))
    );

CREATE POLICY "insurance_write_owner_advisor_or_staff" ON insurance_policies
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = insurance_policies.clientId AND c.userId = auth.uid())
        OR insurance_policies.advisorId = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    );

CREATE POLICY "insurance_update_owner_advisor_or_staff" ON insurance_policies
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = insurance_policies.clientId AND c.userId = auth.uid())
        OR insurance_policies.advisorId = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = insurance_policies.clientId AND c.userId = auth.uid())
        OR insurance_policies.advisorId = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    );

CREATE POLICY "mutual_funds_write_owner_advisor_or_staff" ON mutual_funds
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = mutual_funds.clientId AND c.userId = auth.uid())
        OR mutual_funds.advisorId = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    );

CREATE POLICY "mutual_funds_update_owner_advisor_or_staff" ON mutual_funds
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = mutual_funds.clientId AND c.userId = auth.uid())
        OR mutual_funds.advisorId = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = mutual_funds.clientId AND c.userId = auth.uid())
        OR mutual_funds.advisorId = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    );

-- attendance — self insert; admin/BM update/delete
CREATE POLICY "attendance_insert_self" ON attendance
    FOR INSERT
    TO authenticated
    WITH CHECK ( attendance.userId = auth.uid() );

CREATE POLICY "attendance_update_self_or_admin_bm" ON attendance
    FOR UPDATE
    TO authenticated
    USING (
        attendance.userId = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager'))
    )
    WITH CHECK (
        attendance.userId = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager'))
    );

-- salary_slips — admins+BM can write; users can only read own (no write policy for regular users)
CREATE POLICY "salary_slips_write_admin_bm" ON salary_slips
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager'))
    );

CREATE POLICY "salary_slips_update_admin_bm" ON salary_slips
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager'))
    );

-- commissions — admins/BM write, earners read only
CREATE POLICY "commissions_write_admin_bm" ON commissions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager'))
    );

CREATE POLICY "commissions_update_admin_bm" ON commissions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager'))
    );

-- kyc / meetings / support / insurance_renewals / loan_emis / transactions
-- minimal write policies: owner + relevant staff roles
CREATE POLICY "kyc_write_owner_or_staff" ON kyc_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        kyc_documents.userId = auth.uid()
        OR EXISTS (SELECT 1 FROM clients c WHERE c.id = kyc_documents.clientId AND c.userId = auth.uid())
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    );

CREATE POLICY "kyc_update_owner_or_staff" ON kyc_documents
    FOR UPDATE
    TO authenticated
    USING (
        kyc_documents.userId = auth.uid()
        OR kyc_documents.verifiedBy = auth.uid()
        OR EXISTS (SELECT 1 FROM clients c WHERE c.id = kyc_documents.clientId AND c.userId = auth.uid())
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    )
    WITH CHECK (
        kyc_documents.userId = auth.uid()
        OR EXISTS (SELECT 1 FROM clients c WHERE c.id = kyc_documents.clientId AND c.userId = auth.uid())
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    );

CREATE POLICY "meetings_write_participant_or_staff" ON meetings_tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        meetings_tasks.createdBy = auth.uid()
        OR meetings_tasks.assignedTo = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm'))
    );

CREATE POLICY "meetings_update_participant_or_staff" ON meetings_tasks
    FOR UPDATE
    TO authenticated
    USING (
        meetings_tasks.createdBy = auth.uid()
        OR meetings_tasks.assignedTo = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm'))
    )
    WITH CHECK (
        meetings_tasks.createdBy = auth.uid()
        OR meetings_tasks.assignedTo = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm'))
    );

CREATE POLICY "support_write_client_assigned_or_staff" ON support_tickets
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = support_tickets.clientId AND c.userId = auth.uid())
        OR support_tickets.assignedTo = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm'))
    );

CREATE POLICY "support_update_client_assigned_or_staff" ON support_tickets
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = support_tickets.clientId AND c.userId = auth.uid())
        OR support_tickets.assignedTo = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = support_tickets.clientId AND c.userId = auth.uid())
        OR support_tickets.assignedTo = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm'))
    );

CREATE POLICY "loan_emis_write_admin_staff" ON loan_emis
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','arm','employee'))
    );

CREATE POLICY "loan_emis_update_admin_staff" ON loan_emis
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM loans l
            JOIN clients c ON c.id = l.clientId
            WHERE l.id = loan_emis.loanId AND (c.userId = auth.uid() OR l.rmId = auth.uid())
        )
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','arm','employee'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','arm','employee'))
    );

CREATE POLICY "insurance_renewals_write_staff_or_owner" ON insurance_renewals
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','advisor'))
    );

CREATE POLICY "insurance_renewals_update_staff_or_owner" ON insurance_renewals
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM insurance_policies p
            JOIN clients c ON c.id = p.clientId
            WHERE p.id = insurance_renewals.policyId
            AND (c.userId = auth.uid() OR p.advisorId = auth.uid())
        )
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','advisor'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','advisor'))
    );

CREATE POLICY "transactions_write_staff_only" ON transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    );

CREATE POLICY "transactions_update_staff_only" ON transactions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM accounts a
            JOIN clients c ON c.id = a.clientId
            WHERE a.id = transactions.accountId AND c.userId = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin','branch_manager','rm','arm','employee'))
    );

-- =====================================================================
-- 4. Anon role safety: do NOT grant anon any write/read on user tables
--    Only authenticated role + service_role bypasses RLS.
-- =====================================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON branches TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
