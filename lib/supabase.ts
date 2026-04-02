// ---------------------------------------------------------------------------
// Legacy anon client — used across many existing files.
// New code should use:
//   - lib/supabase/client.ts  (browser / "use client" components)
//   - lib/supabase/server.ts  (Server Components & Route Handlers)
//   - lib/supabase/admin.ts   (service-role writes)
// ---------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
