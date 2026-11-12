-- ==============================================================================
-- EDUSAAS MULTI-TENANT DATABASE ROW-LEVEL SECURITY (RLS) INITIALIZATION
-- ==============================================================================
-- Enforces absolute multi-tenant data isolation at the PostgreSQL engine level.
-- Incorporates Defense-in-Depth against GUC spoofing, privilege escalation,
-- and unauthorized cross-tenant data traversal.
-- ==============================================================================

-- 1. Enable pgcrypto / uuid generation extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- SESSION CONTEXT FUNCTIONS
-- ==============================================================================

-- Function to retrieve current tenant ID from database transaction session context
-- Application sets this using: SELECT set_config('app.current_tenant_id', 'tenant-uuid', true);
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

-- ==============================================================================
-- TAMPER-PROOF SUPER ADMIN BYPASS EVALUATION
-- ==============================================================================
-- CRITICAL SECURITY RULE:
-- The standard application runtime role ('edusaas_app_user') is NEVER permitted
-- to bypass Row-Level Security, regardless of what session variables (GUC) it sets.
-- Only authenticated administrative roles or superusers can activate bypass,
-- and only when supplying a mandatory audit trail reason (min 10 characters).
CREATE OR REPLACE FUNCTION is_super_admin_bypass() RETURNS boolean AS $$
BEGIN
    -- 1. HARD SECURITY BARRIER:
    -- If the current session or role is the standard application user, RLS bypass is IMPOSSIBLE.
    -- This prevents SQL injection or malicious set_config calls from elevating privileges.
    IF CURRENT_USER = 'edusaas_app_user' OR SESSION_USER = 'edusaas_app_user' THEN
        RETURN false;
    END IF;

    -- 2. Only designated administrative roles or superusers can activate cross-tenant bypass
    IF pg_has_role(CURRENT_USER, 'edusaas_admin_role', 'MEMBER')
       OR CURRENT_USER = 'edusaas_admin_user'
       OR CURRENT_USER = 'postgres' THEN
        
        -- Explicit GUC flag must be set to 'true'
        IF COALESCE(NULLIF(current_setting('app.is_super_admin', true), '')::boolean, false) = true THEN
            -- Audit reason must be present and meet minimum length (>= 10 chars)
            IF length(COALESCE(NULLIF(current_setting('app.super_admin_bypass_reason', true), ''), '')) >= 10 THEN
                RETURN true;
            END IF;
        END IF;
    END IF;

    RETURN false;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- AUDIT LOGGING FOR CROSS-TENANT ACCESS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS cross_tenant_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    db_user VARCHAR(64) NOT NULL DEFAULT CURRENT_USER,
    admin_id UUID,
    target_tenant_id UUID,
    action_type VARCHAR(64) NOT NULL DEFAULT 'ADMIN_CROSS_TENANT_READ',
    reason TEXT NOT NULL,
    client_ip VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_cross_tenant_access_logs_target ON cross_tenant_access_logs(target_tenant_id);
CREATE INDEX IF NOT EXISTS idx_cross_tenant_access_logs_date ON cross_tenant_access_logs(executed_at);

-- ==============================================================================
-- 1. MULTI-TENANT RLS POLICIES FOR OPERATIONAL TABLES WITH DIRECT tenant_id (41 TABLES)
-- ==============================================================================

DO $$
DECLARE
    tbl text;
    tenant_tables text[] := ARRAY[
        'tenant_subscriptions',
        'tenant_settings',
        'users',
        'roles',
        'audit_logs',
        'institutions',
        'departments',
        'academic_years',
        'class_groups',
        'employees',
        'students',
        'guardians',
        'student_guardians',
        'subjects',
        'attendances',
        'billing_categories',
        'invoices',
        'payments',
        'dormitories',
        'dorm_allocations',
        'tahfiz_records',
        'pesantren_permits',
        'leave_requests',
        'cash_accounts',
        'journal_entries',
        'grades',
        'report_cards',
        'halaqah_groups',
        'counseling_records',
        'student_violations',
        'student_achievements',
        'announcements',
        'complaint_tickets',
        'notification_logs',
        'course_materials',
        'assignments',
        'assignment_submissions',
        'question_banks',
        'exam_questions',
        'exams',
        'student_exam_sessions'
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
-- 2. ROOT TENANT TABLE POLICY (tenants)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenants') THEN
        ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
        ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS tenant_self_view_policy ON tenants;
        CREATE POLICY tenant_self_view_policy ON tenants
            FOR ALL
            USING (
                id = current_tenant_id()
                OR is_super_admin_bypass()
            )
            WITH CHECK (
                id = current_tenant_id()
                OR is_super_admin_bypass()
            );
    END IF;
END $$;

-- ==============================================================================
-- 3. CHILD & RELATION TABLES WITHOUT DIRECT tenant_id (10 TABLES)
-- ==============================================================================
-- These tables belong to a tenant through a parent table foreign key relationship.
-- We enforce RLS via correlated subqueries against parent tenant_id.

-- 3.1 dorm_rooms (via dormitory_id -> dormitories.tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dorm_rooms') THEN
        ALTER TABLE dorm_rooms ENABLE ROW LEVEL SECURITY;
        ALTER TABLE dorm_rooms FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS child_dorm_rooms_isolation ON dorm_rooms;
        CREATE POLICY child_dorm_rooms_isolation ON dorm_rooms
            FOR ALL
            USING (
                EXISTS (SELECT 1 FROM dormitories d WHERE d.id = dorm_rooms.dormitory_id AND (d.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            )
            WITH CHECK (
                EXISTS (SELECT 1 FROM dormitories d WHERE d.id = dorm_rooms.dormitory_id AND (d.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            );
    END IF;
END $$;

-- 3.2 journal_lines (via journal_entry_id -> journal_entries.tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'journal_lines') THEN
        ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
        ALTER TABLE journal_lines FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS child_journal_lines_isolation ON journal_lines;
        CREATE POLICY child_journal_lines_isolation ON journal_lines
            FOR ALL
            USING (
                EXISTS (SELECT 1 FROM journal_entries j WHERE j.id = journal_lines.journal_entry_id AND (j.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            )
            WITH CHECK (
                EXISTS (SELECT 1 FROM journal_entries j WHERE j.id = journal_lines.journal_entry_id AND (j.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            );
    END IF;
END $$;

-- 3.3 refresh_tokens (via user_id -> users.tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'refresh_tokens') THEN
        ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
        ALTER TABLE refresh_tokens FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS child_refresh_tokens_isolation ON refresh_tokens;
        CREATE POLICY child_refresh_tokens_isolation ON refresh_tokens
            FOR ALL
            USING (
                EXISTS (SELECT 1 FROM users u WHERE u.id = refresh_tokens.user_id AND (u.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            )
            WITH CHECK (
                EXISTS (SELECT 1 FROM users u WHERE u.id = refresh_tokens.user_id AND (u.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            );
    END IF;
END $$;

-- 3.4 role_permissions (via role_id -> roles.tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'role_permissions') THEN
        ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE role_permissions FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS child_role_permissions_isolation ON role_permissions;
        CREATE POLICY child_role_permissions_isolation ON role_permissions
            FOR ALL
            USING (
                EXISTS (SELECT 1 FROM roles r WHERE r.id = role_permissions.role_id AND (r.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            )
            WITH CHECK (
                EXISTS (SELECT 1 FROM roles r WHERE r.id = role_permissions.role_id AND (r.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            );
    END IF;
END $$;

-- 3.5 user_roles (via user_id -> users.tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
        ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE user_roles FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS child_user_roles_isolation ON user_roles;
        CREATE POLICY child_user_roles_isolation ON user_roles
            FOR ALL
            USING (
                EXISTS (SELECT 1 FROM users u WHERE u.id = user_roles.user_id AND (u.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            )
            WITH CHECK (
                EXISTS (SELECT 1 FROM users u WHERE u.id = user_roles.user_id AND (u.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            );
    END IF;
END $$;

-- 3.6 class_students (via class_group_id -> class_groups.tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'class_students') THEN
        ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
        ALTER TABLE class_students FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS child_class_students_isolation ON class_students;
        CREATE POLICY child_class_students_isolation ON class_students
            FOR ALL
            USING (
                EXISTS (SELECT 1 FROM class_groups c WHERE c.id = class_students.class_group_id AND (c.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            )
            WITH CHECK (
                EXISTS (SELECT 1 FROM class_groups c WHERE c.id = class_students.class_group_id AND (c.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            );
    END IF;
END $$;

-- 3.7 musyrif_assignments (via employee_id -> employees.tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'musyrif_assignments') THEN
        ALTER TABLE musyrif_assignments ENABLE ROW LEVEL SECURITY;
        ALTER TABLE musyrif_assignments FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS child_musyrif_assignments_isolation ON musyrif_assignments;
        CREATE POLICY child_musyrif_assignments_isolation ON musyrif_assignments
            FOR ALL
            USING (
                EXISTS (SELECT 1 FROM employees e WHERE e.id = musyrif_assignments.employee_id AND (e.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            )
            WITH CHECK (
                EXISTS (SELECT 1 FROM employees e WHERE e.id = musyrif_assignments.employee_id AND (e.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            );
    END IF;
END $$;

-- 3.8 halaqah_members (via halaqah_group_id -> halaqah_groups.tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'halaqah_members') THEN
        ALTER TABLE halaqah_members ENABLE ROW LEVEL SECURITY;
        ALTER TABLE halaqah_members FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS child_halaqah_members_isolation ON halaqah_members;
        CREATE POLICY child_halaqah_members_isolation ON halaqah_members
            FOR ALL
            USING (
                EXISTS (SELECT 1 FROM halaqah_groups h WHERE h.id = halaqah_members.halaqah_group_id AND (h.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            )
            WITH CHECK (
                EXISTS (SELECT 1 FROM halaqah_groups h WHERE h.id = halaqah_members.halaqah_group_id AND (h.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            );
    END IF;
END $$;

-- 3.9 exam_question_mappings (via exam_id -> exams.tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exam_question_mappings') THEN
        ALTER TABLE exam_question_mappings ENABLE ROW LEVEL SECURITY;
        ALTER TABLE exam_question_mappings FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS child_exam_question_mappings_isolation ON exam_question_mappings;
        CREATE POLICY child_exam_question_mappings_isolation ON exam_question_mappings
            FOR ALL
            USING (
                EXISTS (SELECT 1 FROM exams ex WHERE ex.id = exam_question_mappings.exam_id AND (ex.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            )
            WITH CHECK (
                EXISTS (SELECT 1 FROM exams ex WHERE ex.id = exam_question_mappings.exam_id AND (ex.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            );
    END IF;
END $$;

-- 3.10 student_exam_answers (via session_id -> student_exam_sessions.tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_exam_answers') THEN
        ALTER TABLE student_exam_answers ENABLE ROW LEVEL SECURITY;
        ALTER TABLE student_exam_answers FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS child_student_exam_answers_isolation ON student_exam_answers;
        CREATE POLICY child_student_exam_answers_isolation ON student_exam_answers
            FOR ALL
            USING (
                EXISTS (SELECT 1 FROM student_exam_sessions s WHERE s.id = student_exam_answers.session_id AND (s.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            )
            WITH CHECK (
                EXISTS (SELECT 1 FROM student_exam_sessions s WHERE s.id = student_exam_answers.session_id AND (s.tenant_id = current_tenant_id() OR is_super_admin_bypass()))
            );
    END IF;
END $$;

-- ==============================================================================
-- 4. MASTER REFERENCE TABLE (permissions)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'permissions') THEN
        ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE permissions FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS permissions_read_only_policy ON permissions;
        CREATE POLICY permissions_read_only_policy ON permissions
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- ==============================================================================
-- 5. LEAST-PRIVILEGE ROLE ARCHITECTURE & SEPARATION OF RESPONSIBILITY
-- ==============================================================================

-- 5.1 Administrative Group Role (for cross-tenant emergency audit access)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'edusaas_admin_role') THEN
        CREATE ROLE edusaas_admin_role NOINHERIT;
    END IF;
END $$;

-- 5.2 Administrative Database User (Dedicated login for Super Admin operations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'edusaas_admin_user') THEN
        CREATE ROLE edusaas_admin_user WITH 
            LOGIN 
            PASSWORD 'edusaas_admin_secure_secret_2026' 
            IN ROLE edusaas_admin_role
            NOSUPERUSER 
            NOBYPASSRLS 
            NOCREATEDB 
            NOCREATEROLE;
    END IF;
END $$;

-- 5.3 Runtime Application Role (Unprivileged, Zero DDL, Zero Truncate, Zero Bypass)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'edusaas_app_user') THEN
        CREATE ROLE edusaas_app_user WITH 
            LOGIN 
            PASSWORD 'edusaas_secure_app_password_2026' 
            NOSUPERUSER 
            NOBYPASSRLS 
            NOCREATEDB 
            NOCREATEROLE
            NOINHERIT;
    END IF;
END $$;

-- 5.4 Revoke Administrative Role from Application User
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM edusaas_app_user;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM edusaas_app_user;
REVOKE ALL ON SCHEMA public FROM edusaas_app_user;
REVOKE edusaas_admin_role FROM edusaas_app_user;

-- 5.5 Grant Strictly Granular CRUD Privileges (SELECT, INSERT, UPDATE, DELETE only)
-- Explicitly omits: TRUNCATE, REFERENCES, TRIGGER, CREATE, ALTER, DROP
GRANT USAGE ON SCHEMA public TO edusaas_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO edusaas_app_user;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO edusaas_app_user;

-- Explicitly revoke TRUNCATE on all tables
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM edusaas_app_user;

-- Permissions master table is strictly read-only for runtime application role
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'permissions') THEN
        REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON permissions FROM edusaas_app_user;
        GRANT SELECT ON permissions TO edusaas_app_user;
    END IF;
END $$;

-- Grant cross-tenant audit log write privilege
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cross_tenant_access_logs') THEN
        GRANT SELECT, INSERT ON cross_tenant_access_logs TO edusaas_app_user;
        REVOKE UPDATE, DELETE, TRUNCATE ON cross_tenant_access_logs FROM edusaas_app_user;
    END IF;
END $$;

-- Ensure future tables created by migration role also follow least privilege
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO edusaas_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO edusaas_app_user;

-- 5.6 Privileges for Administrative Role
GRANT USAGE ON SCHEMA public TO edusaas_admin_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO edusaas_admin_role;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO edusaas_admin_role;
