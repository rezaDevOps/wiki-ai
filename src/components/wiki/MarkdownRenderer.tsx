// Server Component — runs at build time (SSG) or request time.
// Owns the entire remark/rehype pipeline. PreBlock and WikiLink are
// passed as client component islands within this server-rendered tree.
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import { wikiLinksToMarkdown } from "@/lib/content/parser";
import { WikiLink } from "./WikiLink";
import { PreBlock } from "./PreBlock";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  slug?: string;
  className?: string;
}

// Single dark theme — code blocks always use dark styling.
// This is the standard pattern for most doc sites (Vercel, Stripe, Linear).
// keepBackground: false because PreBlock sets its own dark bg via Tailwind.
const prettyCodeOptions: PrettyCodeOptions = {
  theme: "github-dark",
  keepBackground: false,
  defaultLang: "plaintext",
};

const mdxComponents = {
  // All <a> tags in rendered markdown go through WikiLink.
  // It auto-detects internal vs external vs anchor links.
  a: WikiLink,

  // All <pre> blocks (code fences) go through PreBlock.
  // PreBlock adds the copy button and language label header.
  pre: PreBlock,
};

export function MarkdownRenderer({
  content,
  slug,
  className,
}: MarkdownRendererProps) {
  // Convert Obsidian [[wikilinks]] to standard [text](href) markdown
  // before the MDX parser sees them. This is the simplest, most robust
  // approach — no custom remark plugin needed.
  const source = wikiLinksToMarkdown(content, slug);

  return (
    <div className={cn("wiki-prose", className)}>
      <MDXRemote
        source={source}
        options={{
          parseFrontmatter: false, // Already parsed by gray-matter in loader.ts
          mdxOptions: {
            format: "md",          // Treat as markdown, not MDX — avoids JSX parse errors
                                   // in wiki pages that may contain raw HTML or <tags>
            remarkPlugins: [
              remarkGfm,           // Tables, strikethrough, task lists, footnotes
            ],
            rehypePlugins: [
              rehypeSlug,          // Adds id="..." to h1-h6 for anchor links
              [
                rehypeAutolinkHeadings,
                {
                  behavior: "wrap",         // Wraps the heading text in an anchor
                  properties: {
                    ariaLabel: "Link to section",
                    className: ["anchor"],
                  },
                },
              ],
              [rehypePrettyCode, prettyCodeOptions],
            ],
          },
        }}
        components={mdxComponents}
      />
    </div>
  );
}
