import type { Metadata } from "next";
import Link from "@/components/ui/locale-link";
import { PageHeader } from "@/components/layout/page-header";
import { pageMetadata } from "@/lib/seo/metadata";
import { getLocale } from "@/lib/locale-server";
import { CookiesAr, cookiesMetaAr } from "@/components/pages-ar/cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  if (locale === "ar") return pageMetadata({ ...cookiesMetaAr, path: "/cookies", locale });
  return pageMetadata({
  title: "Cookie Policy",
  description: "Artify Tools sets no cookies. This page explains the one preference saved in your browser's local storage.",
  path: "/cookies",
  });
}

export default async function CookiesPage() {
  if ((await getLocale()) === "ar") return <CookiesAr />;
  return (
    <>
      <PageHeader title="Cookie Policy" description="Last updated 22 October 2026." breadcrumbs={[{ name: "Home", href: "/" }, { name: "Cookies" }]} />
      <div className="container-page py-10">
        <div className="prose-artify">
          <h2 className="!mt-0">We don’t set cookies</h2>
          <p>Artify Tools does not set cookies and does not load advertising or cross-site tracking scripts. We count page visits with Vercel Web Analytics, which works without cookies; see the <Link href="/privacy">Privacy Policy</Link> for what it records.</p>

          <h2>What we store in your browser</h2>
          <p>The only thing saved is your colour-theme preference, if you choose one:</p>
          <ul>
            <li><code>artify-theme</code> (local storage) — stores “light” or “dark”. It stays on your device and is never sent to us.</li>
          </ul>
          <p>You can clear it at any time from your browser’s site-data settings.</p>

          <h2>Third parties</h2>
          <p>Fonts are served from our own domain. The site doesn’t embed third-party widgets. AI tools send the text you submit to an AI provider only when you press the button; see the <Link href="/privacy">Privacy Policy</Link>.</p>

          <h2>If this changes</h2>
          <p>Should we ever add cookies, we will update this page first and ask for your consent where the law requires it.</p>
        </div>
      </div>
    </>
  );
}
