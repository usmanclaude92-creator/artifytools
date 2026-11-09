import { absoluteUrl, siteConfig } from "@/lib/config";
import { plain } from "@/components/guides/rich";
import { guides } from "@/lib/guides/guides";
import { guidesAr } from "@/lib/guides/guides-ar";
import { getActiveTools } from "@/lib/tools/registry";

/**
 * A plain-text map of the site for AI assistants and answer engines (the llms.txt convention): what the site is,
 * every tool with its one-line description, and every guide with its short answer.
 */
export function GET() {
  const tools = getActiveTools();
  const lines: string[] = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "Artify Tools is a free collection of PDF, image, document, finance and productivity tools. Most tools run entirely in the visitor's browser, so files are never uploaded. The site is available in English and Arabic (add /ar to any URL).",
    "",
    "## Tools",
    ...tools.map((t) => `- [${t.name}](${absoluteUrl(`/tools/${t.slug}`)}): ${t.description}`),
    "",
    "## Guides (English)",
    ...guides.map((g) => `- [${g.title}](${absoluteUrl(`/guides/${g.slug}`)}): ${plain(g.summary ?? g.description)}`),
    "",
    "## Guides (Arabic)",
    ...guidesAr.map((g) => `- [${g.title}](${absoluteUrl(`/ar/guides/${g.slug}`)}): ${plain(g.summary ?? g.description)}`),
    "",
    "## Site",
    `- [About](${absoluteUrl("/about")})`,
    `- [Privacy policy](${absoluteUrl("/privacy")})`,
    `- [Contact](${absoluteUrl("/contact")})`,
    `- [Sitemap](${absoluteUrl("/sitemap.xml")})`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
