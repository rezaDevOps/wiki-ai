// ─────────────────────────────────────────────────────────────────────────────
// Supabase database types — mirrors the schema in supabase/migrations/
//
// To regenerate from a live project:
//   npx supabase gen types typescript \
//     --project-id <your-project-ref> \
//     --schema public \
//     > src/types/database.ts
//
// These are hand-written to unblock development before the Supabase project
// is created. Replace with generated types once connected.
// ─────────────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ── wiki_pages ────────────────────────────────────────
      wiki_pages: {
        Row: {
          id:             string;
          slug:           string;
          title:          string;
          file_path:      string;
          content_md:     string | null;
          frontmatter:    Json;
          word_count:     number | null;
          last_synced_at: string;
          created_at:     string;
          updated_at:     string;
        };
        Insert: {
          id?:            string;
          slug:           string;
          title:          string;
          file_path:      string;
          content_md?:    string | null;
          frontmatter?:   Json;
          word_count?:    number | null;
          last_synced_at?: string;
          created_at?:    string;
          updated_at?:    string;
        };
        Update: {
          id?:            string;
          slug?:          string;
          title?:         string;
          file_path?:     string;
          content_md?:    string | null;
          frontmatter?:   Json;
          word_count?:    number | null;
          last_synced_at?: string;
          updated_at?:    string;
        };
        Relationships: [];
      };

      // ── profiles ──────────────────────────────────────────
      profiles: {
        Row: {
          id:           string;
          display_name: string | null;
          avatar_url:   string | null;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id:            string;
          display_name?: string | null;
          avatar_url?:   string | null;
          created_at?:   string;
          updated_at?:   string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?:   string | null;
          updated_at?:   string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      // ── chat_sessions ─────────────────────────────────────
      chat_sessions: {
        Row: {
          id:         string;
          user_id:    string;
          title:      string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?:        string;
          user_id:    string;
          title?:     string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?:      string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      // ── chat_messages ─────────────────────────────────────
      chat_messages: {
        Row: {
          id:          string;
          session_id:  string;
          role:        "user" | "assistant";
          content:     string;
          sources:     Json;      // Array<{ slug, title, excerpt, similarity }>
          tokens_used: number | null;
          created_at:  string;
        };
        Insert: {
          id?:          string;
          session_id:   string;
          role:         "user" | "assistant";
          content:      string;
          sources?:     Json;
          tokens_used?: number | null;
          created_at?:  string;
        };
        Update: {
          content?:     string;
          sources?:     Json;
          tokens_used?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "chat_sessions";
            referencedColumns: ["id"];
          }
        ];
      };

      // ── document_chunks ───────────────────────────────────
      document_chunks: {
        Row: {
          id:          string;
          page_id:     string;
          slug:        string;
          chunk_index: number;
          content:     string;
          token_count: number | null;
          embedding:   string | null;  // pgvector serialized as "[0.1,0.2,...]"
          metadata:    Json;           // { heading, section_path, page_title }
          created_at:  string;
        };
        Insert: {
          id?:          string;
          page_id:      string;
          slug:         string;
          chunk_index:  number;
          content:      string;
          token_count?: number | null;
          embedding?:   number[] | string | null; // insert as number[], reads back as string
          metadata?:    Json;
          created_at?:  string;
        };
        Update: {
          content?:     string;
          token_count?: number | null;
          embedding?:   number[] | string | null;
          metadata?:    Json;
        };
        Relationships: [
          {
            foreignKeyName: "document_chunks_page_id_fkey";
            columns: ["page_id"];
            referencedRelation: "wiki_pages";
            referencedColumns: ["id"];
          }
        ];
      };
    };

    Views: Record<string, never>;

    Functions: {
      // ── match_documents ───────────────────────────────────
      // Cosine similarity search over document_chunks.
      // query_embedding: pass as a number[] — Supabase serializes it to VECTOR.
      match_documents: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
        };
        Returns: Array<{
          id:         string;
          slug:       string;
          content:    string;
          metadata:   Json;
          similarity: number;
        }>;
      };
    };

    Enums: Record<string, never>;
  };
}

// ── Convenience helpers ───────────────────────────────────
// Usage: const page: Tables<'wiki_pages'> = ...
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Specific row types for convenience
export type WikiPageRow     = Tables<"wiki_pages">;
export type ProfileRow      = Tables<"profiles">;
export type ChatSessionRow  = Tables<"chat_sessions">;
export type ChatMessageRow  = Tables<"chat_messages">;
export type DocumentChunkRow = Tables<"document_chunks">;

// Chat message source citation (stored in chat_messages.sources JSON array)
export interface MessageSource {
  slug:       string;
  title:      string;
  excerpt:    string;
  similarity: number;
}
