import { createAdminClient } from "../src/lib/supabase/admin";
import type { WikiPage } from "../src/types/wiki";
import type { Json } from "../src/types/database";
import type { Chunk } from "./chunk";

// ── Page upsert ───────────────────────────────────────────
// Creates or updates the wiki_pages row for a page.
// Returns the page's UUID (needed to link document_chunks).
export async function upsertWikiPage(page: WikiPage): Promise<string> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("wiki_pages")
    .upsert(
      {
        slug: page.slug,
        title: page.title,
        file_path: page.filePath,
        content_md: page.content,
        frontmatter: page.frontmatter as unknown as Json,
        word_count: page.wordCount ?? null,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error) throw new Error(`Failed to upsert wiki_page "${page.slug}": ${error.message}`);
  return data.id;
}

// ── Chunk replacement ─────────────────────────────────────
// Deletes all old chunks for a page and inserts the new ones atomically.
// Using delete + insert (not upsert) because chunk_index can shift between
// ingestion runs (e.g. content was reorganized).
export async function replaceChunks(
  pageId: string,
  slug: string,
  chunks: Chunk[],
  embeddings: number[][]
): Promise<void> {
  const supabase = createAdminClient();

  // Delete old chunks first
  const { error: deleteError } = await supabase
    .from("document_chunks")
    .delete()
    .eq("page_id", pageId);

  if (deleteError) {
    throw new Error(`Failed to delete old chunks for "${slug}": ${deleteError.message}`);
  }

  if (chunks.length === 0) return;

  // Build rows — embeddings array aligns 1:1 with chunks array
  const rows = chunks.map((chunk, i) => ({
    page_id:     pageId,
    slug,
    chunk_index: chunk.chunkIndex,
    content:     chunk.content,
    token_count: chunk.tokenCount,
    embedding:   embeddings[i] as unknown as string,  // pgvector accepts number[]
    metadata:    chunk.metadata as unknown as Json,
  }));

  const { error: insertError } = await supabase
    .from("document_chunks")
    .insert(rows);

  if (insertError) {
    throw new Error(`Failed to insert chunks for "${slug}": ${insertError.message}`);
  }
}

// ── Orphan cleanup ────────────────────────────────────────
// Deletes wiki_pages (and their cascading document_chunks) for pages
// that no longer exist in the content/ directory.
// Called at the end of a full re-index run.
export async function deleteOrphanedPages(activeSlugs: string[]): Promise<number> {
  if (activeSlugs.length === 0) return 0;

  const supabase = createAdminClient();

  // Find pages in the database that are NOT in the active set
  const { data: allPages, error: fetchError } = await supabase
    .from("wiki_pages")
    .select("id, slug");

  if (fetchError) throw new Error(`Failed to fetch wiki_pages: ${fetchError.message}`);
  if (!allPages || allPages.length === 0) return 0;

  const activeSet = new Set(activeSlugs);
  const orphanIds = allPages
    .filter((p) => !activeSet.has(p.slug))
    .map((p) => p.id);

  if (orphanIds.length === 0) return 0;

  const { error: deleteError } = await supabase
    .from("wiki_pages")
    .delete()
    .in("id", orphanIds);

  if (deleteError) {
    throw new Error(`Failed to delete orphaned pages: ${deleteError.message}`);
  }

  return orphanIds.length;
}
