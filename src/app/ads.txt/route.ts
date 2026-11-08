import { adsensePublisherId } from "@/lib/adsense";

/** Authorizes Google to sell ads on this site. Served only once the AdSense publisher ID is configured. */
export function GET() {
  const pub = adsensePublisherId();
  if (!pub) return new Response("Not found", { status: 404 });
  return new Response(`google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
