// ---------------------------------------------------------------------------
// Supabase Server Client — for Server Components & Route Handlers
// ---------------------------------------------------------------------------
// Uses dynamic import of next/headers to avoid Turbopack build errors
// when this module is transitively imported from non-server contexts.
// ---------------------------------------------------------------------------

import { createServerClient } from "@supabase/ssr";

export async function createClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component context — can't set cookies, which is fine.
            // The middleware will handle session refresh.
          }
        },
      },
    },
  );
}
