import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request. Admin auth is
 * the ONLY auth in this product — the public app remains anonymous
 * by design (Architecture §9, Master Prompt "Privacy Requirements").
 *
 * IMPORTANT: as of Phase 5, real Supabase Auth is NOT yet wired up —
 * the admin dashboard currently uses an interim shared-secret gate
 * (see lib/admin-auth.ts) checked inside each /api/admin/* route
 * handler, not session cookies. This proxy previously crashed every
 * single /admin/* request with "Your project's URL and Key are
 * required" whenever NEXT_PUBLIC_SUPABASE_URL/ANON_KEY were unset —
 * which is the expected state until a real Supabase project exists.
 * That bug was silent through Phases 1–4 because /admin was a static
 * placeholder page that never actually exercised this matcher's
 * failure path; it surfaced the moment /admin became a real
 * server-rendered page in Phase 5.
 *
 * Guard against that: skip Supabase session refresh entirely when
 * the env vars aren't configured, rather than throwing. Once a real
 * Supabase project exists, remove this guard — at that point the
 * proxy running unconditionally is correct again.
 */
export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refreshing the session; only relevant for /admin routes.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Only run on admin routes plus anything needing auth refresh.
     * Skip static assets and public map/report pages for performance
     * (Technical Architecture §12: performance is a feature).
     */
    "/admin/:path*",
  ],
};
