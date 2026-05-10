-- ─────────────────────────────────────────────────────────
-- Migration 002 — pgvector: document chunks + similarity search
-- Requires: migration 001 (wiki_pages must exist)
-- ─────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS vector;

-- ── Document chunks ───────────────────────────────────────
-- Each wiki page is split into overlapping chunks during ingestion.
-- The embedding column stores a 1536-dim vector (OpenAI text-embedding-3-small).
-- On model change, drop and recreate this table — embeddings are not portable
-- across embedding models or dimension counts.
CREATE TABLE IF NOT EXISTS document_chunks (
  id           UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id      UUID     NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,

  -- slug is denormalized here to avoid a JOIN on every RAG query.
  -- It is always identical to the parent wiki_page.slug.
  slug         TEXT     NOT NULL,

  chunk_index  INT      NOT NULL,                    -- 0-based position within the page
  content      TEXT     NOT NULL,                    -- raw text of this chunk
  token_count  INT,                                  -- approximate token count
  embedding    VECTOR(1536),                         -- null until embeddings are generated
  metadata     JSONB    NOT NULL DEFAULT '{}',       -- heading, section_path, page_title

  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (slug, chunk_index)
);

-- ── HNSW index for vector search ─────────────────────────
-- HNSW (Hierarchical Navigable Small World) is preferred over IVFFlat for:
--   - Tables under ~1M rows (no training/vacuum step required)
--   - Better recall at low query latency
--   - Stable performance as data grows incrementally
--
-- Parameters:
--   m = 16             — bidirectional links per node; higher = better recall + more memory
--   ef_construction=64 — candidate list size at build time; higher = better recall + slower build
--
-- To tune: increase ef_search at query time: SET hnsw.ef_search = 100;
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx
  ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- B-tree index for filtering by slug (e.g. search within a single page)
CREATE INDEX IF NOT EXISTS document_chunks_slug_idx ON document_chunks (slug);
CREATE INDEX IF NOT EXISTS document_chunks_page_id_idx ON document_chunks (page_id);

COMMENT ON TABLE  document_chunks             IS 'Chunked wiki content with embeddings for RAG.';
COMMENT ON COLUMN document_chunks.metadata    IS 'JSON: { heading, section_path: string[], page_title }.';
COMMENT ON COLUMN document_chunks.embedding   IS '1536-dim vector from OpenAI text-embedding-3-small.';

-- ── Similarity search function ────────────────────────────
-- Called by /api/chat to retrieve the most relevant chunks for a query.
-- Returns up to match_count chunks with similarity > match_threshold,
-- sorted by cosine similarity (highest first).
--
-- Usage from TypeScript:
--   const { data } = await supabase.rpc('match_documents', {
--     query_embedding: embeddingArray,
--     match_threshold: 0.7,
--     match_count: 5,
--   })
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding  VECTOR(1536),
  match_threshold  FLOAT    DEFAULT 0.7,
  match_count      INT      DEFAULT 5
)
RETURNS TABLE (
  id          UUID,
  slug        TEXT,
  content     TEXT,
  metadata    JSONB,
  similarity  FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    dc.id,
    dc.slug,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION match_documents IS
  'Cosine similarity search over document_chunks. Used by the RAG chat pipeline.';
