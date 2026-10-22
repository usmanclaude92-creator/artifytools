import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/config";
import { arabicPublic, localizeHref, type Locale } from "@/lib/i18n";
import { languageAlternates } from "@/lib/seo/metadata";
import { getActiveTools, getPublishedCategories } from "@/lib/tools/registry";

type Entry = { path: string; priority: number; lastModified?: Date };

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["/", "/tools", "/apps", "/categories", "/ai-tools", "/for-professionals", "/about", "/contact", "/help", "/privacy", "/terms", "/cookies", "/changelog"];
  const entries: Entry[] = [
    ...staticPaths.map((p) => ({ path: p, priority: p === "/" ? 1 : 0.6 })),
    ...getPublishedCategories().map((c) => ({ path: `/categories/${c.slug}`, priority: 0.7 })),
    ...getActiveTools().map((t) => ({ path: `/tools/${t.slug}`, priority: 0.8, lastModified: new Date(`${t.lastUpdated}T00:00:00Z`) })),
  ];
  const locales: Locale[] = arabicPublic ? ["en", "ar"] : ["en"];
  return locales.flatMap((locale) =>
    entries.map((e) => {
      const languages = languageAlternates(e.path);
      return {
        url: absoluteUrl(localizeHref(e.path, locale)),
        ...(e.lastModified ? { lastModified: e.lastModified } : {}),
        changeFrequency: "monthly" as const,
        priority: e.priority,
        ...(languages ? { alternates: { languages } } : {}),
      };
    }),
  );
}
