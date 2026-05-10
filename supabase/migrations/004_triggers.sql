-- ─────────────────────────────────────────────────────────
-- Migration 004 — Triggers
-- Requires: migrations 001–003
-- ─────────────────────────────────────────────────────────

-- ── updated_at auto-updater ───────────────────────────────
-- A single reusable trigger function used on every table that has updated_at.
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER wiki_pages_updated_at
  BEFORE UPDATE ON wiki_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Bump chat_sessions.updated_at on new message ─────────
-- When a new message is added to a session, bubble the timestamp up so
-- the "most recently active session" sort order stays correct.
CREATE OR REPLACE FUNCTION bump_session_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE chat_sessions
  SET updated_at = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER chat_messages_bump_session
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION bump_session_updated_at();

-- ── Auto-create profile on user signup ───────────────────
-- Fires immediately after a new row is inserted into auth.users.
-- SECURITY DEFINER: runs with the function owner's privileges so it can
-- INSERT into public.profiles from the auth schema context.
-- SET search_path = public: prevents search_path injection attacks.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)   -- final fallback: username from email
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;        -- idempotent — safe to re-run migration
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
