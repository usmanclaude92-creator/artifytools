import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToastProvider } from "@/components/ui/toast";
import { themeInitScript } from "@/components/ui/theme";
import { siteConfig } from "@/lib/config";
import { getPopularTools, getPublishedCategories, getSearchItems, toDirectoryItem } from "@/lib/tools/registry";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} — ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: { type: "website", siteName: siteConfig.name, locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfe" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1028" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const items = getSearchItems();
  const categories = getPublishedCategories().map((c) => ({ name: c.name, slug: c.slug }));
  const suggestions = getPopularTools(6).map(toDirectoryItem);

  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <ToastProvider>
          <a
            href="#main"
            className="sr-only-focusable fixed left-4 top-4 z-toast rounded-md bg-accent px-4 py-2.5 font-medium text-accent-fg"
          >
            Skip to main content
          </a>
          <Header items={items} categories={categories} suggestions={suggestions} />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
