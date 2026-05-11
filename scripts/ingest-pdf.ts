// @ts-nocheck — document content blocks require a newer @anthropic-ai/sdk type signature
/**
 * PDF → Markdown + Images ingestion using Claude vision + pdf-to-img.
 *
 * Each PDF page is rendered to a real PNG (saved to public/wiki-images/[slug]/)
 * and embedded inline in the generated markdown. Claude extracts the text per page.
 *
 * Usage:
 *   npm run ingest:pdf                    # process all PDFs in content/pdfs/
 *   npm run ingest:pdf path/to/file.pdf   # process a specific file
 *
 * After running:
 *   1. npm run ingest              — embed new pages into Supabase
 *   2. git add content/ public/wiki-images/ && git push  — deploy to Vercel
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const PDFS_DIR    = path.join(process.cwd(), "content", "pdfs");
const CONTENT_DIR = path.join(process.cwd(), "content");
const PUBLIC_DIR  = path.join(process.cwd(), "public");

const bold = (s: string) => process.stdout.write(`\n${s}\n`);
const log  = (s: string) => process.stdout.write(`  ${s}\n`);
const ok   = (s: string) => process.stdout.write(`  ✓ ${s}\n`);
const fail = (s: string) => process.stderr.write(`  ✗ ${s}\n`);

function toSlug(pdfPath: string): string {
  return path.basename(pdfPath, ".pdf")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

// ── Step 1: Render each PDF page to a PNG ─────────────────
async function renderPages(pdfPath: string, slug: string): Promise<string[]> {
  log("Rendering pages to images…");

  const { pdf } = await import("pdf-to-img");

  const imagesDir = path.join(PUBLIC_DIR, "wiki-images", slug);
  fs.mkdirSync(imagesDir, { recursive: true });

  const imagePaths: string[] = [];
  let pageNum = 0;

  for await (const pageBuffer of await pdf(pdfPath, { scale: 1.5 })) {
    pageNum++;
    const filename = `page-${pageNum}.png`;
    fs.writeFileSync(path.join(imagesDir, filename), pageBuffer);
    imagePaths.push(`/wiki-images/${slug}/${filename}`);
    if (pageNum % 10 === 0) log(`  ${pageNum} pages rendered…`);
  }

  ok(`Rendered ${pageNum} pages → public/wiki-images/${slug}/`);
  return imagePaths;
}

// ── Step 2: Extract text per page via Claude ──────────────
async function extractTextPerPage(pdfBuffer: Buffer): Promise<string> {
  log("Extracting text with Claude…");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model  = process.env.ANTHROPIC_PDF_MODEL ?? "claude-sonnet-4-6";

  const response = await client.messages.create({
    model,
    max_tokens: 8096,
    system: `Convert this PDF to structured markdown, page by page.

Use EXACTLY this format for each page — no deviation:

===PAGE 1===
[all text from this page]

===PAGE 2===
[all text from this page]

Rules:
- Start with YAML frontmatter (title inferred from document, tags: []) before ===PAGE 1===
- Use ===PAGE N=== as the only delimiter (exact format)
- Extract ALL visible text faithfully, preserving bullet points and lists
- For diagrams or charts write one italic line: *[Diagram: brief description]*
- No preamble or commentary — output only the structured content`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBuffer.toString("base64"),
            },
          },
          {
            type: "text",
            text: "Convert this PDF per-page as instructed.",
          },
        ],
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response from Claude");
  ok("Text extracted");
  return block.text;
}

// ── Step 3: Combine images + text into markdown ───────────
function buildMarkdown(claudeOutput: string, imagePaths: string[]): string {
  let frontmatter = "";
  let body = claudeOutput;

  const fmMatch = claudeOutput.match(/^(---[\s\S]+?---)\n*/);
  if (fmMatch) {
    frontmatter = fmMatch[1] + "\n\n";
    body = claudeOutput.slice(fmMatch[0].length);
  }

  const segments = body.split(/===PAGE (\d+)===/);
  let result = frontmatter;

  for (let i = 1; i < segments.length; i += 2) {
    const pageNum  = parseInt(segments[i], 10);
    const pageText = segments[i + 1]?.trim() ?? "";
    const imgPath  = imagePaths[pageNum - 1];

    result += `---\n\n## Page ${pageNum}\n\n`;
    if (imgPath) result += `![Page ${pageNum}](${imgPath})\n\n`;
    if (pageText) result += `${pageText}\n\n`;
  }

  return result.trim();
}

// ── Main ──────────────────────────────────────────────────
async function processFile(pdfPath: string): Promise<void> {
  const slug       = toSlug(pdfPath);
  const outputPath = path.join(CONTENT_DIR, `${slug}.md`);
  const pdfBuffer  = fs.readFileSync(pdfPath);

  log(`\nProcessing: ${path.basename(pdfPath)}`);

  // Render pages and extract text in parallel — they're independent
  const [imagePaths, claudeOutput] = await Promise.all([
    renderPages(pdfPath, slug),
    extractTextPerPage(pdfBuffer),
  ]);

  const markdown = buildMarkdown(claudeOutput, imagePaths);
  fs.writeFileSync(outputPath, markdown, "utf-8");
  ok(`Saved → content/${slug}.md  (${imagePaths.length} pages)`);
}

async function main(): Promise<void> {
  bold("Wiki AI — PDF Ingestion (text + images)");

  if (!process.env.ANTHROPIC_API_KEY) {
    fail("ANTHROPIC_API_KEY is not set in .env.local");
    process.exit(1);
  }

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

  bold(
    "Done!\n" +
    "  1. npm run ingest              — embed new pages into Supabase\n" +
    "  2. git add content/ public/wiki-images/\n" +
    "     git commit -m 'feat: add PDF notes'\n" +
    "     git push                    — deploy to Vercel with images"
  );
}

main().catch((e: Error) => {
  fail(e.message);
  process.exit(1);
});
