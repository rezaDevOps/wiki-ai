/**
 * PDF → Markdown ingestion using Claude's vision API.
 *
 * Usage:
 *   npm run ingest:pdf                    # process all PDFs in content/pdfs/
 *   npm run ingest:pdf path/to/file.pdf   # process a specific file
 *
 * Output: markdown files saved to content/ — then run `npm run ingest` to embed them.
 *
 * Supports: text PDFs, scanned PDFs, PDFs with photos/diagrams/charts.
 * Model: claude-sonnet-4-6 by default (override with ANTHROPIC_PDF_MODEL env var).
 */

// @ts-nocheck — document content blocks require a newer @anthropic-ai/sdk type signature
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const PDFS_DIR    = path.join(process.cwd(), "content", "pdfs");
const CONTENT_DIR = path.join(process.cwd(), "content");

const bold = (s: string) => process.stdout.write(`\n${s}\n`);
const log  = (s: string) => process.stdout.write(`  ${s}\n`);
const ok   = (s: string) => process.stdout.write(`  ✓ ${s}\n`);
const fail = (s: string) => process.stderr.write(`  ✗ ${s}\n`);

const SYSTEM_PROMPT = `You are a document conversion assistant. Convert the provided PDF to clean, well-structured markdown.

Rules:
- Extract ALL text content faithfully and completely
- For every photo, diagram, chart, infographic, or visual: write a detailed description as a blockquote starting with "> **[Image]**"
- Preserve the document structure: # for the main title, ## for sections, ### for subsections
- Render tables as GitHub-flavored markdown tables
- Wrap code snippets in triple-backtick code blocks with language identifiers
- Start the output with YAML frontmatter containing title (inferred from the document) and a tags field
- Output ONLY the markdown — no commentary, no "Here is the converted document" preamble`;

async function pdfToMarkdown(pdfPath: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set in .env.local");

  const client = new Anthropic({ apiKey });
  const base64Data = fs.readFileSync(pdfPath).toString("base64");
  const model = process.env.ANTHROPIC_PDF_MODEL ?? "claude-sonnet-4-6";

  const response = await client.messages.create({
    model,
    max_tokens: 8096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Data,
            },
          },
          {
            type: "text",
            text: "Convert this PDF to markdown following the system instructions.",
          },
        ],
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Claude");
  return block.text;
}

function toSlug(pdfPath: string): string {
  return path.basename(pdfPath, ".pdf")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

async function processFile(pdfPath: string): Promise<void> {
  const slug       = toSlug(pdfPath);
  const outputPath = path.join(CONTENT_DIR, `${slug}.md`);

  log(`Converting: ${path.basename(pdfPath)}`);
  const markdown = await pdfToMarkdown(pdfPath);
  fs.writeFileSync(outputPath, markdown, "utf-8");
  ok(`Saved → content/${slug}.md`);
}

async function main(): Promise<void> {
  bold("Wiki AI — PDF Ingestion");

  if (!process.env.ANTHROPIC_API_KEY) {
    fail("ANTHROPIC_API_KEY is not set in .env.local");
    process.exit(1);
  }

  // Strip dotenv loader args, keep only actual file paths
  const args = process.argv.slice(2).filter((a) => !a.startsWith("dotenv"));

  let pdfPaths: string[];

  if (args.length > 0) {
    pdfPaths = args.map((a) => path.resolve(a));
    const missing = pdfPaths.filter((p) => !fs.existsSync(p));
    if (missing.length > 0) {
      fail(`File not found: ${missing.join(", ")}`);
      process.exit(1);
    }
  } else {
    if (!fs.existsSync(PDFS_DIR)) {
      fs.mkdirSync(PDFS_DIR, { recursive: true });
      log("Created content/pdfs/ — drop your PDFs there and re-run.");
      return;
    }

    pdfPaths = fs
      .readdirSync(PDFS_DIR)
      .filter((f) => f.toLowerCase().endsWith(".pdf"))
      .map((f) => path.join(PDFS_DIR, f));

    if (pdfPaths.length === 0) {
      log("No PDFs found in content/pdfs/");
      return;
    }
  }

  log(`Found ${pdfPaths.length} PDF(s)`);

  for (const pdfPath of pdfPaths) {
    await processFile(pdfPath);
  }

  bold('Done! Run `npm run ingest` to embed the new page(s) into Supabase.');
}

main().catch((e: Error) => {
  fail(e.message);
  process.exit(1);
});
