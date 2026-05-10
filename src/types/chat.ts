export interface ChatSource {
  slug: string;
  title: string;
  heading: string;
  excerpt: string;
  similarity: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  isStreaming?: boolean;
  createdAt: Date;
}
