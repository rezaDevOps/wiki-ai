import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Browser client — use inside Client Components and event handlers.
// Reads/writes the Supabase session from localStorage.
// Never use in Server Components or Route Handlers — use server.ts instead.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
