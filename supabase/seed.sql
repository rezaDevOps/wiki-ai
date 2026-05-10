-- ─────────────────────────────────────────────────────────
-- Development seed data
-- Run AFTER all migrations.
-- Usage: psql $DATABASE_URL < supabase/seed.sql
--   or via Supabase CLI: supabase db reset  (runs migrations + seed)
-- ─────────────────────────────────────────────────────────

-- Sample wiki_pages
-- In production these are populated by the GitHub Actions ingestion pipeline.
-- Here we seed a small set for local development and testing.
INSERT INTO wiki_pages (slug, title, file_path, frontmatter, word_count)
VALUES
  (
    'getting-started/overview',
    'Getting Started',
    'content/getting-started/overview.md',
    '{"tags": ["getting-started", "guide"], "date": "2024-01-01", "description": "A guide to using Wiki AI."}'::jsonb,
    120
  ),
  (
    'topics/ai-fundamentals',
    'AI Fundamentals',
    'content/topics/ai-fundamentals.md',
    '{"tags": ["ai", "machine-learning", "fundamentals"], "date": "2024-01-01", "description": "Core AI and ML concepts."}'::jsonb,
    280
  )
ON CONFLICT (slug) DO NOTHING;
