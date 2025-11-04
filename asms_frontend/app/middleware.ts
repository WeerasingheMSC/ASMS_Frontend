import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Redirect /Employee (or other capitalized variants) to lowercase /employee
  if (pathname.startsWith("/Employee")) {
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/Employee/:path*", "/Employee"],
};
