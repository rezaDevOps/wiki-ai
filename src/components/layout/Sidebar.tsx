"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem, NavSection } from "@/types/wiki";

interface SidebarProps {
  navigation: NavSection[];
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ navigation, open = true, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 shrink-0",
          "border-r border-sidebar-border bg-sidebar",
          "overflow-y-auto transition-transform duration-200 ease-in-out",
          // Desktop: always visible
          "lg:sticky lg:translate-x-0",
          // Mobile: slide in/out
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <nav className="p-4 space-y-6">
          {navigation.map((section) => (
            <SidebarSection key={section.title} section={section} />
          ))}
        </nav>
      </aside>
    </>
  );
}

function SidebarSection({ section }: { section: NavSection }) {
  return (
    <div>
      <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
        {section.title}
      </p>
      <ul className="space-y-0.5">
        {section.items.map((item) => (
          <SidebarItem key={item.href} item={item} depth={0} />
        ))}
      </ul>
    </div>
  );
}

function SidebarItem({ item, depth }: { item: NavItem; depth: number }) {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.href;
  const isChildActive = item.children?.some((c) => pathname === c.href) ?? false;
  const [expanded, setExpanded] = useState(isChildActive);

  return (
    <li>
      <div className="flex items-center">
        {hasChildren ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            )}
            style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                expanded && "rotate-90"
              )}
            />
            <span className="truncate">{item.title}</span>
          </button>
        ) : (
          <Link
            href={item.href}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            )}
            style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{item.title}</span>
          </Link>
        )}
      </div>

      {hasChildren && expanded && (
        <ul className="mt-0.5 space-y-0.5">
          {item.children!.map((child) => (
            <SidebarItem key={child.href} item={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
