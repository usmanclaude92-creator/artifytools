import type { Metadata } from "next";
import Link from "@/components/ui/locale-link";
import { PageHeader } from "@/components/layout/page-header";
import { Icon, type IconName } from "@/components/ui/icon";
import { pageMetadata } from "@/lib/seo/metadata";
import { getActiveTools, getPublishedCategories } from "@/lib/tools/registry";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: "Artify Tools is a collection of useful, thoughtfully designed online tools. Learn what we're building and the principles behind it.",
  path: "/about",
});

const principles: { icon: IconName; title: string; text: string }[] = [
  { icon: "zap", title: "Simple first", text: "A tool should do one job clearly. We cut steps, options, and noise until the task feels obvious." },
  { icon: "shield-check", title: "Private by design", text: "When a tool can run in your browser, it does. When it can't, we say exactly where your data goes." },
  { icon: "circle-check", title: "Correct and careful", text: "Calculators use exact decimal arithmetic. Parsers explain errors. Edge cases are tested, not hoped for." },
  { icon: "laptop", title: "Accessible to everyone", text: "Keyboard-friendly, screen-reader-aware, readable at any size, and respectful of reduced-motion settings." },
];

export default function AboutPage() {
  const active = getActiveTools().length;
  const cats = getPublishedCategories().length;
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Powerful tools. Beautifully simple."
        description="Artify Tools is one tidy destination for the small digital tasks that interrupt your day: counting, converting, calculating, formatting, and generating."
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "About" }]}
      />
      <div className="container-page space-y-16 py-10">
        <section className="prose-artify" aria-labelledby="mission">
          <h2 id="mission" className="!mt-0">What we’re building</h2>
          <p>
            Most online utilities are cluttered, slow, or vague about what they do with your input. We think everyday tools deserve the care usually reserved for big products: a clear interface, correct results, and honest privacy.
          </p>
          <p>
            Today Artify offers <strong>{active} working tools</strong> across <strong>{cats} categories</strong>, with more planned for images, documents, and AI-assisted work. We add a tool only when it genuinely works, and we label anything experimental as beta.
          </p>
        </section>

        <section aria-labelledby="principles-heading">
          <h2 id="principles-heading" className="text-2xl font-semibold">Principles</h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2">
            {principles.map((p) => (
              <li key={p.title} className="card p-6">
                <Icon name={p.icon} size={26} className="text-accent-text" />
                <h3 className="mt-4 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-muted">{p.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="prose-artify" aria-labelledby="next-heading">
          <h2 id="next-heading" className="!mt-0">Where we’re headed</h2>
          <p>
            Next on the roadmap are image tools (resize, compress, convert), PDF tools (merge, split, extract pages), more developer utilities, and AI-assisted tools. These are plans, not promises of dates; you can follow progress in the <Link href="/changelog">changelog</Link>.
          </p>
          <p>
            Have a suggestion or found a problem? <Link href="/contact">Get in touch</Link>.
          </p>
        </section>
      </div>
    </>
  );
}
