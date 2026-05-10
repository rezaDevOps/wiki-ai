import type { Chunk } from "./chunk";

const VOYAGE_API = "https://api.voyageai.com/v1/embeddings";

function buildEmbeddingInput(chunk: Chunk): string {
  const contextParts = [
    chunk.metadata.pageTitle,
    ...chunk.metadata.sectionPath,
  ].filter(Boolean);
  const context = contextParts.join(" > ");
  return context ? `${context}\n\n${chunk.content}` : chunk.content;
}

async function voyageEmbed(inputs: string[], inputType: "document" | "query"): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not set in .env.local");

  const res = await fetch(VOYAGE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: "voyage-3-lite", input: inputs, input_type: inputType }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Voyage API error ${res.status}: ${text}`);
  }

  const json = await res.json() as { data: { embedding: number[]; index: number }[] };
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

// Sends chunks to Voyage AI in batches of 128 (their recommended max).
// Returns one number[] per chunk, in the same order.
export async function generateEmbeddings(
  chunks: Chunk[],
  batchSize = 128
): Promise<number[][]> {
  if (chunks.length === 0) return [];

  const inputs = chunks.map(buildEmbeddingInput);
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize);
    const batchEmbeddings = await voyageEmbed(batch, "document");
    allEmbeddings.push(...batchEmbeddings);
  }

  return allEmbeddings;
}
