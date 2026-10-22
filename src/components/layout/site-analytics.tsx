"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Cookieless page-view counts (Vercel Web Analytics).
 * Query strings and fragments are stripped so nothing typed into a tool or
 * search box can ever leave the browser through an analytics URL.
 */
function stripQuery(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  url.search = "";
  url.hash = "";
  return { ...event, url: url.toString() };
}

/** Only Vercel deployments serve the analytics script; skip it locally to avoid a 404. */
const onVercel = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV);

export function SiteAnalytics() {
  if (!onVercel) return null;
  return <Analytics beforeSend={stripQuery} />;
}
