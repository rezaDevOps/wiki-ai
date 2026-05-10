"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import type { ChatMessage, ChatSource } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { useUser } from "@/hooks/useUser";
import {
  createChatSession,
  saveChatMessages,
  loadSessionMessages,
} from "@/lib/chat/sessions";

// SSE event types emitted by /api/chat
type SSEEvent =
  | { type: "delta"; content: string }
  | { type: "sources"; sources: ChatSource[] }
  | { type: "done" }
  | { type: "error"; message: string };

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm your wiki assistant. Ask me anything about the topics in this knowledge base and I'll find the most relevant information for you.",
  createdAt: new Date(),
};

const SUGGESTIONS = [
  "What topics are covered in this wiki?",
  "Give me an overview of the main concepts.",
  "What should I read first as a beginner?",
];

export function ChatInterface() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");

  const [messages, setMessages]   = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Null until the first message is sent (authenticated users only)
  const [sessionId, setSessionId] = useState<string | null>(sessionParam);
  // Accumulates streamed content in a ref so we can read the final value
  // in the "sources" handler without stale-closure issues.
  const streamingContent = useRef("");

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load an existing session from the URL param on mount
  useEffect(() => {
    if (!sessionParam || !user) return;

    loadSessionMessages(sessionParam).then((rows) => {
      if (rows.length === 0) return;
      const loaded: ChatMessage[] = rows.map((row) => ({
        id:        row.id,
        role:      row.role,
        content:   row.content,
        sources:   (row.sources as ChatSource[] | null) ?? undefined,
        createdAt: new Date(row.created_at),
      }));
      setMessages(loaded);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionParam, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text || isLoading) return;

      setInput("");
      setIsLoading(true);
      streamingContent.current = "";
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      const userMsg: ChatMessage = {
        id:        crypto.randomUUID(),
        role:      "user",
        content:   text,
        createdAt: new Date(),
      };

      const assistantId  = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id:          assistantId,
        role:        "assistant",
        content:     "",
        isStreaming: true,
        createdAt:   new Date(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      // For authenticated users: create a session on the first message
      let activeSessionId = sessionId;
      if (user && !activeSessionId) {
        try {
          const title = text.slice(0, 60) + (text.length > 60 ? "…" : "");
          activeSessionId = await createChatSession(title);
          setSessionId(activeSessionId);
          // Update URL without a navigation so the session survives a refresh
          window.history.replaceState(null, "", `/chat?session=${activeSessionId}`);
        } catch {
          // Session creation failed — continue without persistence
        }
      }

      // Build message history for the API (exclude the welcome message)
      const history = [...messages, userMsg]
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const response = await fetch("/api/chat", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ messages: history }),
        });

        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

        const reader  = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer    = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            const event: SSEEvent = JSON.parse(raw);

            if (event.type === "delta") {
              streamingContent.current += event.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + event.content }
                    : m
                )
              );
            } else if (event.type === "sources") {
              const finalContent = streamingContent.current;

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, sources: event.sources, isStreaming: false }
                    : m
                )
              );

              // Persist the completed exchange — fire and forget
              if (user && activeSessionId) {
                saveChatMessages(
                  activeSessionId,
                  text,
                  finalContent,
                  event.sources
                ).catch(() => {/* silent — UI already updated */});
              }
            } else if (event.type === "done") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, isStreaming: false } : m
                )
              );
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: `Sorry, something went wrong: ${event.message}`, isStreaming: false }
                    : m
                )
              );
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, something went wrong. Please try again.", isStreaming: false }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, sessionId, user]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const showSuggestions = messages.length === 1 && messages[0].id === "welcome";

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col">
      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {showSuggestions && (
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  disabled={isLoading}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-background px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the wiki…"
            rows={1}
            disabled={isLoading}
            className="min-h-[40px] max-h-[160px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Enter to send · Shift+Enter for newline
          {!user && (
            <> · <a href="/login" className="underline-offset-2 hover:underline">Sign in</a> to save history</>
          )}
        </p>
      </div>
    </div>
  );
}
