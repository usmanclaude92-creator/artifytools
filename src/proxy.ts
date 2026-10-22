import { NextResponse, type NextRequest } from "next/server";
import { arabicPublic, defaultLocale, locales } from "@/lib/i18n";

/**
 * - /ar/...      served as is (noindex only while Arabic is unpublished)
 * - /en/...      redirected to the unprefixed English URL (except generated images)
 * - everything else is English: rewritten to /en/... internally, URL unchanged
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  for (const l of locales) {
    if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) {
      if (l === defaultLocale && !pathname.includes("opengraph-image") && !pathname.includes("/icon")) {
        const url = request.nextUrl.clone();
        url.pathname = pathname.slice(l.length + 1) || "/";
        return NextResponse.redirect(url, 308);
      }
      const res = NextResponse.next();
      if (l !== defaultLocale && !arabicPublic) res.headers.set("X-Robots-Tag", "noindex, follow");
      return res;
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, API routes, and files with an extension (robots.txt, sitemap.xml, icons, fonts).
  matcher: ["/((?!_next/|api/|_vercel/|.*\\.[^/]+$).*)"],
};
