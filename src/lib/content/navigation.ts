import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { NavItem, NavSection } from "@/types/wiki";
import { filePathToSlug } from "./loader";

const CONTENT_DIR = path.join(process.cwd(), "content");

// ── _meta.json support ────────────────────────────────────

interface DirMeta {
  title?: string;
  order?: string[]; // filenames (without .md) in desired display order
}

function readMeta(dir: string): DirMeta {
  const metaPath = path.join(dir, "_meta.json");
  if (!fs.existsSync(metaPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8")) as DirMeta;
  } catch {
    return {};
  }
}

// ── Title helpers ─────────────────────────────────────────

function dirNameToTitle(name: string): string {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getFileTitle(filePath: string): string {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    if (data.title) return data.title as string;
  } catch {
    // fall through to filename-based title
  }
  const base = path.basename(filePath, path.extname(filePath));
  return dirNameToTitle(base);
}

// ── Recursive item builder ────────────────────────────────

function buildNavItems(dir: string): NavItem[] {
  if (!fs.existsSync(dir)) return [];

  const meta = readMeta(dir);
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const fileItems: NavItem[] = [];
  const dirItems: NavItem[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const children = buildNavItems(fullPath);
      if (children.length === 0) continue;

      const childMeta = readMeta(fullPath);
      const title = childMeta.title ?? dirNameToTitle(entry.name);

      // If the directory has an index.md, it becomes a clickable parent link
      const indexPath = path.join(fullPath, "index.md");
      const href = fs.existsSync(indexPath)
        ? `/wiki/${filePathToSlug(indexPath)}`
        : children[0].href;

      dirItems.push({ title, href, children });
    } else if (
      /\.(md|mdx)$/.test(entry.name) &&
      entry.name !== "index.md" &&
      entry.name !== "index.mdx"
    ) {
      const slug = filePathToSlug(fullPath);
      const title = getFileTitle(fullPath);
      // slug is empty string only for root index — not reachable here
      fileItems.push({ title, href: `/wiki/${slug}` });
    }
  }

  // Merge files first, then directories
  const all = [...fileItems, ...dirItems];

  // Apply _meta.json order if provided
  if (meta.order && meta.order.length > 0) {
    all.sort((a, b) => {
      const nameOf = (item: NavItem) =>
        item.href.split("/").pop() ?? item.href;
      const ai = meta.order!.indexOf(nameOf(a));
      const bi = meta.order!.indexOf(nameOf(b));
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }

  return all;
}

// ── Public API ────────────────────────────────────────────

export function buildNavigation(): NavSection[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const sections: NavSection[] = [];

  // Always prepend a top-level Home link
  sections.push({
    title: "Overview",
    items: [{ title: "Home", href: "/" }],
  });

  const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
    if (!entry.isDirectory()) continue;

    const dirPath = path.join(CONTENT_DIR, entry.name);
    const meta = readMeta(dirPath);
    const title = meta.title ?? dirNameToTitle(entry.name);
    const items = buildNavItems(dirPath);

    if (items.length > 0) {
      sections.push({ title, items });
    }
  }

  return sections;
}
