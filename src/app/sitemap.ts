import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/config";
import { getActiveTools, getPublishedCategories } from "@/lib/tools/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["/", "/tools", "/apps", "/categories", "/ai-tools", "/for-professionals", "/about", "/contact", "/help", "/privacy", "/terms", "/cookies", "/changelog"];
  return [
    ...staticPaths.map((p) => ({ url: absoluteUrl(p), changeFrequency: "monthly" as const, priority: p === "/" ? 1 : 0.6 })),
    ...getPublishedCategories().map((c) => ({ url: absoluteUrl(`/categories/${c.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...getActiveTools().map((t) => ({
      url: absoluteUrl(`/tools/${t.slug}`),
      lastModified: new Date(`${t.lastUpdated}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
