// Markdown chunking for the RAG ingestion pipeline.
// Strategy: split at heading boundaries first, then by paragraph with overlap
// if a section exceeds the token budget.

export interface ChunkMetadata {
  heading: string;
  sectionPath: string[];
  pageTitle: string;
}

export interface Chunk {
  content: string;
  chunkIndex: number;
  tokenCount: number;
  metadata: ChunkMetadata;
}

// ~4 chars per token — accurate enough for chunking decisions.
// Use tiktoken for exact counts if needed later.
const CHARS_PER_TOKEN = 4;
const MIN_CHUNK_TOKENS = 30; // skip trivially small chunks (heading-only)

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

// ── Section parser ────────────────────────────────────────
// Splits markdown into sections at every heading boundary,
// tracking the full heading hierarchy for metadata.

interface ParsedSection {
  heading: string;
  level: number;
  headingPath: string[];
  lines: string[];
}

function parseSections(markdown: string): ParsedSection[] {
  const lines = markdown.split("\n");
  const sections: ParsedSection[] = [];

  let currentHeading = "";
  let currentLevel = 0;
  let currentLines: string[] = [];
  // Stack tracks the full heading hierarchy for sectionPath metadata
  const headingStack: { heading: string; level: number }[] = [];

  const flush = () => {
    const text = currentLines.join("\n").trim();
    if (text.length > 0) {
      sections.push({
        heading: currentHeading,
        level: currentLevel,
        headingPath: headingStack.map((h) => h.heading),
        lines: currentLines,
      });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const m = line.match(/^(#{1,4})\s+(.+)$/);
    if (m) {
      flush();
      const level = m[1].length;
      const heading = m[2].trim();

      // Pop deeper or equal headings from the stack
      while (
        headingStack.length > 0 &&
        headingStack[headingStack.length - 1].level >= level
      ) {
        headingStack.pop();
      }
      headingStack.push({ heading, level });

      currentHeading = heading;
      currentLevel = level;
      currentLines = [line]; // include the heading line in the chunk text
    } else {
      currentLines.push(line);
    }
  }
  flush();

  return sections;
}

// ── Paragraph splitter with overlap ──────────────────────
// Splits a long text into chunks of ≤ maxTokens, keeping
// the last `overlapTokens` tokens of each chunk as a prefix
// for the next to preserve cross-boundary context.

function splitByParagraph(
  text: string,
  maxTokens: number,
  overlapTokens: number
): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const para of paragraphs) {
    if (!para.trim()) continue;
    const paraTokens = estimateTokens(para);

    if (currentTokens + paraTokens > maxTokens && current.length > 0) {
      chunks.push(current.join("\n\n"));

      // Build overlap from the tail of the current chunk
      const overlap: string[] = [];
      let overlapTotal = 0;
      for (let i = current.length - 1; i >= 0; i--) {
        const t = estimateTokens(current[i]);
        if (overlapTotal + t <= overlapTokens) {
          overlap.unshift(current[i]);
          overlapTotal += t;
        } else {
          break;
        }
      }
      current = overlap;
      currentTokens = overlapTotal;
    }

    current.push(para);
    currentTokens += paraTokens;
  }

  if (current.length > 0) {
    chunks.push(current.join("\n\n"));
  }

  return chunks;
}

// ── Public API ────────────────────────────────────────────

export function chunkMarkdown(
  content: string,
  pageTitle: string,
  maxTokens = 512,
  overlapTokens = 50
): Chunk[] {
  const sections = parseSections(content);
  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const text = section.lines.join("\n").trim();
    const tokens = estimateTokens(text);

    // Skip heading-only sections with no meaningful content
    if (tokens < MIN_CHUNK_TOKENS) continue;

    if (tokens <= maxTokens) {
      chunks.push({
        content: text,
        chunkIndex: chunkIndex++,
        tokenCount: tokens,
        metadata: {
          heading: section.heading,
          sectionPath: section.headingPath,
          pageTitle,
        },
      });
    } else {
      // Section too large — split by paragraph with overlap
      const subchunks = splitByParagraph(text, maxTokens, overlapTokens);
      for (const sub of subchunks) {
        const subTokens = estimateTokens(sub);
        if (subTokens < MIN_CHUNK_TOKENS) continue;

        chunks.push({
          content: sub,
          chunkIndex: chunkIndex++,
          tokenCount: subTokens,
          metadata: {
            heading: section.heading,
            sectionPath: section.headingPath,
            pageTitle,
          },
        });
      }
    }
  }

  // Re-index after any skipped chunks
  return chunks.map((c, i) => ({ ...c, chunkIndex: i }));
}
