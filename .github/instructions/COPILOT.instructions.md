---
description: use drizzle orm and pg db to create these entities and it's attribute
# applyTo: 'Describe when these instructions should be loaded by the agent based on task context' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

<!-- Tip: Use /create-instructions in chat to generate content with agent assistance -->

# Your instructions

Write project-level directions for Copilot below. Keep the newest or highest
priority instruction at the top.

## Current instructions

-- ============================================================
-- Schema: Auth (Better-Auth) + HR business tables
-- Database: PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- สำหรับ gen_random_uuid()

-- ============================================================
-- 1. ฝั่ง Auth (Better-Auth) — ห้ามแก้โครงสร้างเอง ให้ lib จัดการ
--    schema นี้แนบไว้เพื่ออ้างอิงความสัมพันธ์เท่านั้น
-- ============================================================

CREATE TABLE auth_users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255),
    email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    image_url           TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    token               VARCHAR(255) NOT NULL UNIQUE,
    expires_at          TIMESTAMPTZ NOT NULL,
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

CREATE TABLE accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    provider            VARCHAR(100) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    access_token        TEXT,
    refresh_token       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_account_id)
);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);

CREATE TABLE login_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    logged_in_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_login_history_user_id ON login_history(user_id);


-- ============================================================
-- 2. ฝั่ง Business / HR
-- ============================================================

CREATE TABLE departments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_name         VARCHAR(255) NOT NULL,
    parent_department_id    UUID REFERENCES departments(id) ON DELETE SET NULL, -- สังกัดใน (self-reference, nullable = root)
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_departments_parent ON departments(parent_department_id);

CREATE TABLE positions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_name       VARCHAR(255) NOT NULL,
    department_id       UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    is_hr_role          BOOLEAN NOT NULL DEFAULT FALSE, -- ใช้เป็น guard: มีสิทธิ์สร้างบัญชี auth ได้หรือไม่
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_positions_department_id ON positions(department_id);

CREATE TABLE employees (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id        UUID UNIQUE REFERENCES auth_users(id) ON DELETE SET NULL, -- nullable: มีเฉพาะ HR ที่ต้อง login
    prefix              VARCHAR(20),
    first_name          VARCHAR(255) NOT NULL,
    last_name           VARCHAR(255) NOT NULL,
    company_email       VARCHAR(255) NOT NULL UNIQUE, -- email สำหรับแสดงผล มีทุกคน
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_employees_auth_user_id ON employees(auth_user_id);

CREATE TABLE personal_info (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id         UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE, -- 1:1
    national_id         VARCHAR(20),
    address             TEXT,
    tax_allowance       VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE employment_contracts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    employment_type     VARCHAR(100) NOT NULL,   -- เช่น full-time, part-time, contract
    employment_status   VARCHAR(50) NOT NULL,    -- เช่น active, terminated, resigned
    start_date          DATE NOT NULL,
    end_date            DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_employment_contracts_employee_id ON employment_contracts(employee_id);

CREATE TABLE position_histories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id         UUID NOT NULL REFERENCES employment_contracts(id) ON DELETE CASCADE,
    position_id         UUID NOT NULL REFERENCES positions(id) ON DELETE RESTRICT,
    effective_from      DATE NOT NULL,
    effective_to        DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_position_histories_contract_id ON position_histories(contract_id);
CREATE INDEX idx_position_histories_position_id ON position_histories(position_id);

CREATE TABLE leaves (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type          VARCHAR(100) NOT NULL,   -- เช่น sick, vacation, personal
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    approval_status     VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    approved_by         UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leaves_employee_id ON leaves(employee_id);


-- ============================================================
-- 3. Safety net: จำกัดว่าเฉพาะตำแหน่ง HR เท่านั้นที่ผูก auth_user_id ได้
--    (อ้างอิงจากที่คุยกันไว้ — เป็น last line of defense
--     logic หลักควรอยู่ที่ application layer)
-- ============================================================

CREATE OR REPLACE FUNCTION check_hr_before_link()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.auth_user_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM position_histories ph
            JOIN employment_contracts ec ON ec.id = ph.contract_id
            JOIN positions p ON p.id = ph.position_id
            WHERE ec.employee_id = NEW.id
              AND p.is_hr_role = TRUE
              AND ph.effective_to IS NULL
        ) THEN
            RAISE EXCEPTION 'Only employees currently in an HR position can be linked to an auth account';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_hr_before_link
BEFORE INSERT OR UPDATE OF auth_user_id ON employees
FOR EACH ROW
EXECUTE FUNCTION check_hr_before_link();
