import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSlugs, getPageBySlug } from "@/lib/content/loader";
import { extractHeadings } from "@/lib/content/parser";
import { MarkdownRenderer } from "@/components/wiki/MarkdownRenderer";
import { TableOfContents } from "@/components/wiki/TableOfContents";
import { formatDate } from "@/lib/utils";

interface WikiPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug: slug.split("/") }));
}

export async function generateMetadata({
  params,
}: WikiPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageBySlug(slug.join("/"));
  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
  };
}

export default async function WikiPage({ params }: WikiPageProps) {
  const { slug } = await params;
  const page = getPageBySlug(slug.join("/"));

  if (!page) notFound();

  const headings = extractHeadings(page.content);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex gap-16">

        {/* ── Main article ───────────────────────────────── */}
        <article className="min-w-0 flex-1 max-w-3xl">

          {/* Page header */}
          <header className="mb-8 pb-6 border-b border-border">
            {page.frontmatter.tags && page.frontmatter.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {page.frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>

            {page.description && (
              <p className="mt-2 text-lg text-muted-foreground">
                {page.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {page.readingTime && (
                <span>{page.readingTime}</span>
              )}
              {page.wordCount && (
                <span>{page.wordCount.toLocaleString()} words</span>
              )}
              {page.frontmatter.updated && (
                <span>Updated {formatDate(page.frontmatter.updated)}</span>
              )}
              {page.frontmatter.date && !page.frontmatter.updated && (
                <span>{formatDate(page.frontmatter.date)}</span>
              )}
              {page.frontmatter.author && (
                <span>By {page.frontmatter.author}</span>
              )}
            </div>
          </header>

          {/* Rendered markdown content */}
          <MarkdownRenderer content={page.content} slug={page.slug} />

          {/* Page footer */}
          <footer className="mt-12 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Source:{" "}
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                {page.filePath}
              </code>
            </p>
          </footer>
        </article>

        {/* ── TOC sidebar (desktop xl+) ───────────────────── */}
        {headings.length > 1 && (
          <aside className="hidden xl:block w-56 shrink-0">
            <div className="sticky top-20">
              <TableOfContents headings={headings} />
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}
