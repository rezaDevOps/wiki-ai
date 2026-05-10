import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ChatSource } from "@/types/chat";

export interface RetrievedChunk {
  slug: string;
  content: string;
  heading: string;
  pageTitle: string;
  similarity: number;
}

// Module-level singleton — safe in Route Handlers (one instance per worker)
let _supabase: ReturnType<typeof createClient<Database>> | null = null;

function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

export async function embedQuery(query: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not set");

  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "voyage-3-lite",
      input: [query.slice(0, 8000)],
      input_type: "query",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Voyage API error ${res.status}: ${text}`);
  }

  const json = await res.json() as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}

export async function retrieveChunks(
  queryEmbedding: number[],
  matchCount = 6,
  matchThreshold = 0.5
): Promise<RetrievedChunk[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) throw new Error(`Retrieval failed: ${error.message}`);
  if (!data || data.length === 0) return [];

  return data.map((row) => {
    const meta = row.metadata as Record<string, unknown>;
    return {
      slug: row.slug,
      content: row.content,
      heading: (meta.heading as string) ?? "",
      pageTitle: (meta.pageTitle as string) ?? row.slug,
      similarity: row.similarity,
    };
  });
}

export function buildContextString(chunks: RetrievedChunk[]): string {
  return chunks
    .map(
      (chunk, i) =>
        `[${i + 1}] ${chunk.pageTitle}${chunk.heading ? ` — ${chunk.heading}` : ""}\n${chunk.content}`
    )
    .join("\n\n---\n\n");
}

export function chunksToSources(chunks: RetrievedChunk[]): ChatSource[] {
  return chunks.map((c) => ({
    slug: c.slug,
    title: c.pageTitle,
    heading: c.heading,
    excerpt: c.content.slice(0, 200).trimEnd() + (c.content.length > 200 ? "…" : ""),
    similarity: Math.round(c.similarity * 100) / 100,
  }));
}
