-- =============================================================================
-- GFF ERP Enterprise - Initial Database Setup
-- =============================================================================
-- Description: Creates the application database, user, extensions, and
--              initial schema configuration
-- Version: 1.0
-- PostgreSQL Version: 16+
-- Usage: psql -U postgres -f init.sql
-- =============================================================================

-- =============================================================================
-- Configuration
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on

\echo '=========================================================================='
\echo '  GFF ERP Enterprise - Database Initialization'
\echo '=========================================================================='
\echo ''

-- =============================================================================
-- Step 1: Create Database
-- =============================================================================
\echo 'Step 1/5: Creating database...'

-- Drop database if it exists (use with caution in production!)
-- DROP DATABASE IF EXISTS gff_erp_db;

-- Create database with UTF8 encoding
CREATE DATABASE gff_erp_db
    WITH
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0
    CONNECTION LIMIT = 200;

\echo '  Database "gff_erp_db" created successfully.'

-- =============================================================================
-- Step 2: Create Application User
-- =============================================================================
\echo 'Step 2/5: Creating application user...'

-- Drop user if exists
-- DROP USER IF EXISTS gff_erp_user;

-- Create user with secure password
-- NOTE: Change this password before running in production!
CREATE USER gff_erp_user WITH
    LOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOREPLICATION
    INHERIT
    PASSWORD 'ChangeThisPasswordInProduction!2025';

\echo '  User "gff_erp_user" created successfully.'

-- =============================================================================
-- Step 3: Grant Privileges
-- =============================================================================
\echo 'Step 3/5: Granting privileges...'

-- Grant database-level privileges
GRANT CONNECT, TEMPORARY ON DATABASE gff_erp_db TO gff_erp_user;

-- Connect to the database to set schema-level privileges
\c gff_erp_db

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO gff_erp_user;

-- Grant table privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gff_erp_user;

-- Grant sequence privileges
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gff_erp_user;

-- Grant function privileges
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO gff_erp_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gff_erp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gff_erp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO gff_erp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TYPES TO gff_erp_user;

\echo '  Privileges granted to "gff_erp_user".'

-- =============================================================================
-- Step 4: Install Extensions
-- =============================================================================
\echo 'Step 4/5: Installing extensions...'

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\echo '  Extension "uuid-ossp" installed.'

-- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
\echo '  Extension "pgcrypto" installed.'

-- Full-text search with trigram matching
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
\echo '  Extension "pg_trgm" installed.'

-- Case-insensitive text (useful for Arabic/English search)
CREATE EXTENSION IF NOT EXISTS "citext";
\echo '  Extension "citext" installed.'

-- Table partitioning support
CREATE EXTENSION IF NOT EXISTS "pg_partman";
\echo '  Extension "pg_partman" installed.'

\echo '  All extensions installed successfully.'

-- =============================================================================
-- Step 5: Database Configuration
-- =============================================================================
\echo 'Step 5/5: Configuring database...'

-- Set timezone to UTC (application handles localization)
ALTER DATABASE gff_erp_db SET timezone TO 'UTC';

-- Enable statement statistics (optional - for performance monitoring)
-- CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Configure session settings for the application user
ALTER ROLE gff_erp_user SET client_encoding TO 'UTF8';
ALTER ROLE gff_erp_user SET standard_conforming_strings TO 'on';
ALTER ROLE gff_erp_user SET client_min_messages TO 'warning';

-- =============================================================================
-- Create helper functions
-- =============================================================================

-- Function to update the updatedAt timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

\echo '  Helper function "update_updated_at_column" created.'

-- Function to generate slug from Arabic/English text
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
BEGIN
    slug := lower(input_text);
    slug := regexp_replace(slug, '[^a-z0-9\u0600-\u06FF\s-]', '', 'g');
    slug := regexp_replace(slug, '\s+', '-', 'g');
    slug := regexp_replace(slug, '-+', '-', 'g');
    slug := trim(both '-' from slug);
    RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

\echo '  Helper function "generate_slug" created.'

-- =============================================================================
-- Create schema for audit logs (separate from application tables)
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS audit;
GRANT USAGE ON SCHEMA audit TO gff_erp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON TABLES TO gff_erp_user;

\echo '  Audit schema created.'

-- =============================================================================
-- Create schema for system configuration
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS sysconfig;
GRANT USAGE ON SCHEMA sysconfig TO gff_erp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA sysconfig GRANT ALL ON TABLES TO gff_erp_user;

\echo '  System config schema created.'

-- =============================================================================
-- Create tablespace for large tables (optional, requires additional disk)
-- =============================================================================
-- Uncomment and configure if you have a separate fast disk:
-- CREATE TABLESPACE gff_erp_index OWNER postgres LOCATION '/fastdisk/pg_indexes';
-- CREATE TABLESPACE gff_erp_data OWNER postgres LOCATION '/fastdisk/pg_data';

-- =============================================================================
-- Grant execute on helper functions
-- =============================================================================
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO gff_erp_user;
GRANT EXECUTE ON FUNCTION generate_slug(TEXT) TO gff_erp_user;

-- =============================================================================
-- Verify Setup
-- =============================================================================
\echo ''
\echo '=========================================================================='
\echo '  Verification'
\echo '=========================================================================='

-- Check database
\echo ''
\echo 'Databases:'
SELECT datname, encoding, datcollate, datctype
FROM pg_database
WHERE datname = 'gff_erp_db';

-- Check user
\echo ''
\echo 'Users:'
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolinherit, rolcanlogin
FROM pg_roles
WHERE rolname = 'gff_erp_user';

-- Check extensions
\echo ''
\echo 'Extensions:'
SELECT extname, extversion
FROM pg_extension
WHERE extnamespace = 'public'::regnamespace;

\echo ''
\echo '=========================================================================='
\echo '  Database initialization complete!'
\echo '=========================================================================='
\echo ''
\echo 'Database: gff_erp_db'
\echo 'User:     gff_erp_user'
\echo ''
\echo 'IMPORTANT: Change the default password before production deployment!'
\echo ''
\echo 'Next steps:'
\echo '  1. Update the DATABASE_URL in your .env file'
\echo '  2. Run Prisma migrations: npx prisma migrate deploy'
\echo '  3. Generate Prisma client: npx prisma generate'
\echo '  4. Seed the database: npx prisma db seed'
\echo ''

-- =============================================================================
-- End of Initialization Script
-- =============================================================================
