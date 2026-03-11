import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getLanguageFromRequest } from "@/lib/ip-detector";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const recoveryType = url.searchParams.get("type");

  // Handle password recovery redirect
  if (recoveryType === "recovery" && url.pathname !== "/update-password") {
    const redirectUrl = new URL("/update-password", request.url);
    redirectUrl.search = url.search;
    return NextResponse.redirect(redirectUrl);
  }

  // Handle docs locale redirect based on user IP
  if (url.pathname === "/docs") {
    const language = getLanguageFromRequest(request.headers);
    const localeUrl = new URL(`/${language}/docs`, request.url);
    return NextResponse.redirect(localeUrl);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
