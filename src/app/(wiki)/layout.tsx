// Server Component — runs at build time (SSG) or request time (SSR).
// Reads the content/ directory to build navigation, then passes it
// down to WikiShell which owns the client-side sidebar toggle state.
import { buildNavigation } from "@/lib/content/navigation";
import { WikiShell } from "@/components/layout/WikiShell";

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // buildNavigation() reads the filesystem synchronously.
  // This is safe here because layout is a Server Component.
  const navigation = buildNavigation();

  return <WikiShell navigation={navigation}>{children}</WikiShell>;
}
