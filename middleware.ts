import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PATH = "/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Create a mutable response so cookie writes propagate to the browser ──
  let response = NextResponse.next({ request });

  // ── 2. Build a Supabase client with individual cookie adapters ──
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          // Write to both the request (so server components see it)
          // and the response (so the browser stores it).
          request.cookies.set({ name, value });
          response = NextResponse.next({ request });
          response.cookies.set(name, value, options as any);
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: "" });
          response = NextResponse.next({ request });
          response.cookies.set(name, "", options as any);
        },
      },
    }
  );

  // ── 3. Always refresh the session so sb-* cookies stay valid ──
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 4. Route protection — redirect unauthenticated users ──
  const isProtected =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/seller/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/orders" ||
    pathname.startsWith("/orders/");

  if (isProtected && !user) {
    const authUrl = new URL(AUTH_PATH, request.url);
    authUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(authUrl);
  }

  return response;
}

// Run on every route except static assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|assets/).*)",
  ],
};
