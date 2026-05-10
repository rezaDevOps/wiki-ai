import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <BookOpen className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold">
          {process.env.NEXT_PUBLIC_APP_NAME ?? "Wiki AI"}
        </span>
      </Link>

      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
