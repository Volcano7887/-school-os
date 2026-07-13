import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Named `proxy` (not `middleware`) — this Next.js version renamed the file
// convention. See node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
