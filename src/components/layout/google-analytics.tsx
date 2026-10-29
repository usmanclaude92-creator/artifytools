"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";

/** Google Analytics 4 measurement ID. */
const GA_ID = "G-3ENMEZHTYZ";
const KEY = "artify-analytics-consent";
const EVENT = "artify-consent-change";
type Choice = "granted" | "denied" | null;

/** Only the live site reports to Google Analytics, so previews, local runs and tests stay out of the numbers. */
const live = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

function read(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}
function useConsent(): Choice | "unknown" {
  return useSyncExternalStore(subscribe, read, () => "unknown" as const);
}
export function setConsent(choice: "granted" | "denied") {
  try { localStorage.setItem(KEY, choice); } catch { /* storage blocked: the choice lasts until the page closes */ }
  window.gtag?.("consent", "update", { analytics_storage: choice });
  window.dispatchEvent(new Event(EVENT));
}

const strings = {
  en: { text: "We count visits with Google Analytics. Until you accept it sets no cookies and sends only anonymous, cookieless pings. Accepting lets it use cookies to count returning visitors. Nothing you type into a tool is included.", accept: "Accept", decline: "Decline", more: "Cookie policy", label: "Analytics choice" },
  ar: { text: "نحصي الزيارات عبر Google Analytics. قبل موافقتك لا يضع ملفات تعريف ارتباط ولا يرسل سوى إشارات مجهولة دون ملفات. وبموافقتك يستخدم الملفات لإحصاء الزوار العائدين. لا يُرسل أي شيء تكتبه داخل الأدوات.", accept: "موافق", decline: "رفض", more: "سياسة ملفات تعريف الارتباط", label: "خيار التحليلات" },
};

declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
}

/** Reports each page view with the query string and fragment removed, so nothing typed into a tool leaves the browser. */
function PageViews() {
  const path = usePathname();
  useEffect(() => {
    window.gtag?.("event", "page_view", { page_location: `${location.origin}${path}`, page_path: path, page_title: document.title });
  }, [path]);
  return null;
}

/**
 * Google Consent Mode: the tag always loads, but with storage denied it sets no cookies and sends only cookieless
 * pings. Accepting turns analytics cookies on. The choice is remembered and applied before the first page view.
 */
export function GoogleAnalytics() {
  const consent = useConsent();
  const t = strings[useLocale()];
  const locale = useLocale();
  if (!live) return null;
  const banner = consent === null && (
      <div role="region" aria-label={t.label} className="fixed inset-x-3 bottom-3 z-toast mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-overlay sm:flex-row sm:items-center">
        <p className="flex-1 text-sm">{t.text} <a className="underline" href={locale === "ar" ? "/ar/cookies" : "/cookies"}>{t.more}</a></p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConsent("denied")}>{t.decline}</Button>
          <Button size="sm" onClick={() => setConsent("granted")}>{t.accept}</Button>
        </div>
      </div>
  );
  return (
    <>
      {banner}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;var c=null;try{c=localStorage.getItem('${KEY}')}catch(e){}gtag('consent','default',{analytics_storage:c==='granted'?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});`}</Script>
      <PageViews />
    </>
  );
}

/** Lets a visitor change their mind (shown on the cookie policy). */
export function AnalyticsChoice({ labels }: { labels: { unset: string; on: string; off: string; accept: string; decline: string } }) {
  const consent = useConsent();
  if (consent === "unknown") return null;
  return (
    <div className="not-prose flex flex-wrap items-center gap-3 rounded-lg border border-line p-4">
      <p className="flex-1 text-sm">{consent === null ? labels.unset : consent === "granted" ? labels.on : labels.off}</p>
      <Button variant="secondary" size="sm" onClick={() => setConsent("denied")} disabled={consent === "denied"}>{labels.decline}</Button>
      <Button size="sm" onClick={() => setConsent("granted")} disabled={consent === "granted"}>{labels.accept}</Button>
    </div>
  );
}
