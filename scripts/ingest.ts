#!/usr/bin/env tsx
// ─────────────────────────────────────────────────────────
// Wiki AI — RAG Ingestion Pipeline
//
// Usage (local):
//   npm run ingest          # re-index changed pages only (via git diff)
//   npm run ingest:all      # force re-index every page
//
// Usage (GitHub Actions):
//   The ingest.yml workflow calls this script with env vars set from secrets.
//
// Pipeline per page:
//   1. Load markdown + frontmatter from content/
//   2. Convert [[wikilinks]] to standard markdown
//   3. Chunk by heading with paragraph-level overflow
//   4. Generate embeddings via OpenAI text-embedding-3-small
//   5. Upsert wiki_pages row + replace document_chunks in Supabase
// ─────────────────────────────────────────────────────────

import path from "path";
import { execSync } from "child_process";

// dotenv loaded via -r dotenv/config in npm script.
// Re-loading here as a fallback when script is run directly.
import "dotenv/config";

import { getAllPages, getPageBySlug } from "../src/lib/content/loader";
import { wikiLinksToMarkdown } from "../src/lib/content/parser";
import { chunkMarkdown } from "./chunk";
import { generateEmbeddings } from "./embed";
import { upsertWikiPage, replaceChunks, deleteOrphanedPages } from "./upsert";

// ── CLI args ──────────────────────────────────────────────

const args = process.argv.slice(2);
const forceAll = args.includes("--all");

// ── Changed-file detection ────────────────────────────────
// When running in GitHub Actions (not --all), only re-index files
// changed in the most recent push. Falls back to all pages if git fails.

function getChangedSlugs(): string[] | null {
  try {
    const diff = execSync("git diff --name-only HEAD~1 HEAD -- content/", {
      encoding: "utf-8",
    }).trim();

    if (!diff) return [];

    return diff
      .split("\n")
      .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
      .map((f) => {
        // content/topics/ai-fundamentals.md → topics/ai-fundamentals
        return f
          .replace(/^content\//, "")
          .replace(/\.(md|mdx)$/, "")
          .replace(/\/index$/, "");
      })
      .filter(Boolean);
  } catch {
    // git diff failed (no previous commit, shallow clone, etc.) — fall back to all
    return null;
  }
}

// ── Output helpers ────────────────────────────────────────

const RESET  = "\x1b[0m";
const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const DIM    = "\x1b[2m";
const BOLD   = "\x1b[1m";

function log(msg: string)  { process.stdout.write(msg + "\n"); }
function ok(msg: string)   { log(`  ${GREEN}✓${RESET} ${msg}`); }
function err(msg: string)  { log(`  ${RED}✗${RESET} ${msg}`); }
function dim(msg: string)  { log(`${DIM}${msg}${RESET}`); }
function bold(msg: string) { log(`${BOLD}${msg}${RESET}`); }

// ── Main ──────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  bold("\nWiki AI — Ingestion Pipeline");
  dim("─".repeat(40));

  // Validate environment
  const missingEnv: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL)    missingEnv.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)   missingEnv.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.VOYAGE_API_KEY)              missingEnv.push("VOYAGE_API_KEY");

  if (missingEnv.length > 0) {
    err(`Missing environment variables:\n  ${missingEnv.join("\n  ")}`);
    err("Check your .env.local file.");
    process.exit(1);
  }

  // Determine which pages to process
  let pagesToProcess = getAllPages();
  const allSlugs = pagesToProcess.map((p) => p.slug);

  if (!forceAll) {
    const changedSlugs = getChangedSlugs();

    if (changedSlugs !== null && changedSlugs.length === 0) {
      bold("\nNo content files changed. Nothing to ingest.");
      process.exit(0);
    }

    if (changedSlugs !== null && changedSlugs.length > 0) {
      pagesToProcess = changedSlugs
        .map((slug) => getPageBySlug(slug))
        .filter((p): p is NonNullable<typeof p> => p !== null);

      log(`\nMode: incremental (${pagesToProcess.length} changed pages)`);
    } else {
      log(`\nMode: full re-index (git diff unavailable)`);
    }
  } else {
    log(`\nMode: full re-index (--all flag)`);
  }

  log(`Found ${pagesToProcess.length} page(s) to process\n`);

  // ── Process each page ─────────────────────────────────
  let processed = 0;
  let failed    = 0;
  let totalChunks = 0;

  for (let i = 0; i < pagesToProcess.length; i++) {
    const page = pagesToProcess[i];
    const prefix = `[${String(i + 1).padStart(String(pagesToProcess.length).length)}/${pagesToProcess.length}]`;
    const pageStart = Date.now();

    log(`${prefix} ${DIM}${page.slug}${RESET}`);

    try {
      // 1. Pre-process: convert [[wikilinks]] to standard markdown
      const processedContent = wikiLinksToMarkdown(page.content, page.slug);

      // 2. Chunk
      const chunks = chunkMarkdown(processedContent, page.title);

      if (chunks.length === 0) {
        dim("  → skipped (no content after chunking)");
        continue;
      }

      // 3. Generate embeddings (batched OpenAI API calls)
      const embeddings = await generateEmbeddings(chunks);

      // 4. Upsert to Supabase
      const pageId = await upsertWikiPage(page);
      await replaceChunks(pageId, page.slug, chunks, embeddings);

      const elapsed = ((Date.now() - pageStart) / 1000).toFixed(1);
      ok(`${chunks.length} chunks | ${(page.wordCount ?? 0).toLocaleString()} words | ${elapsed}s`);

      processed++;
      totalChunks += chunks.length;
    } catch (e) {
      err(`${e instanceof Error ? e.message : String(e)}`);
      failed++;
    }
  }

  // ── Orphan cleanup (full re-index only) ───────────────
  if (forceAll || getChangedSlugs() === null) {
    try {
      const removed = await deleteOrphanedPages(allSlugs);
      if (removed > 0) {
        dim(`\nRemoved ${removed} orphaned page(s) from database`);
      }
    } catch (e) {
      err(`Orphan cleanup failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  // ── Summary ───────────────────────────────────────────
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  log("");
  dim("─".repeat(40));
  log(
    `${GREEN}✓${RESET} ${processed} processed  ` +
    `${failed > 0 ? `${RED}✗${RESET} ${failed} failed  ` : ""}` +
    `${DIM}${totalChunks} total chunks | ${totalTime}s${RESET}`
  );

  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error("\nFatal error:", e);
  process.exit(1);
});
