import { createClient } from "@/lib/supabase/client";
import type { ChatSessionRow, ChatMessageRow, Json } from "@/types/database";
import type { ChatSource } from "@/types/chat";

export async function createChatSession(title: string): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ user_id: user.id, title })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data.id;
}

export async function listChatSessions(): Promise<ChatSessionRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("chat_sessions")
    .select("*")
    .order("updated_at", { ascending: false });

  return data ?? [];
}

// Saves a completed user+assistant exchange atomically.
// Called after streaming ends so both rows have their final content.
export async function saveChatMessages(
  sessionId: string,
  userContent: string,
  assistantContent: string,
  sources: ChatSource[]
): Promise<void> {
  const supabase = createClient();

  await supabase.from("chat_messages").insert([
    { session_id: sessionId, role: "user" as const,      content: userContent },
    { session_id: sessionId, role: "assistant" as const, content: assistantContent, sources: sources as unknown as Json },
  ]);
}

export async function loadSessionMessages(sessionId: string): Promise<ChatMessageRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return data ?? [];
}
