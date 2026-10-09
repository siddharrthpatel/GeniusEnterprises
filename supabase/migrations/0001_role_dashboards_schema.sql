CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

CREATE TYPE user_role AS ENUM ('master_admin','admin','branch_manager','rm','arm','advisor','sub_broker','employee','client');

CREATE TABLE branches (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    address text,
    zone text,
    createdAt timestamptz NOT NULL DEFAULT now(),
    status text NOT NULL DEFAULT 'active'
);

CREATE TABLE users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    branchId uuid REFERENCES branches(id) ON DELETE SET NULL,
    reportsTo uuid REFERENCES users(id) ON DELETE SET NULL,
    rmId uuid REFERENCES users(id) ON DELETE SET NULL,
    armId uuid REFERENCES users(id) ON DELETE SET NULL,
    advisorId uuid REFERENCES users(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'active',
    createdAt timestamptz NOT NULL DEFAULT now(),
    updatedAt timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_reportsTo ON users(reportsTo);
CREATE INDEX idx_users_branchId ON users(branchId);

CREATE TABLE clients (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    userId uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    customerId text UNIQUE NOT NULL,
    dob date,
    pan text,
    aadhaarMasked text,
    nomineeName text,
    nomineeRelation text,
    riskProfile text NOT NULL DEFAULT 'Moderate'
);

CREATE TABLE accounts (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    clientId uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('savings','current','fd','rd','ppf')),
    number text UNIQUE NOT NULL,
    ifsc text,
    balance numeric NOT NULL DEFAULT 0,
    openDate date,
    maturityDate date,
    interestRate numeric,
    status text NOT NULL DEFAULT 'active'
);

CREATE TABLE transactions (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    accountId uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    txDate date NOT NULL,
    amount numeric NOT NULL,
    direction text NOT NULL CHECK (direction IN ('CR','DR')),
    narration text,
    category text,
    reference text
);

CREATE TABLE loans (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    clientId uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    rmId uuid REFERENCES users(id) ON DELETE SET NULL,
    product text,
    principalAmount numeric,
    disbursedAmount numeric,
    rate numeric,
    tenorMonths int,
    emi numeric,
    outstanding numeric,
    applyDate date,
    disburseDate date,
    status text NOT NULL DEFAULT 'application'
);

CREATE TABLE loan_emis (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    loanId uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    dueDate date NOT NULL,
    principal numeric,
    interest numeric,
    total numeric,
    status text NOT NULL CHECK (status IN ('Paid','Upcoming','Scheduled')) DEFAULT 'Scheduled',
    paidDate date
);

CREATE TABLE insurance_policies (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    clientId uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    advisorId uuid REFERENCES users(id) ON DELETE SET NULL,
    product text,
    policyNo text UNIQUE NOT NULL,
    premium numeric,
    frequency text NOT NULL CHECK (frequency IN ('monthly','quarterly','half-yearly','yearly')) DEFAULT 'monthly',
    sumAssured numeric,
    nextDue date,
    status text NOT NULL DEFAULT 'proposal'
);

CREATE TABLE insurance_renewals (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    policyId uuid NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
    dueDate date NOT NULL,
    amount numeric,
    status text NOT NULL DEFAULT 'pending'
);

CREATE TABLE mutual_funds (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    clientId uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    advisorId uuid REFERENCES users(id) ON DELETE SET NULL,
    scheme text,
    folio text,
    units numeric,
    avgNav numeric,
    currentValue numeric,
    xirr numeric,
    sipAmount numeric NOT NULL DEFAULT 0,
    sipDay int,
    status text NOT NULL DEFAULT 'active'
);

CREATE TABLE kyc_documents (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    userId uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clientId uuid REFERENCES clients(id) ON DELETE SET NULL,
    docType text NOT NULL,
    status text NOT NULL DEFAULT 'Uploaded',
    uploadedAt timestamptz NOT NULL DEFAULT now(),
    verifiedBy uuid REFERENCES users(id) ON DELETE SET NULL,
    verifiedAt timestamptz,
    documentUrl text,
    notes text
);

CREATE TABLE meetings_tasks (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    createdBy uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignedTo uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relatedClientId uuid REFERENCES clients(id) ON DELETE SET NULL,
    type text NOT NULL CHECK (type IN ('meeting','task','followup')),
    title text NOT NULL,
    scheduledAt timestamptz,
    status text NOT NULL DEFAULT 'pending',
    priority text NOT NULL DEFAULT 'medium',
    notes text,
    createdAt timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE commissions (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    earnerId uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clientId uuid REFERENCES clients(id) ON DELETE SET NULL,
    productType text,
    sourceTable text,
    sourceId uuid,
    amount numeric NOT NULL,
    period text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    payoutDate date,
    createdAt timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE support_tickets (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    clientId uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    subject text NOT NULL,
    status text NOT NULL DEFAULT 'Open',
    assignedTo uuid REFERENCES users(id) ON DELETE SET NULL,
    lastUpdated timestamptz NOT NULL DEFAULT now(),
    createdAt timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE attendance (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    userId uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date date NOT NULL,
    inTime time,
    outTime time,
    status text NOT NULL DEFAULT 'Present',
    UNIQUE (userId, date)
);

CREATE TABLE salary_slips (
    id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    userId uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month text NOT NULL,
    payslipNo text UNIQUE NOT NULL,
    basic numeric,
    hra numeric,
    incentive numeric,
    pf numeric,
    pt numeric,
    net numeric,
    status text NOT NULL DEFAULT 'generated'
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_emis ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutual_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_self_or_supervisor" ON users
    FOR SELECT USING (
        auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager','rm','arm')
        )
    );

CREATE POLICY "branches_all_staff" ON branches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager','rm','arm','advisor','employee')
        )
    );

CREATE POLICY "clients_owner_or_supervisor" ON clients
    FOR SELECT USING (
        auth.uid() = userId
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager','rm','arm')
        )
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND (u.id = (SELECT rmId FROM users WHERE id = clients.userId)
                 OR u.id = (SELECT armId FROM users WHERE id = clients.userId)
                 OR u.id = (SELECT advisorId FROM users WHERE id = clients.userId))
        )
    );

CREATE POLICY "accounts_owner_or_supervisor" ON accounts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = accounts.clientId AND c.userId = auth.uid())
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager','rm','arm')
        )
    );

CREATE POLICY "transactions_owner_or_supervisor" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM accounts a
            JOIN clients c ON c.id = a.clientId
            WHERE a.id = transactions.accountId
            AND c.userId = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager','rm','arm')
        )
    );

CREATE POLICY "loans_owner_or_supervisor" ON loans
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = loans.clientId AND c.userId = auth.uid())
        OR loans.rmId = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager','arm')
        )
    );

CREATE POLICY "loan_emis_owner_or_supervisor" ON loan_emis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM loans l
            JOIN clients c ON c.id = l.clientId
            WHERE l.id = loan_emis.loanId
            AND (c.userId = auth.uid() OR l.rmId = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager','arm')
        )
    );

CREATE POLICY "insurance_owner_or_supervisor" ON insurance_policies
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = insurance_policies.clientId AND c.userId = auth.uid())
        OR insurance_policies.advisorId = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager','rm','arm')
        )
    );

CREATE POLICY "insurance_renewals_owner_or_supervisor" ON insurance_renewals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM insurance_policies p
            JOIN clients c ON c.id = p.clientId
            WHERE p.id = insurance_renewals.policyId
            AND (c.userId = auth.uid() OR p.advisorId = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager','rm','arm')
        )
    );

CREATE POLICY "mutual_funds_owner_or_supervisor" ON mutual_funds
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = mutual_funds.clientId AND c.userId = auth.uid())
        OR mutual_funds.advisorId = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager','rm','arm')
        )
    );

CREATE POLICY "kyc_own_or_supervisor" ON kyc_documents
    FOR SELECT USING (
        kyc_documents.userId = auth.uid()
        OR EXISTS (SELECT 1 FROM clients c WHERE c.id = kyc_documents.clientId AND c.userId = auth.uid())
        OR kyc_documents.verifiedBy = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager','rm','arm')
        )
    );

CREATE POLICY "meetings_own_or_supervisor" ON meetings_tasks
    FOR SELECT USING (
        meetings_tasks.createdBy = auth.uid()
        OR meetings_tasks.assignedTo = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager','rm','arm')
        )
    );

CREATE POLICY "commissions_earner_or_supervisor" ON commissions
    FOR SELECT USING (
        commissions.earnerId = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager')
        )
    );

CREATE POLICY "support_client_or_assigned_or_supervisor" ON support_tickets
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM clients c WHERE c.id = support_tickets.clientId AND c.userId = auth.uid())
        OR support_tickets.assignedTo = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager','rm','arm')
        )
    );

CREATE POLICY "attendance_own_or_supervisor" ON attendance
    FOR SELECT USING (
        attendance.userId = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager')
        )
    );

CREATE POLICY "salary_slips_own_or_supervisor" ON salary_slips
    FOR SELECT USING (
        salary_slips.userId = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('master_admin','admin','branch_manager')
        )
    );

CREATE VIEW v_user_hierarchy AS
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

CREATE VIEW v_client_portfolio_summary AS
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

CREATE VIEW v_commission_earnings_monthly AS
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
