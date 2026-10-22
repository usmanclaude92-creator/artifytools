import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/config";
import { localizeHref, type Locale } from "@/lib/i18n";

/** Builds consistent page metadata with an https://tools.artifysols.com canonical URL. */
export function pageMetadata({
  title,
  description,
  path,
  noindex,
  absoluteTitle = false,
  locale = "en",
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  /** When true, `title` is used verbatim instead of the "%s | Artify Tools" template. */
  absoluteTitle?: boolean;
  locale?: Locale;
}): Metadata {
  const url = absoluteUrl(localizeHref(path, locale));
  const fullTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      url,
      locale: locale === "ar" ? "ar_AR" : "en_US",
    },
    twitter: { card: "summary_large_image", title: fullTitle, description },
  };
}
