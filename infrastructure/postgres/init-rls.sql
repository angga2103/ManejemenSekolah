-- ==============================================================================
-- POSTGRESQL INITIALIZATION & MULTI-TENANT ROW LEVEL SECURITY (RLS) FOUNDATION
-- ==============================================================================

-- Enable UUID & Cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to retrieve current tenant ID from database session context
-- Application sets this on every transaction using: SELECT set_config('app.current_tenant_id', 'tenant-uuid', true);
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to retrieve current user ID from database session context
-- Application sets this using: SELECT set_config('app.current_user_id', 'user-uuid', true);
CREATE OR REPLACE FUNCTION current_app_user_id() RETURNS uuid AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Bypass flag for Super Admin operations or administrative jobs
-- Application sets this using: SELECT set_config('app.is_super_admin', 'true', true);
CREATE OR REPLACE FUNCTION is_super_admin_bypass() RETURNS boolean AS $$
BEGIN
    RETURN COALESCE(NULLIF(current_setting('app.is_super_admin', true), '')::boolean, false);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- MULTI-TENANT ROW LEVEL SECURITY POLICIES FOR OPERATIONAL TABLES
-- ==============================================================================

-- Macro procedure to apply uniform tenant isolation policy and force RLS
DO $$
DECLARE
    tbl text;
    tenant_tables text[] := ARRAY[
        'students',
        'guardians',
        'class_groups',
        'subjects',
        'attendances',
        'invoices',
        'payments',
        'billing_categories',
        'dormitories',
        'dorm_rooms',
        'dorm_allocations',
        'exam_sessions',
        'counseling_records',
        'student_violations',
        'student_achievements',
        'leave_requests',
        'tahfiz_records',
        'halaqah_groups',
        'journal_entries',
        'accounts',
        'notifications',
        'pesantren_permits',
        'complaints'
    ];
BEGIN
    FOREACH tbl IN ARRAY tenant_tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
            -- 1. Enable RLS on table
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
            -- 2. FORCE RLS so table owner connection also obeys the policy
            EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);
            -- 3. Drop existing policy if present
            EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
            -- 4. Create authoritative isolation policy
            EXECUTE format('
                CREATE POLICY tenant_isolation_policy ON %I
                FOR ALL
                USING (
                    tenant_id = current_tenant_id()
                    OR is_super_admin_bypass()
                )
                WITH CHECK (
                    tenant_id = current_tenant_id()
                    OR is_super_admin_bypass()
                );', tbl);
        END IF;
    END LOOP;
END $$;


-- ==============================================================================
-- APPLICATION DATABASE ROLE (NON-SUPERUSER, NOBYPASSRLS)
-- ==============================================================================
-- CRITICAL SECURITY NOTE:
-- PostgreSQL superusers (e.g. 'postgres') and roles with 'BYPASSRLS' attribute
-- bypass all Row-Level Security policies by design.
-- In Staging and Production, the application MUST connect using this unprivileged
-- application role so that FORCE ROW LEVEL SECURITY is strictly respected.
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'edusaas_app_user') THEN
        CREATE ROLE edusaas_app_user WITH 
            LOGIN 
            PASSWORD 'edusaas_secure_app_password_2026' 
            NOSUPERUSER 
            NOBYPASSRLS 
            NOCREATEDB 
            NOCREATEROLE;
    END IF;
END $$;

GRANT USAGE ON SCHEMA public TO edusaas_app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO edusaas_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO edusaas_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO edusaas_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO edusaas_app_user;
