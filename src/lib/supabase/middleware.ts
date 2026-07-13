import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
    }
  );

  // Do not remove: refreshes the session and must run before any route logic.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  // "/style-guide" is a temporary, dev-only design reference page — not
  // real product data, so no auth needed. Remove before shipping Phase 1.
  const publicRoutes = ["/login", "/forgot-password", "/style-guide"];
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith("/auth/callback");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/forgot-password")) {
    const url = request.nextUrl.clone();
    // "/" resolves to the user's actual active school — there's no flat
    // "/dashboard" route anymore since routing moved to /{schoolSlug}/....
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
