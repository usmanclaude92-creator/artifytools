import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ToolGrid } from "@/components/tools/tool-card";
import { Icon, type IconName } from "@/components/ui/icon";
import { Badge } from "@/components/ui/misc";
import { StatusMessage } from "@/components/ui/feedback";
import { getLocale, getT } from "@/lib/locale-server";
import { pageMetadata } from "@/lib/seo/metadata";
import { getPublishedTools, toDirectoryItem } from "@/lib/tools/registry";

export async function generateMetadata(): Promise<Metadata> {
  const p = (await getT()).pages.ai;
  return pageMetadata({ title: p.metaTitle, description: p.metaDescription, path: "/ai-tools", locale: await getLocale() });
}

const plannedIcons: IconName[] = ["wand", "file-text", "layers", "list-x", "sparkles"];

export default async function AiToolsPage() {
  const locale = await getLocale();
  const t = await getT();
  const p = t.pages.ai;
  const tools = getPublishedTools().filter((tool) => tool.aiPowered).map((tool) => toDirectoryItem(tool, locale));
  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} description={p.description} breadcrumbs={[{ name: t.common.home, href: "/" }, { name: p.metaTitle }]} />
      <div className="container-page space-y-16 py-10">
        <section aria-labelledby="available-heading">
          <h2 id="available-heading" className="text-2xl font-semibold">{p.comingSoon}</h2>
          <div className="mt-5 max-w-3xl">
            <StatusMessage tone="info">{p.notice}</StatusMessage>
          </div>
          <div className="mt-6">
            <ToolGrid tools={tools} />
          </div>
        </section>

        <section aria-labelledby="planned-heading">
          <h2 id="planned-heading" className="text-2xl font-semibold">{p.planned}</h2>
          <p className="mt-2 max-w-2xl text-muted">{p.plannedText}</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.plannedItems.map((item, i) => (
              <li key={item.name} className="flex items-start gap-4 rounded-lg border border-dashed border-line-strong p-5">
                <Icon name={plannedIcons[i] ?? "sparkles"} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold">{item.name} <Badge>{p.planned}</Badge></p>
                  <p className="mt-1 text-sm text-muted">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ai-principles" className="max-w-3xl">
          <h2 id="ai-principles" className="text-2xl font-semibold">{p.approach}</h2>
          <ul className="prose-artify mt-3">
            {p.principles.map((x) => (
              <li key={x.strong}><strong>{x.strong}</strong> {x.text}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
