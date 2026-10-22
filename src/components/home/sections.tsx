import Link from "next/link";
import { CategoryCard } from "@/components/categories/category-card";
import { ToolGrid } from "@/components/tools/tool-card";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Badge } from "@/components/ui/misc";
import { getPopularTools, getPublishedCategories, getPublishedTools, toDirectoryItem } from "@/lib/tools/registry";

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

export function PopularTools() {
  return (
    <section aria-labelledby="popular-heading" className="container-page py-10 sm:py-14">
      <SectionTitle id="popular-heading" title="Popular tools" linkHref="/tools" linkLabel="View all tools" />
      <div className="mt-6">
        <ToolGrid tools={getPopularTools(5).map(toDirectoryItem)} columns={5} />
      </div>
    </section>
  );
}

export function CategoriesSection() {
  const cats = getPublishedCategories();
  return (
    <section aria-labelledby="categories-heading" className="container-page py-10 sm:py-14">
      <SectionTitle
        id="categories-heading"
        title="Browse by category"
        description="Find the perfect tool for your needs. Explore by category and discover what you can do."
        linkHref="/categories"
        linkLabel="View all categories"
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
export function PromoBanner() {
  return (
    <section aria-labelledby="promo-heading" className="container-page py-6 sm:py-8">
      <div className="banner-navy relative overflow-hidden rounded-2xl px-6 py-10 sm:px-12 sm:py-14">
        <div className="relative z-10 max-w-md">
          <h2 id="promo-heading" className="text-3xl font-bold tracking-tight sm:text-[2.1rem]">Small tasks. Big time savings.</h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[#c5cbea]">
            Explore our most useful tools, from everyday utilities to advanced developer tools.
          </p>
          <Link
            href="/tools"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg shadow-[0_10px_30px_-8px_rgba(101,71,255,0.8)] transition-colors hover:bg-accent-hover"
          >
            View all tools <Icon name="arrow-right" size={16} />
          </Link>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] md:block">
          <span className="motion-float-delayed absolute right-[44%] top-[14%] grid size-[4.25rem] place-items-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur"><Icon name="code" size={28} /></span>
          <span className="motion-float absolute right-[14%] top-[10%] grid size-[4.25rem] place-items-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur"><Icon name="image" size={28} /></span>
          <span className="motion-float absolute right-[34%] top-[38%] grid size-24 place-items-center rounded-[1.6rem] bg-gradient-to-br from-[#7b5cff] to-[#4a35f0] shadow-[0_20px_50px_-8px_rgba(101,71,255,0.9)] ring-1 ring-white/30">
            <svg viewBox="0 0 32 32" className="size-14" fill="none">
              <path d="M8 24 16 7l8 17" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11.2 18.5h9.6" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="motion-float-delayed absolute bottom-[8%] right-[10%] grid size-[4.25rem] place-items-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur"><Icon name="file-text" size={28} /></span>
        </div>
      </div>
    </section>
  );
}

const steps: { n: string; title: string; text: string; icon: IconName }[] = [
  { n: "01", title: "Find your tool", text: "Search or browse the collection.", icon: "search" },
  { n: "02", title: "Get it done", text: "Use an intuitive interface designed for the task.", icon: "zap" },
  { n: "03", title: "Take your result", text: "Copy, download, or export the output when supported.", icon: "download" },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="container-page py-10 sm:py-14">
      <SectionTitle id="how-heading" title="How Artify Tools works" description="Get started in three simple steps." linkHref="/tools" linkLabel="Explore all tools" />
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

export function AiShowcase() {
  const aiTools = getPublishedTools().filter((t) => t.aiPowered);
  const planned = ["AI Writing Assistant", "Information Extractor", "Document Assistant"];
  return (
    <section aria-labelledby="ai-heading" className="container-page py-10 sm:py-14">
      <div className="grid items-center gap-8 rounded-2xl bg-surface-violet p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 id="ai-heading" className="text-3xl font-bold tracking-tight sm:text-[2.1rem]">Meet a smarter way to work.</h2>
          <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-muted">
            Selected tools can help you write, summarize, extract information, and work more efficiently. Today the AI Text Summarizer is in beta; the rest are planned. We tell you plainly when your text is sent to an AI provider.
          </p>
          <div className="mt-6">
            <ButtonLink href="/ai-tools" className="rounded-full px-5">
              View AI tools <Icon name="arrow-right" size={16} />
            </ButtonLink>
          </div>
        </div>
        <div className="banner-navy rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-sm font-bold text-accent-fg shadow-[0_8px_24px_-6px_rgba(101,71,255,0.9)]" aria-hidden="true">AI</span>
            <p className="font-semibold">AI-assisted tools</p>
          </div>
          <ul className="mt-5 space-y-2.5 text-sm">
            {aiTools.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.07] px-3.5 py-2.5">
                <Link href={`/tools/${t.slug}`} className="inline-flex items-center gap-2 font-medium text-white hover:underline">
                  <Icon name="sparkles" size={15} className="text-[#b4a8ff]" /> {t.name}
                </Link>
                <Badge tone="warning">Beta</Badge>
              </li>
            ))}
            {planned.map((p) => (
              <li key={p} className="flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-[#aeb6da]">
                <span className="inline-flex items-center gap-2"><Icon name="clock" size={15} /> {p}</span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">Planned</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function PrivacySection() {
  const published = getPublishedTools();
  const local = published.filter((t) => t.processingMode === "browser-local").length;
  const items: { icon: IconName; title: string; text: string }[] = [
    { icon: "lock", title: "Privacy first", text: "No account is needed to use any tool, and the site runs no advertising or analytics scripts." },
    { icon: "laptop", title: "Local processing, where supported", text: `${local} of our ${published.length} tools process your input entirely in your browser.` },
    { icon: "eye", title: "Transparent data handling", text: "Each tool page states whether data stays on your device, goes to an Artify server, or is shared with an external provider." },
    { icon: "database", title: "No unnecessary storage", text: "We don’t store the text, files, or values you enter into the tools." },
  ];
  return (
    <section aria-labelledby="privacy-section-heading" className="container-page py-10 sm:py-14">
      <SectionTitle id="privacy-section-heading" title="Your work deserves thoughtful protection." description="We care about your privacy. Here’s how we handle your data." />
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
          Read our Privacy Policy <Icon name="arrow-right" size={15} />
        </Link>
      </p>
    </section>
  );
}

export function ClosingCta() {
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
          <h2 id="cta-heading" className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-[2.2rem]">Whatever you need to get done, start here.</h2>
          <p className="mx-auto mt-3 max-w-lg text-[0.95rem] text-muted">Explore the collection and find a simpler way to work.</p>
          <div className="mt-7">
            <ButtonLink href="/tools" size="lg" className="rounded-full px-7">
              Explore All Tools <Icon name="arrow-right" size={17} />
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
