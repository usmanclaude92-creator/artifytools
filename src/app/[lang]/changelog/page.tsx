import type { Metadata } from "next";
import Link from "@/components/ui/locale-link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/misc";
import { pageMetadata } from "@/lib/seo/metadata";
import { getActiveTools, getPublishedTools } from "@/lib/tools/registry";

export const metadata: Metadata = pageMetadata({
  title: "Changelog",
  description: "What's new in Artify Tools: new tools, improvements, and fixes.",
  path: "/changelog",
});

export default function ChangelogPage() {
  const active = getActiveTools();
  const beta = getPublishedTools().filter((t) => t.status === "beta");
  return (
    <>
      <PageHeader title="Changelog" description="New tools, improvements, and fixes." breadcrumbs={[{ name: "Home", href: "/" }, { name: "Changelog" }]} />
      <div className="container-page py-10">
        <article className="max-w-3xl" aria-labelledby="v010">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="v010" className="text-2xl font-semibold">Version 0.1 — First release</h2>
            <Badge tone="accent">21 October 2026</Badge>
          </div>
          <div className="prose-artify mt-2">
            <p>The first public release of the Artify Tools platform.</p>
            <h3>Tools ({active.length})</h3>
            <ul>
              {active.map((t) => (
                <li key={t.id}><Link href={`/tools/${t.slug}`}>{t.name}</Link> — {t.description}</li>
              ))}
            </ul>
            {beta.length > 0 && (
              <>
                <h3>Beta</h3>
                <ul>
                  {beta.map((t) => (
                    <li key={t.id}><Link href={`/tools/${t.slug}`}>{t.name}</Link> — needs a server-side API key to work.</li>
                  ))}
                </ul>
              </>
            )}
            <h3>Platform</h3>
            <ul>
              <li>Universal search across tool names, descriptions, and keywords, with keyboard navigation (Ctrl/⌘ K).</li>
              <li>Searchable, filterable directory with shareable URLs.</li>
              <li>Light and dark themes, reduced-motion support, and accessible navigation.</li>
              <li>Per-tool privacy disclosures stating where your data is processed.</li>
            </ul>
          </div>
        </article>
      </div>
    </>
  );
}
