import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Admin client — uses the service role key which bypasses ALL RLS policies.
//
// NEVER import this file in Client Components or expose it to the browser.
// Use only in:
//   - scripts/ingest.ts (GitHub Actions ingestion pipeline)
//   - Internal API routes that require elevated permissions
//   - Database admin utilities
//
// If SUPABASE_SERVICE_ROLE_KEY is missing, the call fails loudly at startup
// rather than silently using the wrong key.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. " +
        "Add it to .env.local (never commit this value)."
    );
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
