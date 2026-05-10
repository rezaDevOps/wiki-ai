// ── Wiki link utilities ───────────────────────────────────
// Handles Obsidian-style [[wikilinks]] throughout the content pipeline.
// Called by the markdown renderer (Module D) and the ingestion script (Module E).

const WIKI_LINK_RE = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

export interface WikiLinkMatch {
  raw: string;
  target: string;
  display: string;
  href: string;
}

export function resolveWikiLink(target: string, currentSlug = ""): string {
  // Absolute path: [[topics/ai-fundamentals]]
  if (target.includes("/")) return `/wiki/${target}`;

  // Relative: [[overview]] — resolve from current page's directory
  const parentDir = currentSlug.includes("/")
    ? currentSlug.slice(0, currentSlug.lastIndexOf("/"))
    : "";

  const resolved = parentDir ? `${parentDir}/${target}` : target;

  if (resolved === "index") return "/";

  return `/wiki/${resolved}`;
}

export function parseWikiLinks(
  content: string,
  currentSlug = ""
): WikiLinkMatch[] {
  const results: WikiLinkMatch[] = [];
  const re = new RegExp(WIKI_LINK_RE.source, "g");
  let match: RegExpExecArray | null;

  while ((match = re.exec(content)) !== null) {
    const [raw, target, display] = match;
    results.push({
      raw,
      target: target.trim(),
      display: (display ?? target).trim(),
      href: resolveWikiLink(target.trim(), currentSlug),
    });
  }

  return results;
}

// Converts [[wikilinks]] to standard markdown [text](href) for processors
// that don't understand Obsidian syntax (e.g., remark pipeline).
export function wikiLinksToMarkdown(
  content: string,
  currentSlug = ""
): string {
  return content.replace(WIKI_LINK_RE, (_, target, display) => {
    const href = resolveWikiLink(target.trim(), currentSlug);
    const text = (display ?? target).trim();
    return `[${text}](${href})`;
  });
}

// ── Heading extractor (used for TOC in Module D) ──────────

export interface Heading {
  level: number;
  text: string;
  id: string;
}

export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];

  for (const line of content.split("\n")) {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "");

    headings.push({ level, text, id });
  }

  return headings;
}
