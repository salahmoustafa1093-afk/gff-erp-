-- =============================================================================
-- GFF ERP Enterprise - PostgreSQL Roles and Security Configuration
-- =============================================================================
-- Description: Creates role-based access control for PostgreSQL
--              Defines application, read-only, and admin roles
-- Version: 1.0
-- PostgreSQL Version: 16+
-- Usage: psql -U postgres -d gff_erp_db -f roles.sql
-- =============================================================================

\set ON_ERROR_STOP on

\echo '=========================================================================='
\echo '  GFF ERP Enterprise - PostgreSQL Roles Configuration'
\echo '=========================================================================='

-- =============================================================================
-- Connect to application database
-- =============================================================================
\c gff_erp_db

-- =============================================================================
-- Step 1: Create Application Role
-- =============================================================================
\echo ''
\echo 'Step 1/4: Creating application role...'

-- Drop role if exists (use with caution)
-- DROP ROLE IF EXISTS gff_erp_app;

-- Create application role
-- This role has full CRUD access for the application
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gff_erp_app') THEN
        CREATE ROLE gff_erp_app WITH
            NOLOGIN
            NOSUPERUSER
            INHERIT
            NOCREATEDB
            NOCREATEROLE
            NOREPLICATION;
        RAISE NOTICE 'Role "gff_erp_app" created';
    ELSE
        RAISE NOTICE 'Role "gff_erp_app" already exists';
    END IF;
END
$$;

-- Grant application role to application user
GRANT gff_erp_app TO gff_erp_user;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO gff_erp_app;
GRANT USAGE ON SCHEMA audit TO gff_erp_app;

-- Grant table privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gff_erp_app;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA audit TO gff_erp_app;

-- Grant sequence privileges
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO gff_erp_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA audit TO gff_erp_app;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gff_erp_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO gff_erp_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO gff_erp_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT SELECT, INSERT ON TABLES TO gff_erp_app;

\echo '  Role "gff_erp_app" configured with full CRUD access.'

-- =============================================================================
-- Step 2: Create Read-Only Role (for reporting and analytics)
-- =============================================================================
\echo ''
\echo 'Step 2/4: Creating read-only role...'

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gff_erp_readonly') THEN
        CREATE ROLE gff_erp_readonly WITH
            NOLOGIN
            NOSUPERUSER
            INHERIT
            NOCREATEDB
            NOCREATEROLE
            NOREPLICATION;
        RAISE NOTICE 'Role "gff_erp_readonly" created';
    ELSE
        RAISE NOTICE 'Role "gff_erp_readonly" already exists';
    END IF;
END
$$;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO gff_erp_readonly;
GRANT USAGE ON SCHEMA audit TO gff_erp_readonly;

-- Grant read-only table privileges
GRANT SELECT ON ALL TABLES IN SCHEMA public TO gff_erp_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO gff_erp_readonly;

-- Grant sequence read access
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO gff_erp_readonly;

-- Set default privileges for read-only
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO gff_erp_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT SELECT ON TABLES TO gff_erp_readonly;

\echo '  Role "gff_erp_readonly" configured with read-only access.'

-- =============================================================================
-- Step 3: Create Admin/Migration Role
-- =============================================================================
\echo ''
\echo 'Step 3/4: Creating admin role for migrations...'

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gff_erp_admin') THEN
        CREATE ROLE gff_erp_admin WITH
            NOLOGIN
            NOSUPERUSER
            INHERIT
            CREATEDB
            NOCREATEROLE
            NOREPLICATION;
        RAISE NOTICE 'Role "gff_erp_admin" created';
    ELSE
        RAISE NOTICE 'Role "gff_erp_admin" already exists';
    END IF;
END
$$;

-- Grant admin role to application user
GRANT gff_erp_admin TO gff_erp_user;

-- Grant comprehensive access
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gff_erp_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO gff_erp_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gff_erp_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO gff_erp_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO gff_erp_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA audit TO gff_erp_admin;

-- Schema creation privileges
GRANT CREATE ON SCHEMA public TO gff_erp_admin;
GRANT CREATE ON SCHEMA audit TO gff_erp_admin;

-- Default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gff_erp_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gff_erp_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO gff_erp_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON TABLES TO gff_erp_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON SEQUENCES TO gff_erp_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON FUNCTIONS TO gff_erp_admin;

\echo '  Role "gff_erp_admin" configured with migration access.'

-- =============================================================================
-- Step 4: Create Reporting User (for external BI tools)
-- =============================================================================
\echo ''
\echo 'Step 4/4: Creating reporting user...'

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gff_erp_reporter') THEN
        CREATE USER gff_erp_reporter WITH
            LOGIN
            NOSUPERUSER
            INHERIT
            NOCREATEDB
            NOCREATEROLE
            NOREPLICATION
            PASSWORD 'ChangeReporterPassword!2025';
        RAISE NOTICE 'User "gff_erp_reporter" created';
    ELSE
        RAISE NOTICE 'User "gff_erp_reporter" already exists';
    END IF;
END
$$;

-- Grant read-only role to reporter user
GRANT gff_erp_readonly TO gff_erp_reporter;

-- Grant connection privileges
GRANT CONNECT ON DATABASE gff_erp_db TO gff_erp_reporter;

-- Set session limits for reporting user
ALTER ROLE gff_erp_reporter SET statement_timeout = '60s';
ALTER ROLE gff_erp_reporter SET lock_timeout = '10s';
ALTER ROLE gff_erp_reporter SET idle_in_transaction_session_timeout = '5min';

\echo '  User "gff_erp_reporter" configured for reporting access.'

-- =============================================================================
-- Create Row Level Security (RLS) Policies for Branch Isolation
-- =============================================================================
\echo ''
\echo 'Configuring Row Level Security policies...'

-- Enable RLS on key tables (commented out - enable after testing)
-- ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policy function for branch isolation
CREATE OR REPLACE FUNCTION current_branch_id()
RETURNS TEXT AS $$
BEGIN
    -- Read branch ID from session variable set by application
    RETURN current_setting('app.current_branch_id', true);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION current_branch_id() TO gff_erp_app;
GRANT EXECUTE ON FUNCTION current_branch_id() TO gff_erp_readonly;

\echo '  RLS helper function created.'

-- Example RLS policy (enable after testing)
-- CREATE POLICY branch_isolation_policy ON sales_orders
--     USING (branchId = current_branch_id()::uuid);

-- =============================================================================
-- Create Connection Limits
-- =============================================================================
\echo ''
\echo 'Setting connection limits...'

-- Limit connections for reporting user (prevents resource exhaustion)
ALTER USER gff_erp_reporter WITH CONNECTION LIMIT 10;

-- Limit connections for application user
ALTER USER gff_erp_user WITH CONNECTION LIMIT 50;

\echo '  Connection limits configured.'

-- =============================================================================
-- Security Policies
-- =============================================================================
\echo ''
\echo 'Configuring security policies...'

-- Revoke public schema creation from public
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Revoke all on public schema from public
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;

-- Ensure application user can only access via role
ALTER USER gff_erp_user SET search_path = 'public';
ALTER USER gff_erp_reporter SET search_path = 'public';

\echo '  Security policies configured.'

-- =============================================================================
-- Verification
-- =============================================================================
\echo ''
\echo '=========================================================================='
\echo '  Role Verification'
\echo '=========================================================================='
\echo ''

-- List all roles
SELECT rolname,
       rolsuper,
       rolinherit,
       rolcreaterole,
       rolcreatedb,
       rolcanlogin,
       rolconnlimit,
       CASE WHEN rolvaliduntil IS NOT NULL THEN 'EXPIRES' ELSE 'NEVER' END as password_expiry
FROM pg_roles
WHERE rolname LIKE 'gff_erp%'
ORDER BY rolname;

\echo ''
\echo '=========================================================================='
\echo '  Role configuration complete!'
\echo '=========================================================================='
\echo ''
\echo 'Roles created:'
\echo '  - gff_erp_app      : Application role (full CRUD)'
\echo '  - gff_erp_readonly : Read-only role (reporting)'
\echo '  - gff_erp_admin    : Admin role (migrations, DDL)'
\echo ''
\echo 'Users created:'
\echo '  - gff_erp_user     : Application database user'
\echo '  - gff_erp_reporter : Reporting user (read-only)'
\echo ''
\echo 'IMPORTANT: Change default passwords before production deployment!'
\echo ''

-- =============================================================================
-- End of Roles Configuration Script
-- =============================================================================
