import type { Metadata } from "next";
import Link from "@/components/ui/locale-link";
import { PageHeader } from "@/components/layout/page-header";
import { ToolGrid } from "@/components/tools/tool-card";
import { Icon } from "@/components/ui/icon";
import { getLocale, getT } from "@/lib/locale-server";
import { pageMetadata } from "@/lib/seo/metadata";
import { getTool, toDirectoryItem } from "@/lib/tools/registry";

export async function generateMetadata(): Promise<Metadata> {
  const p = (await getT()).pages.pros;
  return pageMetadata({ title: p.metaTitle, description: p.metaDescription, path: "/for-professionals", locale: await getLocale() });
}

const groups = [
  { id: "developers", tools: ["json-formatter", "base64-encoder-decoder", "url-encoder-decoder", "uuid-generator", "color-converter"] },
  { id: "finance", tools: ["vat-calculator", "discount-calculator", "percentage-calculator", "date-difference"] },
  { id: "writers", tools: ["word-counter", "case-converter", "text-cleaner", "remove-duplicate-lines"] },
  { id: "security", tools: ["password-generator", "qr-code-generator"] },
] as const;

export default async function ForProfessionalsPage() {
  const locale = await getLocale();
  const t = await getT();
  const p = t.pages.pros;
  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} description={p.description} breadcrumbs={[{ name: t.common.home, href: "/" }, { name: t.nav.forProfessionals }]} />
      <div className="container-page space-y-16 py-10">
        {groups.map((g) => {
          const tools = g.tools.map((id) => getTool(id)).filter((tool) => tool !== undefined).map((tool) => toDirectoryItem(tool, locale));
          const text = p.groups[g.id];
          return (
            <section key={g.id} aria-labelledby={`${g.id}-heading`}>
              <h2 id={`${g.id}-heading`} className="text-2xl font-semibold">{text.title}</h2>
              <p className="mt-2 max-w-2xl text-muted">{text.text}</p>
              <div className="mt-6">
                <ToolGrid tools={tools} />
              </div>
            </section>
          );
        })}

        <section aria-labelledby="roadmap-heading" className="card max-w-3xl p-6 sm:p-8">
          <h2 id="roadmap-heading" className="flex items-center gap-2 text-xl font-semibold">
            <Icon name="clock" className="text-accent-text" /> {p.radar}
          </h2>
          <p className="mt-3 text-muted">
            {p.radarText}{" "}
            <Link href="/contact" className="text-accent-text underline underline-offset-4">{p.tellUs}</Link>.
          </p>
        </section>
      </div>
    </>
  );
}
