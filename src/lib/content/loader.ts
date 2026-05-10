import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { WikiPage, WikiFrontmatter } from "@/types/wiki";

const CONTENT_DIR = path.join(process.cwd(), "content");

// ── Filesystem helpers ────────────────────────────────────

function getAllMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    // Skip hidden files, _meta.json, etc.
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (/\.(md|mdx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

// ── Slug ↔ path conversion ────────────────────────────────

export function filePathToSlug(filePath: string): string {
  const relative = path.relative(CONTENT_DIR, filePath);
  return (
    relative
      .replace(/\\/g, "/") // normalize Windows separators
      .replace(/\.(md|mdx)$/, "")
      .replace(/\/index$/, "") // content/foo/index.md → "foo"
      .replace(/^index$/, "") // content/index.md → "" (home)
  );
}

function slugToTitle(name: string): string {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Single file parser ────────────────────────────────────

function parseFile(filePath: string): WikiPage {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const frontmatter = data as WikiFrontmatter;
  const slug = filePathToSlug(filePath);
  const stats = readingTime(content);

  return {
    slug,
    title:
      frontmatter.title ||
      slugToTitle(path.basename(filePath, path.extname(filePath))),
    description: frontmatter.description,
    content,
    frontmatter,
    filePath: path.relative(process.cwd(), filePath),
    readingTime: stats.text,
    wordCount: stats.words,
  };
}

// ── Public API ────────────────────────────────────────────

export function getAllPages(): WikiPage[] {
  const files = getAllMarkdownFiles(CONTENT_DIR);
  return files
    .map(parseFile)
    .filter((page) => !page.frontmatter.draft)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getPageBySlug(slug: string): WikiPage | null {
  // Try these candidates in order — first match wins
  const candidates = [
    path.join(CONTENT_DIR, `${slug}.md`),
    path.join(CONTENT_DIR, `${slug}.mdx`),
    path.join(CONTENT_DIR, slug, "index.md"),
    path.join(CONTENT_DIR, slug, "index.mdx"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return parseFile(candidate);
    }
  }

  return null;
}

// Returns all page slugs — used by generateStaticParams
export function getAllSlugs(): string[] {
  return getAllPages()
    .map((p) => p.slug)
    .filter((s) => s !== ""); // exclude home (index.md handled by "/" route)
}

// Returns the home page content (content/index.md)
export function getHomePage(): WikiPage | null {
  const candidates = [
    path.join(CONTENT_DIR, "index.md"),
    path.join(CONTENT_DIR, "index.mdx"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return parseFile(c);
  }
  return null;
}
