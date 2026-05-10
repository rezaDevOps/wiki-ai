import Link from "next/link";
import { ExternalLink } from "lucide-react";

// Server Component — no "use client" needed.
// Next.js Link works in server components; external links get a visual indicator.

interface WikiLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
}

export function WikiLink({ href = "#", children, ...props }: WikiLinkProps) {
  // Anchor-only link — no navigation
  if (href.startsWith("#")) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  // External link — open in new tab with security attributes
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
        <ExternalLink className="inline-block ml-0.5 h-3 w-3 align-baseline shrink-0" />
      </a>
    );
  }

  // Internal link — use Next.js Link for client-side SPA navigation
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}
