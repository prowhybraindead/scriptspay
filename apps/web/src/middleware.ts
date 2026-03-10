import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const recoveryType = url.searchParams.get("type");

  if (recoveryType === "recovery" && url.pathname !== "/update-password") {
    const redirectUrl = new URL("/update-password", request.url);
    redirectUrl.search = url.search;
    return NextResponse.redirect(redirectUrl);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
