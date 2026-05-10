-- ─────────────────────────────────────────────────────────
-- Migration 005 — Switch embeddings from OpenAI (1536 dims)
--                 to Voyage AI voyage-3-lite (512 dims)
--
-- Embeddings are NOT portable across models, so we drop the
-- column and recreate it at the new dimension. Any existing
-- vectors will be NULL and must be regenerated via `npm run ingest:all`.
-- ─────────────────────────────────────────────────────────

-- 1. Drop the old HNSW index (it's tied to the column type/size)
DROP INDEX IF EXISTS document_chunks_embedding_hnsw_idx;

-- 2. Drop old column and add new one at 512 dims
ALTER TABLE document_chunks DROP COLUMN IF EXISTS embedding;
ALTER TABLE document_chunks ADD COLUMN embedding VECTOR(512);

-- 3. Recreate HNSW index for the new dimension
CREATE INDEX document_chunks_embedding_hnsw_idx
  ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Replace match_documents function with 512-dim signature
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding  VECTOR(512),
  match_threshold  FLOAT   DEFAULT 0.5,
  match_count      INT     DEFAULT 6
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

COMMENT ON COLUMN document_chunks.embedding IS '512-dim vector from Voyage AI voyage-3-lite.';
COMMENT ON FUNCTION match_documents IS
  'Cosine similarity search over document_chunks. Used by the RAG chat pipeline.';
