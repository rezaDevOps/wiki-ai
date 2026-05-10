"use client";

// WikiShell is the only Client Component in the layout tree.
// The parent (wiki layout) is a Server Component so it can call
// buildNavigation() at request/build time. We push client-side
// state (sidebar open/close) down here to keep the boundary minimal.

import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import type { NavSection } from "@/types/wiki";

interface WikiShellProps {
  navigation: NavSection[];
  children: React.ReactNode;
}

export function WikiShell({ navigation, children }: WikiShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuToggle={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
      />
      <div className="flex">
        <Sidebar
          navigation={navigation}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
