-- ─────────────────────────────────────────────────────────
-- Migration 001 — Core tables
-- Run order: this file → 002 → 003 → 004
-- ─────────────────────────────────────────────────────────

-- uuid-ossp is needed for gen_random_uuid() fallback on older PG versions.
-- On PG 13+ gen_random_uuid() is built-in, but the extension is harmless.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Wiki pages ────────────────────────────────────────────
-- Populated entirely by the GitHub Actions ingestion pipeline.
-- The app reads from this table but never writes to it directly.
CREATE TABLE IF NOT EXISTS wiki_pages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        UNIQUE NOT NULL,       -- e.g. "topics/ai-fundamentals"
  title           TEXT        NOT NULL,
  file_path       TEXT        NOT NULL,              -- relative path in /content
  content_md      TEXT,                              -- cached raw markdown (optional)
  frontmatter     JSONB       NOT NULL DEFAULT '{}', -- parsed YAML frontmatter
  word_count      INT,
  last_synced_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wiki_pages_slug_idx ON wiki_pages (slug);

COMMENT ON TABLE  wiki_pages                IS 'Metadata for each markdown wiki page, synced from GitHub.';
COMMENT ON COLUMN wiki_pages.slug           IS 'URL-safe path used in /wiki/[...slug] route.';
COMMENT ON COLUMN wiki_pages.frontmatter    IS 'Parsed YAML frontmatter: title, tags, date, author, etc.';
COMMENT ON COLUMN wiki_pages.last_synced_at IS 'Timestamp of the last successful ingestion run for this page.';

-- ── User profiles ─────────────────────────────────────────
-- One row per authenticated user, created automatically via trigger (migration 004).
-- Extends auth.users with public-facing display data.
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Public user profile — extends auth.users. Created automatically on signup.';

-- ── Chat sessions ─────────────────────────────────────────
-- A session groups related messages. Each session has a title
-- (auto-generated from the first message in Phase 2).
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT  NOT NULL DEFAULT 'New Chat',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx ON chat_sessions (user_id);
CREATE INDEX IF NOT EXISTS chat_sessions_updated_at_idx ON chat_sessions (user_id, updated_at DESC);

COMMENT ON TABLE chat_sessions IS 'A conversation thread between a user and the AI assistant.';

-- ── Chat messages ─────────────────────────────────────────
-- Stores every turn (user + assistant). The sources column holds
-- the wiki page slugs cited by the assistant in its response.
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID  NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        TEXT  NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT  NOT NULL,
  sources     JSONB NOT NULL DEFAULT '[]',  -- array of { slug, title, excerpt }
  tokens_used INT,                           -- total tokens consumed for this turn
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages (session_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages (session_id, created_at ASC);

COMMENT ON TABLE  chat_messages         IS 'Individual messages within a chat session.';
COMMENT ON COLUMN chat_messages.sources IS 'JSON array: [{ slug, title, excerpt, similarity }]';
COMMENT ON COLUMN chat_messages.tokens_used IS 'Combined prompt + completion tokens for cost tracking.';
