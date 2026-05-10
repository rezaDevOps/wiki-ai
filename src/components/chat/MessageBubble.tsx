import type { ChatMessage } from "@/types/chat";
import { SourceCitations } from "./SourceCitations";

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted text-foreground"
          }`}
        >
          {message.isStreaming && !message.content ? (
            <ThinkingDots />
          ) : (
            <MessageContent content={message.content} />
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceCitations sources={message.sources} />
        )}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="flex items-center gap-1 py-0.5">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
    </span>
  );
}

// Renders basic markdown: fenced code blocks, inline code, plain text.
// Full MDX is overkill for chat responses; this handles ~90% of LLM output.
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const inner = part.slice(3, -3);
          const newline = inner.indexOf("\n");
          const lang = newline !== -1 ? inner.slice(0, newline).trim() : "";
          const code = newline !== -1 ? inner.slice(newline + 1) : inner;

          return (
            <pre
              key={i}
              className="my-2 overflow-x-auto rounded-lg bg-zinc-900 px-3 py-2.5 text-xs leading-relaxed text-zinc-100"
            >
              {lang && (
                <span className="mb-1.5 block text-[10px] text-zinc-500">{lang}</span>
              )}
              <code className="font-mono">{code}</code>
            </pre>
          );
        }

        // Handle inline code within plain text segments
        const inlineParts = part.split(/(`[^`]+`)/g);
        if (inlineParts.length === 1) return <span key={i}>{part}</span>;

        return (
          <span key={i}>
            {inlineParts.map((p, j) =>
              p.startsWith("`") && p.endsWith("`") ? (
                <code
                  key={j}
                  className="rounded bg-zinc-900/10 px-1 py-0.5 text-xs font-mono dark:bg-zinc-100/10"
                >
                  {p.slice(1, -1)}
                </code>
              ) : (
                <span key={j}>{p}</span>
              )
            )}
          </span>
        );
      })}
    </div>
  );
}
