import type { Metadata } from "next";
import Link from "@/components/ui/locale-link";
import { PageHeader } from "@/components/layout/page-header";
import { pageMetadata } from "@/lib/seo/metadata";
import { getLocale } from "@/lib/locale-server";
import { AnalyticsChoice } from "@/components/layout/google-analytics";
import { CookiesAr, cookiesMetaAr } from "@/components/pages-ar/cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  if (locale === "ar") return pageMetadata({ ...cookiesMetaAr, path: "/cookies", locale });
  return pageMetadata({
  title: "Cookie Policy",
  description: "What Artify Tools stores in your browser: a theme preference, and Google Analytics cookies only if you accept.",
  path: "/cookies",
  });
}

export default async function CookiesPage() {
  if ((await getLocale()) === "ar") return <CookiesAr />;
  return (
    <>
      <PageHeader title="Cookie Policy" description="Last updated 29 October 2026." breadcrumbs={[{ name: "Home", href: "/" }, { name: "Cookies" }]} />
      <div className="container-page py-10">
        <div className="prose-artify">
          <h2 className="!mt-0">Cookies only if you accept</h2>
          <p>Artify Tools sets no cookies until you agree. We count page visits with Vercel Web Analytics, which works without cookies, and with Google Analytics. Google Analytics starts in a restricted mode, with no cookies and no identifiers, and only sends anonymous pings (page address without its query string, browser and device type, approximate location). If you accept, it also sets cookies. We load no advertising or cross-site tracking scripts; see the <Link href="/privacy">Privacy Policy</Link> for what is recorded.</p>
          <AnalyticsChoice labels={{ unset: "You haven’t chosen yet. Google Analytics is in cookieless mode.", on: "Analytics cookies are on.", off: "Analytics cookies are off (cookieless mode).", accept: "Accept", decline: "Decline" }} />

          <h2>Google Analytics cookies</h2>
          <ul>
            <li><code>_ga</code> and <code>_ga_G-3ENMEZHTYZ</code> — set by Google Analytics only after you accept. They tell visits apart so we can count them, and last up to two years.</li>
          </ul>
          <p>We turn off Google’s advertising features, and we remove query strings from the page address before sending it. Choose Decline above (or clear your site data) to turn the cookies off at any time.</p>

          <h2>What we store in your browser</h2>
          <p>The only thing saved is your colour-theme preference, if you choose one:</p>
          <ul>
            <li><code>artify-theme</code> (local storage) — stores “light” or “dark”. It stays on your device and is never sent to us.</li>
          </ul>
          <p>You can clear it at any time from your browser’s site-data settings.</p>

          <h2>Third parties</h2>
          <p>Fonts are served from our own domain. The site doesn’t embed third-party widgets. AI tools send the text you submit to an AI provider only when you press the button; see the <Link href="/privacy">Privacy Policy</Link>.</p>

          <h2>If this changes</h2>
          <p>If we add other cookies, we will update this page first and ask for your consent where the law requires it.</p>
        </div>
      </div>
    </>
  );
}
