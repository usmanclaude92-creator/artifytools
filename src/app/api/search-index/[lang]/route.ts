import { locales } from "@/lib/i18n";
import { getSearchItems } from "@/lib/tools/registry";

/**
 * The site-search list (every tool with its keywords), one static JSON file per language.
 * Pages no longer carry it; the search box downloads it the first time someone uses search.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return Response.json(getSearchItems(lang as (typeof locales)[number]));
}
