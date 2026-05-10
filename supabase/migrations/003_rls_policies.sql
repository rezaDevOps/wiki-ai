-- ─────────────────────────────────────────────────────────
-- Migration 003 — Row Level Security policies
-- Requires: migrations 001 + 002
-- ─────────────────────────────────────────────────────────

-- ── Enable RLS on all tables ──────────────────────────────
ALTER TABLE wiki_pages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages    ENABLE ROW LEVEL SECURITY;

-- ── wiki_pages ────────────────────────────────────────────
-- The wiki is a public knowledge base — anyone (including anon) can read.
-- Only the service role (ingestion pipeline) can write.

CREATE POLICY "wiki_pages_public_select"
  ON wiki_pages FOR SELECT
  USING (true);

-- service_role bypasses RLS by default, but being explicit documents intent.
CREATE POLICY "wiki_pages_service_all"
  ON wiki_pages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── document_chunks ───────────────────────────────────────
-- Chunks are also public — the RAG query runs server-side with the anon key.

CREATE POLICY "document_chunks_public_select"
  ON document_chunks FOR SELECT
  USING (true);

CREATE POLICY "document_chunks_service_all"
  ON document_chunks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── profiles ──────────────────────────────────────────────
-- Users can only see and modify their own profile row.
-- The trigger in migration 004 inserts the initial row (SECURITY DEFINER).

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── chat_sessions ─────────────────────────────────────────
-- Users can fully manage their own chat sessions.

CREATE POLICY "chat_sessions_select_own"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "chat_sessions_insert_own"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_sessions_update_own"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_sessions_delete_own"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ── chat_messages ─────────────────────────────────────────
-- Access is gated through session ownership — no direct user_id column here.
-- The EXISTS subquery enforces ownership transitively.
-- This pattern is safe and performs well with the session_id index.

CREATE POLICY "chat_messages_select_own"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions cs
      WHERE cs.id = chat_messages.session_id
        AND cs.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_insert_own"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions cs
      WHERE cs.id = chat_messages.session_id
        AND cs.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_delete_own"
  ON chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions cs
      WHERE cs.id = chat_messages.session_id
        AND cs.user_id = auth.uid()
    )
  );
