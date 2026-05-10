import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your saved chat history",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Middleware already guards /dashboard, but be defensive
  if (!user) redirect("/login?next=/dashboard");

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Header row */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chat History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your saved conversations with the wiki AI.
          </p>
        </div>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Link>
      </div>

      {sessions && sessions.length > 0 ? (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                href={`/chat?session=${session.id}`}
                className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:bg-accent"
              >
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{session.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(session.updated_at)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No conversations yet.</p>
          <Link
            href="/chat"
            className="mt-3 inline-block text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Start your first chat →
          </Link>
        </div>
      )}
    </div>
  );
}
