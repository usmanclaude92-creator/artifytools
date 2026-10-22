import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { GeistMono } from "geist/font/mono";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SiteAnalytics } from "@/components/layout/site-analytics";
import { ToastProvider } from "@/components/ui/toast";
import { themeInitScript } from "@/components/ui/theme";
import { siteConfig } from "@/lib/config";
import { getPopularTools, getPublishedCategories, getSearchItems, toDirectoryItem } from "@/lib/tools/registry";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { dirOf, isLocale, locales } from "@/lib/i18n";
import { getMessages } from "@/lib/messages";
import { localizeCategory } from "@/lib/tools/localize";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-arabic", display: "swap", preload: false });

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
  const items = getSearchItems(lang);
  const categories = getPublishedCategories().map((c) => ({ name: localizeCategory(c, lang).name, slug: c.slug }));
  const suggestions = getPopularTools(6).map((t) => toDirectoryItem(t, lang));

  return (
    <html lang={lang} dir={dirOf(lang)} suppressHydrationWarning className={`${inter.variable} ${GeistSans.variable} ${GeistMono.variable}${lang === "ar" ? ` ${arabic.variable}` : ""}`}>
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
          <Header items={items} categories={categories} suggestions={suggestions} />
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
