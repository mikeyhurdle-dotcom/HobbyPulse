// ---------------------------------------------------------------------------
// Legacy anon client — used across many existing files.
// New code should use:
//   - lib/supabase/client.ts  (browser / "use client" components)
//   - lib/supabase/server.ts  (Server Components & Route Handlers)
//   - lib/supabase/admin.ts   (service-role writes)
// ---------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

// Avoid hard-crashing at import-time during preview builds where env vars may
// be temporarily missing. In production, real env values should always be set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn("[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Using placeholder client.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
