"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, LayoutDashboard, LogOut, Menu, MessageSquare, Search, X } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

export function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, loading } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">

        {/* Mobile sidebar toggle */}
        <button
          onClick={onMenuToggle}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-md lg:hidden",
            "text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          )}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "Wiki AI"}
          </span>
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-sm ml-4 hidden md:block">
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md border border-input",
              "bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground",
              "hover:bg-muted transition-colors cursor-text"
            )}
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span>Search wiki…</span>
            <kbd className="ml-auto hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Mobile search */}
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md md:hidden",
              "text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            )}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* AI Chat link */}
          <Link
            href="/chat"
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md px-3",
              "text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </Link>

          <ThemeToggle />

          {/* Auth — renders nothing while loading to avoid flash */}
          {!loading && (
            user ? (
              <UserMenu
                email={user.email ?? ""}
                onSignOut={handleSignOut}
              />
            ) : (
              <Link
                href="/login"
                className={cn(
                  "inline-flex h-9 items-center rounded-md px-3 ml-1",
                  "text-sm font-medium bg-primary text-primary-foreground",
                  "hover:bg-primary/90 transition-colors"
                )}
              >
                Sign in
              </Link>
            )
          )}
        </div>
      </div>

      {/* Full-screen search modal — Phase 1 stub */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="mx-auto mt-20 max-w-lg rounded-xl border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                autoFocus
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Search wiki pages…"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 text-center text-sm text-muted-foreground">
              Full-text and semantic search — available in Phase 3.
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ── User menu dropdown ────────────────────────────────────

interface UserMenuProps {
  email: string;
  onSignOut: () => void;
}

function UserMenu({ email, onSignOut }: UserMenuProps) {
  const initial = email[0]?.toUpperCase() ?? "U";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="User menu"
        >
          {initial}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[180px] overflow-hidden rounded-lg border border-border bg-background p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <div className="truncate px-2 py-1.5 text-xs text-muted-foreground">
            {email}
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item asChild>
            <Link
              href="/dashboard"
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" />
              Dashboard
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={onSignOut}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive outline-none hover:bg-accent focus:bg-accent"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
