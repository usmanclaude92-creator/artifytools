import Link from "@/components/ui/locale-link";
import { SearchCombobox, type SearchCategoryLink } from "@/components/search/search-combobox";
import { getTool, type SearchItem } from "@/lib/tools/registry";
import { HeroVisual } from "./hero-visual";
import { getT } from "@/lib/locale-server";

const chipSlugs = ["pdf-to-word", "remove-background", "cheque-printer", "compress-pdf"].filter((s) => getTool(s));

export async function Hero({ items, categories }: { items: SearchItem[]; categories: SearchCategoryLink[] }) {
  const t = await getT();
  const chips = chipSlugs.map((slug) => ({ slug, label: t.home.chips[slug] ?? slug }));
  return (
    <section aria-labelledby="hero-heading" className="hero-wash">
      <div className="container-page grid items-center gap-10 pb-14 pt-10 sm:pt-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-4 lg:pb-10 lg:pt-14">
        <div>
          <p className="eyebrow mb-5">{t.home.eyebrow}</p>
          <h1 id="hero-heading" className="text-[2.4rem] font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[2.9rem] xl:text-[3rem]">
            {t.home.titleLine1}
            <br />
            {t.home.titleLine2}<span className="text-gradient">{t.home.titleHighlight}</span>
          </h1>
          <p className="mt-6 max-w-[34rem] text-base leading-relaxed text-muted sm:text-lg">
            {t.home.heroText}
          </p>

          <div className="mt-8 max-w-[38rem]">
            <SearchCombobox items={items} categories={categories} variant="hero" inputId="hero-search" />
            <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-2">
              <span className="text-sm text-muted">{t.home.trySearching}</span>
              {chips.map((c) => (
                <Link
                  key={c.slug}
                  href={`/tools/${c.slug}`}
                  className="inline-flex min-h-8 items-center rounded-lg border border-line bg-surface px-2.5 text-[0.78rem] font-medium text-muted shadow-[var(--shadow-sm)] transition-colors hover:border-accent hover:text-accent-text"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}
