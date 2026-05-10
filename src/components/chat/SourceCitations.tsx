import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { ChatSource } from "@/types/chat";

interface Props {
  sources: ChatSource[];
}

export function SourceCitations({ sources }: Props) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-1 space-y-1.5">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <BookOpen className="h-3 w-3" />
        Sources
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, i) => (
          <Link
            key={i}
            href={`/wiki/${source.slug}`}
            title={source.excerpt}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <span>{source.title}</span>
            {source.heading && (
              <span className="text-muted-foreground/50">· {source.heading}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
