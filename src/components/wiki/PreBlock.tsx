"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

// PreBlock is a Client Component so it can:
// 1. Track copy state (useState)
// 2. Read innerText from the DOM to get the raw code string

type PreBlockProps = React.HTMLAttributes<HTMLPreElement> & {
  "data-language"?: string;
  "data-theme"?: string;
};

export function PreBlock({
  children,
  className,
  ...props
}: PreBlockProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const language = props["data-language"];

  const handleCopy = async () => {
    const code = preRef.current?.innerText ?? "";
    await navigator.clipboard.writeText(code.trimEnd());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-lg border border-zinc-700/50 bg-zinc-900 overflow-hidden">
      {/* Top bar: language label + copy button */}
      <div className="flex items-center justify-between border-b border-zinc-700/60 px-4 py-1.5 bg-zinc-800/50">
        <span className="text-xs font-mono text-muted-foreground">
          {language ?? "code"}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-all",
            "opacity-0 group-hover:opacity-100",
            copied
              ? "text-green-500"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code content — rehype-pretty-code sets token colors via CSS vars */}
      <pre
        ref={preRef}
        className={cn("overflow-x-auto p-4 text-sm leading-relaxed", className)}
        {...props}
      >
        {children}
      </pre>
    </div>
  );
}
