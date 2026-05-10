import Anthropic from "@anthropic-ai/sdk";
import {
  embedQuery,
  retrieveChunks,
  buildContextString,
  chunksToSources,
} from "@/lib/rag/retrieval";

// ── Prompts ───────────────────────────────────────────────

function buildSystemPrompt(context: string): string {
  return `You are a helpful AI assistant for a knowledge base wiki. Answer the user's question based only on the context excerpts below.

If the answer is not found in the context, say "I don't have information about that in the wiki" and suggest the user browse the wiki directly.

Be concise and accurate. Use markdown formatting (bold, lists, code blocks) where it improves clarity.

Context:
---
${context}
---`;
}

const NO_CONTEXT_PROMPT = `You are a helpful AI assistant for a knowledge base wiki. No relevant wiki content was found for this question.

Tell the user you couldn't find relevant information in the wiki for their question, and suggest they browse the wiki or rephrase their question. Keep the response brief.`;

// ── SSE helpers ───────────────────────────────────────────

const encoder = new TextEncoder();

type SSEPayload =
  | { type: "delta"; content: string }
  | { type: "sources"; sources: ReturnType<typeof chunksToSources> }
  | { type: "done" }
  | { type: "error"; message: string };

function sseEvent(payload: SSEPayload): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

// ── Route handler ─────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }
  if (!process.env.VOYAGE_API_KEY) {
    return Response.json({ error: "VOYAGE_API_KEY not configured (required for embeddings)" }, { status: 500 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return Response.json({ error: "Supabase not configured" }, { status: 500 });
  }

  let messages: Array<{ role: "user" | "assistant"; content: string }>;

  try {
    const body = await request.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages must be a non-empty array" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return Response.json({ error: "No user message in history" }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Embed the latest user query (OpenAI)
        const embedding = await embedQuery(lastUser.content);

        // 2. Semantic retrieval from Supabase
        const chunks = await retrieveChunks(embedding);

        // 3. Build system prompt with context
        const systemPrompt =
          chunks.length > 0
            ? buildSystemPrompt(buildContextString(chunks))
            : NO_CONTEXT_PROMPT;

        // 4. Stream Claude response
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const model = process.env.ANTHROPIC_CHAT_MODEL ?? "claude-haiku-4-5-20251001";

        // Keep last 10 messages (5 turns) for conversational context.
        // Anthropic requires alternating user/assistant roles — filter out
        // any consecutive same-role messages to be safe.
        const history = messages.slice(-10);

        const claudeStream = anthropic.messages.stream({
          model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: history,
        });

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(sseEvent({ type: "delta", content: event.delta.text }));
          }
        }

        // 5. Send source citations, then signal done
        controller.enqueue(sseEvent({ type: "sources", sources: chunksToSources(chunks) }));
        controller.enqueue(sseEvent({ type: "done" }));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(sseEvent({ type: "error", message }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
