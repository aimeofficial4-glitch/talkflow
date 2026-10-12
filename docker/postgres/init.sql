-- ============================================================================
-- TalkFlow Database Initialization Script
-- Executed on fresh PostgreSQL container startup (/docker-entrypoint-initdb.d)
-- ============================================================================

-- Ensure standard extensions exist for UUID generation and cryptographic hashing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set standard timezone to UTC for cross-border consistency
ALTER DATABASE talkflow SET timezone TO 'UTC';

-- Create dedicated schema for application tables
CREATE SCHEMA IF NOT EXISTS app;

-- Grant usage to public/app users
GRANT ALL ON SCHEMA app TO talkflow_admin;

COMMENT ON SCHEMA app IS 'TalkFlow core business domain schema (users, messages, friendships, sessions)';
