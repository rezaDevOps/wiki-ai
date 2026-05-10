import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "Ask questions about the wiki using AI",
};

// Suspense is required because ChatInterface uses useSearchParams()
export default function ChatPage() {
  return (
    <Suspense>
      <ChatInterface />
    </Suspense>
  );
}
