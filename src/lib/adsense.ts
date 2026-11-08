/**
 * Google AdSense publisher ID, set in the NEXT_PUBLIC_ADSENSE_CLIENT environment variable as "ca-pub-1234567890123456".
 * Until it is set, no AdSense code is added to pages and /ads.txt does not exist.
 */
export function adsenseClient(): string | undefined {
  const v = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  return v && /^ca-pub-\d{10,20}$/.test(v) ? v : undefined;
}

/** The ID as written in ads.txt ("pub-…"). */
export function adsensePublisherId(): string | undefined {
  return adsenseClient()?.replace(/^ca-/, "");
}
