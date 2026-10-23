import Link from "@/components/ui/locale-link";
import { CategoryCard } from "@/components/categories/category-card";
import { ToolGrid } from "@/components/tools/tool-card";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Badge } from "@/components/ui/misc";
import { IconTile } from "@/components/ui/misc";
import { categoryTones } from "@/lib/tools/tones";
import { getLocale, getT } from "@/lib/locale-server";
import { localizeCategory, localizeTool } from "@/lib/tools/localize";
import { getPopularTools, getPublishedCategories, getPublishedTools, getTool, getToolsByCategory, toDirectoryItem } from "@/lib/tools/registry";
import { getCategory } from "@/lib/tools/categories";
import { coreSections, moreToolSlugs } from "@/lib/home/core";
import { CoreCards, type CoreCardData } from "./core-cards";

function SectionTitle({ id, title, description, linkHref, linkLabel }: { id: string; title: string; description?: string; linkHref?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="max-w-xl">
        <h2 id={id} className="text-2xl font-bold tracking-tight sm:text-[1.7rem]">{title}</h2>
        {description && <p className="mt-2 text-[0.95rem] text-muted">{description}</p>}
      </div>
      {linkHref && linkLabel && (
        <Link href={linkHref} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline">
          {linkLabel} <Icon name="arrow-right" size={15} />
        </Link>
      )}
    </div>
  );
}

/** The core sections, right under the hero: the site's main products. */
export async function CoreSections() {
  const t = await getT();
  const locale = await getLocale();
  const usable = (slug: string) => {
    const x = getTool(slug);
    return x && x.status !== "coming-soon" ? localizeTool(x, locale) : null;
  };
  const cards: CoreCardData[] = coreSections.map((s) => {
    const text = s.text[locale];
    const cats = s.category ? [s.category, ...(s.alsoCategories ?? [])] : [];
    const catTools = cats.flatMap((id) => getToolsByCategory(id)).filter((x) => x.status !== "coming-soon").sort((a, b) => (a.popularRank ?? 99) - (b.popularRank ?? 99));
    const quick = s.quick.map(usable).filter((x) => x !== null);
    const all = cats.length ? catTools.map((x) => localizeTool(x, locale)) : quick;
    const count = cats.reduce((n, id) => n + getToolsByCategory(id).length, 0);
    return {
      id: s.id,
      icon: s.icon,
      tone: s.tone,
      href: s.category ? `/categories/${getCategory(s.category).slug}` : `/tools/${s.tool}`,
      name: text.name,
      short: text.short,
      description: text.description,
      soon: s.tool ? getTool(s.tool)?.status === "coming-soon" : false,
      quick: quick.slice(0, 3).map((x) => ({ slug: x.slug, name: x.name })),
      all: all.map((x) => ({ slug: x.slug, name: x.name })),
      categories: cats.length > 1 ? cats.map((id) => {
        const c = localizeCategory(getCategory(id), locale);
        return { href: `/categories/${c.slug}`, label: `${c.name} (${getToolsByCategory(id).length})` };
      }) : [],
      footer: cats.length ? t.common.tools(count) : t.home.openTool,
    };
  });
  return (
    <section aria-labelledby="core-heading" className="container-page pt-4 sm:pt-6">
      <SectionTitle id="core-heading" title={t.home.coreTitle} description={t.home.coreText} />
      <CoreCards cards={cards} labels={{ more: t.home.more, less: t.home.less, comingSoon: t.common.comingSoon }} />
    </section>
  );
}

/** Smaller, everyday tools in a compact list. */
export async function MoreTools() {
  const t = await getT();
  const locale = await getLocale();
  const items = moreToolSlugs.map((s) => getTool(s)).filter((x) => x && x.status === "active").map((x) => toDirectoryItem(x!, locale));
  return (
    <section aria-labelledby="more-heading" className="container-page py-10 sm:py-14">
      <SectionTitle id="more-heading" title={t.home.moreTitle} description={t.home.moreText} linkHref="/tools" linkLabel={t.home.viewAllTools} />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((tool) => (
          <li key={tool.id}>
            <Link href={`/tools/${tool.slug}`} className="card card-interactive flex min-h-16 items-center gap-3 px-4 py-3">
              <IconTile name={tool.icon} tone={categoryTones[tool.categoryId]} className="size-10" size={19} />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{tool.name}</span>
                <span className="block truncate text-xs text-muted">{tool.categoryName}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const trustIcons: IconName[] = ["zap", "lock", "check"];

export async function TrustStrip() {
  const t = await getT();
  const trustPoints = t.home.trust.map((p, i) => ({ ...p, icon: trustIcons[i]! }));
  return (
    <section aria-label={t.home.whyLabel} className="container-page py-6 sm:py-8">
      <ul className="grid gap-4 rounded-2xl border border-line bg-surface-violet p-5 sm:grid-cols-3 sm:p-6">
        {trustPoints.map((t) => (
          <li key={t.title} className="flex items-start gap-3">
            <IconTile name={t.icon} className="bg-surface" />
            <div>
              <h2 className="text-[0.95rem] font-semibold">{t.title}</h2>
              <p className="text-sm text-muted">{t.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function PopularTools() {
  const t = await getT();
  const locale = await getLocale();
  return (
    <section aria-labelledby="popular-heading" className="container-page py-10 sm:py-14">
      <SectionTitle id="popular-heading" title={t.home.popularTitle} linkHref="/tools" linkLabel={t.home.viewAllTools} />
      <div className="mt-6">
        <ToolGrid tools={getPopularTools(8).map((tool) => toDirectoryItem(tool, locale))} columns={4} />
      </div>
    </section>
  );
}

export async function CategoriesSection() {
  const t = await getT();
  const cats = getPublishedCategories();
  return (
    <section aria-labelledby="categories-heading" className="container-page py-10 sm:py-14">
      <SectionTitle
        id="categories-heading"
        title={t.home.categoriesTitle}
        description={t.home.categoriesText}
        linkHref="/categories"
        linkLabel={t.home.viewAllCategories}
      />
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cats.map((c) => (
          <li key={c.id}>
            <CategoryCard category={c} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The one dark accent on the otherwise light home page. */
export async function PromoBanner() {
  const t = await getT();
  return (
    <section aria-labelledby="promo-heading" className="container-page py-6 sm:py-8">
      <div className="banner-navy relative overflow-hidden rounded-2xl px-6 py-10 sm:px-12 sm:py-14">
        <div className="relative z-10 max-w-md">
          <h2 id="promo-heading" className="text-3xl font-bold tracking-tight sm:text-[2.1rem]">{t.home.promoTitle}</h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[#c5cbea]">
            {t.home.promoText}
          </p>
          <Link
            href="/tools"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent bg-(image:--gradient-btn) px-5 text-sm font-semibold text-accent-fg shadow-[0_10px_30px_-8px_rgba(124,58,237,0.7)] transition-colors hover:bg-(image:--gradient-btn-hover)"
          >
            {t.home.viewAllTools} <Icon name="arrow-right" size={16} />
          </Link>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-0 hidden w-[52%] md:block">
          <span className="motion-float-delayed absolute end-[44%] top-[14%] grid size-[4.25rem] place-items-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur"><Icon name="code" size={28} /></span>
          <span className="motion-float absolute end-[14%] top-[10%] grid size-[4.25rem] place-items-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur"><Icon name="image" size={28} /></span>
          <span className="motion-float absolute end-[34%] top-[38%] grid size-24 place-items-center rounded-[1.6rem] bg-gradient-to-br from-[#7b5cff] to-[#4a35f0] shadow-[0_20px_50px_-8px_rgba(101,71,255,0.9)] ring-1 ring-white/30">
            <svg viewBox="0 0 32 32" className="size-14" fill="none">
              <path d="M8 24 16 7l8 17" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11.2 18.5h9.6" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="motion-float-delayed absolute bottom-[8%] end-[10%] grid size-[4.25rem] place-items-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur"><Icon name="file-text" size={28} /></span>
        </div>
      </div>
    </section>
  );
}

const stepIcons: IconName[] = ["search", "zap", "download"];

export async function HowItWorks() {
  const t = await getT();
  const steps = t.home.steps.map((s, i) => ({ ...s, n: `0${i + 1}`, icon: stepIcons[i]! }));
  return (
    <section aria-labelledby="how-heading" className="container-page py-10 sm:py-14">
      <SectionTitle id="how-heading" title={t.home.howTitle} description={t.home.howText} linkHref="/tools" linkLabel={t.home.exploreAllTools} />
      <ol className="mt-8 grid gap-8 md:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="flex items-start gap-4">
            <span className="tile-violet grid size-12 shrink-0 place-items-center rounded-xl">
              <Icon name={s.icon} size={22} />
            </span>
            <div>
              <p className="text-xs font-bold tracking-wider text-accent-text">{s.n}</p>
              <h3 className="mt-1 text-[1.05rem] font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export async function AiShowcase() {
  const t = await getT();
  const locale = await getLocale();
  const aiTools = getPublishedTools().filter((tool) => tool.aiPowered).map((tool) => localizeTool(tool, locale));
  const planned = t.home.aiPlanned;
  return (
    <section aria-labelledby="ai-heading" className="container-page py-10 sm:py-14">
      <div className="grid items-center gap-8 rounded-2xl bg-surface-violet p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 id="ai-heading" className="text-3xl font-bold tracking-tight sm:text-[2.1rem]">{t.home.aiTitle}</h2>
          <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-muted">
            {t.home.aiText}
          </p>
          <div className="mt-6">
            <ButtonLink href="/ai-tools" className="rounded-full px-5">
              {t.home.viewAiTools} <Icon name="arrow-right" size={16} />
            </ButtonLink>
          </div>
        </div>
        <div className="banner-navy rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-sm font-bold text-accent-fg shadow-[0_8px_24px_-6px_rgba(101,71,255,0.9)]" aria-hidden="true">AI</span>
            <p className="font-semibold">{t.home.aiAssisted}</p>
          </div>
          <ul className="mt-5 space-y-2.5 text-sm">
            {aiTools.map((tool) => (
              <li key={tool.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.07] px-3.5 py-2.5">
                <Link href={`/tools/${tool.slug}`} className="inline-flex items-center gap-2 font-medium text-white hover:underline">
                  <Icon name="sparkles" size={15} className="text-[#b4a8ff]" /> {tool.name}
                </Link>
                <Badge tone="warning">{tool.status === "beta" ? t.common.beta : t.common.comingSoon}</Badge>
              </li>
            ))}
            {planned.map((p) => (
              <li key={p} className="flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-[#aeb6da]">
                <span className="inline-flex items-center gap-2"><Icon name="clock" size={15} /> {p}</span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">{t.common.planned}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const privacyIcons: IconName[] = ["lock", "laptop", "eye", "database"];

export async function PrivacySection() {
  const t = await getT();
  const published = getPublishedTools();
  const local = published.filter((tool) => tool.processingMode === "browser-local").length;
  const items = t.home.privacyItems(local, published.length).map((item, i) => ({ ...item, icon: privacyIcons[i]! }));
  return (
    <section aria-labelledby="privacy-section-heading" className="container-page py-10 sm:py-14">
      <SectionTitle id="privacy-section-heading" title={t.home.privacyTitle} description={t.home.privacyText} />
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <li key={i.title} className="flex items-start gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-accent-text shadow-[var(--shadow-sm)]">
              <Icon name={i.icon} size={19} />
            </span>
            <div>
              <h3 className="text-[0.95rem] font-semibold">{i.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{i.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6">
        <Link href="/privacy" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline">
          {t.home.readPrivacy} <Icon name="arrow-right" size={15} />
        </Link>
      </p>
    </section>
  );
}

export async function ClosingCta() {
  const t = await getT();
  return (
    <section aria-labelledby="cta-heading" className="container-page pb-6 pt-10 sm:pt-14">
      <div className="relative overflow-hidden rounded-2xl px-6 py-14 text-center sm:px-12 sm:py-16" style={{ background: "var(--gradient-cta)" }}>
        <svg aria-hidden="true" viewBox="0 0 800 200" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full opacity-60" fill="none">
          <path d="M-20 150C140 40 260 190 420 110S680 20 820 90" stroke="url(#cta-curve)" strokeWidth="1.5" />
          <path d="M-20 190C160 90 300 200 460 140S700 70 820 130" stroke="url(#cta-curve)" strokeWidth="1" />
          <defs>
            <linearGradient id="cta-curve" x1="0" x2="1">
              <stop offset="0" stopColor="#6547ff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#6547ff" stopOpacity="0.5" />
              <stop offset="1" stopColor="#3895ff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <div className="relative">
          <h2 id="cta-heading" className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-[2.2rem]">{t.home.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-lg text-[0.95rem] text-muted">{t.home.ctaText}</p>
          <div className="mt-7">
            <ButtonLink href="/tools" size="lg" className="rounded-full px-7">
              {t.home.ctaButton} <Icon name="arrow-right" size={17} />
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
