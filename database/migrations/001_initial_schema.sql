-- ============================================================================
-- TalkFlow Production Database Migration 001
-- PostgreSQL 16 Schema Definition for Enterprise Scale
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS app;

-- 1. Users table (Complete 9 Categories Profile Specification)
CREATE TABLE IF NOT EXISTS app.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(64) NOT NULL,
    date_of_birth DATE NOT NULL,
    avatar_url TEXT,
    bio VARCHAR(250),
    preferred_language VARCHAR(10) DEFAULT 'en' NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
    last_active_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,

    -- 2. Contact & Verification (18+ only, guardian for minor)
    email_verified_at TIMESTAMPTZ,
    phone_number VARCHAR(30),
    phone_verified_at TIMESTAMPTZ,
    national_id_number TEXT, -- Encrypted at rest
    id_type VARCHAR(30), -- 'passport' | 'national_id' | 'drivers_license'
    national_id_verified_at TIMESTAMPTZ,
    verification_expiry TIMESTAMPTZ,
    is_adult BOOLEAN DEFAULT FALSE NOT NULL, -- Server-enforced calculation: age >= 18
    guardian_contact_email VARCHAR(255),

    -- 3. Personal & Discovery Details
    occupation VARCHAR(100),
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    interests JSONB DEFAULT '[]'::jsonb NOT NULL,
    gender VARCHAR(30),
    relationship_status VARCHAR(40),

    -- 4. Privacy & Visibility Controls
    location_visibility VARCHAR(20) DEFAULT 'public' NOT NULL, -- 'public' | 'friends' | 'hidden'
    occupation_visibility VARCHAR(20) DEFAULT 'public' NOT NULL,
    who_can_find_me VARCHAR(30) DEFAULT 'everyone' NOT NULL, -- 'everyone' | 'friends_of_friends' | 'nobody'
    who_can_message_me VARCHAR(20) DEFAULT 'everyone' NOT NULL, -- 'everyone' | 'friends'
    who_can_see_reels VARCHAR(20) DEFAULT 'public' NOT NULL, -- 'public' | 'friends'

    -- 5. Customization
    theme_color VARCHAR(16) DEFAULT '#6366f1' NOT NULL,
    profile_banner_url TEXT,
    pinned_post_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
    social_links JSONB DEFAULT '{}'::jsonb NOT NULL,

    -- 7. System / Moderation Fields (Admin & Compliance)
    role VARCHAR(20) DEFAULT 'user' NOT NULL,
    compliance_role BOOLEAN DEFAULT FALSE NOT NULL,
    account_status VARCHAR(20) DEFAULT 'active' NOT NULL, -- 'active' | 'blocked' | 'suspended'
    blocked_reason TEXT,
    blocked_by_admin_id UUID,
    blocked_at TIMESTAMPTZ,
    report_count INT DEFAULT 0 NOT NULL,
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,

    -- 8. Additional Fields
    account_deactivated_at TIMESTAMPTZ,
    deletion_requested_at TIMESTAMPTZ,
    data_export_requested_at TIMESTAMPTZ,
    profile_completeness_pct INT DEFAULT 0 NOT NULL,
    tos_accepted_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    tos_version VARCHAR(20) DEFAULT '2026.1' NOT NULL,
    privacy_policy_accepted_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    privacy_policy_version VARCHAR(20) DEFAULT '2026.1' NOT NULL,

    -- 9. Commonly Missed Fields
    account_recovery_path JSONB DEFAULT '{"method":"backup_email","is_configured":false}'::jsonb NOT NULL,
    username_history JSONB DEFAULT '[]'::jsonb NOT NULL,
    merged_account_of JSONB DEFAULT '[]'::jsonb NOT NULL,
    correction_requested_at TIMESTAMPTZ,
    inactive_account_policy VARCHAR(30) DEFAULT 'notify_after_90_days' NOT NULL,
    legal_hold BOOLEAN DEFAULT FALSE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON app.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON app.users(email);

-- 2. Devices and Sessions (Multi-device tracking & remote logout)
CREATE TABLE IF NOT EXISTS app.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(30) DEFAULT 'web' NOT NULL, -- 'web' | 'mobile_ios' | 'mobile_android' | 'desktop'
    refresh_token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_active_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON app.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_refresh_token ON app.devices(refresh_token_hash);

-- 3. Friendships table
CREATE TABLE IF NOT EXISTS app.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending' | 'accepted' | 'declined' | 'blocked'
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    CONSTRAINT chk_different_users CHECK (user_id != friend_id),
    CONSTRAINT uq_friendship_pair UNIQUE (user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON app.friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_status ON app.friendships(friend_id, status);

-- 4. User Blocks
CREATE TABLE IF NOT EXISTS app.blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    CONSTRAINT uq_block_pair UNIQUE (blocker_id, blocked_id)
);

-- 5. Abuse Reports
CREATE TABLE IF NOT EXISTS app.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

-- 6. Conversations (1-to-1 or Group)
CREATE TABLE IF NOT EXISTS app.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) DEFAULT 'direct' NOT NULL, -- 'direct' | 'group'
    name VARCHAR(100),
    avatar_url TEXT,
    current_seq BIGINT DEFAULT 0 NOT NULL, -- Monotonically increasing per-conversation sequence
    created_by UUID REFERENCES app.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

-- 7. Conversation Members
CREATE TABLE IF NOT EXISTS app.conversation_members (
    conversation_id UUID NOT NULL REFERENCES app.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' NOT NULL, -- 'admin' | 'member'
    last_read_seq BIGINT DEFAULT 0 NOT NULL,
    last_delivered_seq BIGINT DEFAULT 0 NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON app.conversation_members(user_id);

-- 8. Messages (Immutable audit log ordered by sequence number)
CREATE TABLE IF NOT EXISTS app.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_msg_id VARCHAR(64) NOT NULL,
    conversation_id UUID NOT NULL REFERENCES app.conversations(id) ON DELETE CASCADE,
    seq BIGINT NOT NULL,
    sender_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_client_msg_id UNIQUE (conversation_id, client_msg_id),
    CONSTRAINT uq_conversation_seq UNIQUE (conversation_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_seq ON app.messages(conversation_id, seq ASC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON app.messages(conversation_id, created_at DESC);

-- 9. Message Reactions
CREATE TABLE IF NOT EXISTS app.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES app.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    emoji VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    CONSTRAINT uq_message_user_reaction UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON app.reactions(message_id);

-- 10. Message Attachments
CREATE TABLE IF NOT EXISTS app.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES app.messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

-- 11. Message Translation Cache (Store original untouched, cache results)
CREATE TABLE IF NOT EXISTS app.translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES app.messages(id) ON DELETE CASCADE,
    target_lang VARCHAR(10) NOT NULL,
    translated_text TEXT NOT NULL,
    provider VARCHAR(50) DEFAULT 'gemini-flash' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    CONSTRAINT uq_msg_target_lang UNIQUE (message_id, target_lang)
);

CREATE INDEX IF NOT EXISTS idx_translations_msg_lang ON app.translations(message_id, target_lang);

-- 12. User Posts & Reels (Category 6: Content)
CREATE TABLE IF NOT EXISTS app.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'photo' NOT NULL, -- 'photo' | 'reel'
    media_url TEXT NOT NULL,
    caption TEXT,
    visibility VARCHAR(20) DEFAULT 'public' NOT NULL, -- 'public' | 'friends'
    likes_count INT DEFAULT 0 NOT NULL,
    comments_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT clock_timestamp() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON app.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON app.posts(created_at DESC);

