/** The site's AdSense publisher ID (public: it appears in /ads.txt and in page source). */
const DEFAULT_CLIENT = "ca-pub-5321065144371084";

/**
 * Google AdSense publisher ID. NEXT_PUBLIC_ADSENSE_CLIENT overrides it; set it to "off" to remove all AdSense code
 * from pages and make /ads.txt return 404.
 */
export function adsenseClient(): string | undefined {
  const v = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || DEFAULT_CLIENT);
  return v && /^ca-pub-\d{10,20}$/.test(v) ? v : undefined;
}

/** The ID as written in ads.txt ("pub-…"). */
export function adsensePublisherId(): string | undefined {
  return adsenseClient()?.replace(/^ca-/, "");
}
