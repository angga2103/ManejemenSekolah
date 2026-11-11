-- ==============================================================================
-- POSTGRESQL INITIALIZATION & MULTI-TENANT ROW LEVEL SECURITY (RLS) FOUNDATION
-- ==============================================================================

-- Enable UUID & Cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to retrieve current tenant ID from database session context
-- Application sets this on every transaction using: SET LOCAL app.current_tenant_id = 'tenant-uuid';
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to retrieve current user ID from database session context
-- Application sets this using: SET LOCAL app.current_user_id = 'user-uuid';
CREATE OR REPLACE FUNCTION current_app_user_id() RETURNS uuid AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Bypass flag for Super Admin operations or administrative jobs
CREATE OR REPLACE FUNCTION is_super_admin_bypass() RETURNS boolean AS $$
BEGIN
    RETURN COALESCE(NULLIF(current_setting('app.is_super_admin', true), '')::boolean, false);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
