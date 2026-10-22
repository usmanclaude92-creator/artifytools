import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/config";

/** Builds consistent page metadata with an https://artifytools.com canonical URL. */
export function pageMetadata({
  title,
  description,
  path,
  noindex,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  /** When true, `title` is used verbatim instead of the "%s | Artify Tools" template. */
  absoluteTitle?: boolean;
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      url: absoluteUrl(path),
      locale: "en_US",
    },
    twitter: { card: "summary_large_image", title: fullTitle, description },
  };
}
