import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SiteAnalytics } from "@/components/layout/site-analytics";
import { ToastProvider } from "@/components/ui/toast";
import { themeInitScript } from "@/components/ui/theme";
import { siteConfig } from "@/lib/config";
import { getPopularTools, getPublishedCategories, getToolsByCategory, toDirectoryItem } from "@/lib/tools/registry";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { dirOf, isLocale, locales } from "@/lib/i18n";
import { getMessages } from "@/lib/messages";
import { primaryNav } from "@/components/layout/nav-links";
import { localizeCategory, localizeTool } from "@/lib/tools/localize";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Geist is only a fallback behind Inter and the monospace face for code boxes, so neither is preloaded:
// the browser fetches them only when a page actually draws with them.
const geistSans = localFont({ src: "../../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2", variable: "--font-geist-sans", weight: "100 900", preload: false });
const geistMono = localFont({
  src: "../../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Roboto Mono", "Menlo", "Monaco", "Liberation Mono", "DejaVu Sans Mono", "Courier New", "monospace"],
  preload: false,
});
// The Arabic font (IBM Plex Sans Arabic) is declared in globals.css; Arabic pages preload the
// weights drawn above the fold.
const ARABIC_PRELOAD = ["/fonts/arabic/plex-arabic-400.woff2", "/fonts/arabic/plex-arabic-700.woff2", "/fonts/arabic/plex-latin-400.woff2"];

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = getMessages(isLocale(lang) ? lang : "en");
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: `${siteConfig.name} — ${t.site.tagline}`, template: `%s | ${siteConfig.name}` },
    description: t.site.description,
    applicationName: siteConfig.name,
    openGraph: { type: "website", siteName: siteConfig.name, locale: lang === "ar" ? "ar_AR" : "en_US" },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcf6fe" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0716" },
  ],
};

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  if (lang === "ar") ARABIC_PRELOAD.forEach((href) => preload(href, { as: "font", type: "font/woff2", crossOrigin: "" }));
  const categories = getPublishedCategories().map((c) => ({ name: localizeCategory(c, lang).name, slug: c.slug }));
  const menus: Record<string, { name: string; href: string }[]> = {};
  for (const item of primaryNav) {
    if (!item.menu) continue;
    menus[item.href] = item.menu.flatMap((id) => getToolsByCategory(id)).map((t) => ({ name: localizeTool(t, lang).name, href: `/tools/${t.slug}` }));
  }
  const suggestions = getPopularTools(6).map((t) => toDirectoryItem(t, lang));

  return (
    <html lang={lang} dir={dirOf(lang)} suppressHydrationWarning className={`${inter.variable} ${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <LocaleProvider locale={lang}>
        <ToastProvider>
          <a
            href="#main"
            className="sr-only-focusable fixed start-4 top-4 z-toast rounded-md bg-accent px-4 py-2.5 font-medium text-accent-fg"
          >
            {getMessages(lang).common.skipToContent}
          </a>
          <AnnouncementBar />
          <Header categories={categories} suggestions={suggestions} menus={menus} />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer />
        </ToastProvider>
        </LocaleProvider>
        <SiteAnalytics />
      </body>
    </html>
  );
}
