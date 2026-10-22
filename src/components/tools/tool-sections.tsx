import Link from "@/components/ui/locale-link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { categoryTones } from "@/lib/tools/tones";
import { Badge, IconTile } from "@/components/ui/misc";
import { getT } from "@/lib/locale-server";
import type { DirectoryItem } from "@/lib/tools/registry";
import type { ToolDefinition } from "@/lib/tools/types";

export async function PrivacyDisclosure({ tool }: { tool: ToolDefinition }) {
  const t = await getT();
  const mode = t.processing[tool.processingMode];
  const icon = tool.processingMode === "browser-local" ? "shield-check" : tool.processingMode === "server-side" ? "server" : "cloud";
  return (
    <section aria-labelledby="privacy-heading" className="card flex gap-4 p-5 sm:p-6">
      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-text">
        <Icon name={icon} />
      </span>
      <div>
        <h2 id="privacy-heading" className="text-lg font-semibold">
          {t.toolPage.privacyHeading(mode.lower)}
        </h2>
        <p className="mt-1.5 text-muted">
          {mode.description} {t.toolPage.seePolicy} <Link href="/privacy" className="text-accent-text underline underline-offset-4">{t.toolPage.privacyPolicy}</Link>.
        </p>
      </div>
    </section>
  );
}

/** Collapsible panel: the heading lives inside <summary> so the control and its label are one tab stop. */
function Accordion({ id, title, icon, defaultOpen, children }: { id: string; title: string; icon: IconName; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="group card overflow-hidden">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
        <Icon name={icon} size={18} className="text-muted" />
        <h2 id={id} className="flex-1 text-[0.95rem] font-semibold">{title}</h2>
        <Icon name="chevron-down" size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-line px-5 py-5">{children}</div>
    </details>
  );
}

export async function HowTo({ steps }: { steps: string[] }) {
  const t = await getT();
  return (
    <Accordion id="howto-heading" title={t.toolPage.howTo} icon="info" defaultOpen>
      <ol className="space-y-4">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-4">
            <span aria-hidden="true" className="tile-violet grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold">{i + 1}</span>
            <span className="pt-0.5 text-muted">{s}</span>
          </li>
        ))}
      </ol>
    </Accordion>
  );
}

export async function Examples({ examples }: { examples: ToolDefinition["examples"] }) {
  if (examples.length === 0) return null;
  const t = await getT();
  return (
    <Accordion id="examples-heading" title={t.toolPage.examples} icon="layers">
      <div className="grid gap-4 sm:grid-cols-2">
        {examples.map((ex) => (
          <figure key={ex.label} className="overflow-hidden rounded-lg border border-line">
            <figcaption className="border-b border-line bg-surface-2 px-4 py-2 text-sm font-medium">{ex.label}</figcaption>
            <dl className="space-y-3 p-4 text-sm">
              <div>
                <dt className="text-muted">{t.toolPage.input}</dt>
                <dd><pre dir="auto" className="mt-1 whitespace-pre-wrap break-words font-mono text-[0.85rem]">{ex.input}</pre></dd>
              </div>
              <div>
                <dt className="text-muted">{t.toolPage.result}</dt>
                <dd><pre dir="auto" className="mt-1 whitespace-pre-wrap break-words font-mono text-[0.85rem] font-medium">{ex.output}</pre></dd>
              </div>
            </dl>
          </figure>
        ))}
      </div>
    </Accordion>
  );
}

export async function Faq({ faqs, title }: { faqs: ToolDefinition["faqs"]; title?: string }) {
  const t = await getT();
  return (
    <Accordion id="faq-heading" title={title ?? t.toolPage.faq} icon="circle-alert">
      <dl className="space-y-5">
        {faqs.map((f) => (
          <div key={f.question}>
            <dt className="font-medium">{f.question}</dt>
            <dd className="mt-1 text-muted">{f.answer}</dd>
          </div>
        ))}
      </dl>
    </Accordion>
  );
}

/** Compact "related tools" list shown beside the accordions. */
export async function RelatedTools({ tools }: { tools: DirectoryItem[] }) {
  if (tools.length === 0) return null;
  const m = await getT();
  return (
    <section aria-labelledby="related-heading" className="card p-5">
      <h2 id="related-heading" className="text-[0.95rem] font-semibold">{m.toolPage.related}</h2>
      <ul className="mt-3 divide-y divide-line">
        {tools.map((t) => (
          <li key={t.id}>
            <Link href={`/tools/${t.slug}`} className="flex min-h-12 items-center gap-3 py-2 text-sm font-medium hover:text-accent-text">
              <IconTile name={t.icon} tone={categoryTones[t.categoryId]} size={16} className="size-8 rounded-lg" />
              <span className="flex-1">{t.name}</span>
              <Icon name="arrow-right" size={15} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Icon, title, status and a quick-facts card: the identity block at the top of every tool page. */
export async function ToolHeader({ tool, categoryName, categorySlug }: { tool: ToolDefinition; categoryName: string; categorySlug: string }) {
  const t = await getT();
  const mode = t.processing[tool.processingMode];
  const modeIcon = tool.processingMode === "browser-local" ? "laptop" : tool.processingMode === "server-side" ? "server" : "cloud";
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="flex items-start gap-4 sm:gap-5">
        <IconTile name={tool.icon} tone={categoryTones[tool.category]} size={30} className="size-14 rounded-2xl sm:size-[4.5rem]" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-[2.2rem]">{tool.name}</h1>
          <p className="mt-1.5 max-w-xl text-[0.95rem] text-muted sm:text-base">{tool.description}</p>
          <div className="mt-3">
            {tool.status === "active" ? (
              <Badge tone="success"><span aria-hidden="true" className="size-1.5 rounded-full bg-success" /> {t.toolPage.active}</Badge>
            ) : (
              <Badge tone="warning">{tool.status === "beta" ? t.common.beta : t.common.comingSoon}</Badge>
            )}
          </div>
        </div>
      </div>
      <dl className="card divide-y divide-line text-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <dt className="w-24 shrink-0 text-muted">{t.toolPage.category}</dt>
          <dd className="font-medium"><Link href={`/categories/${categorySlug}`} className="hover:text-accent-text hover:underline">{categoryName}</Link></dd>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <dt className="w-24 shrink-0 text-muted">{t.toolPage.processing}</dt>
          <dd className="inline-flex items-center gap-1.5 font-medium"><Icon name={modeIcon} size={15} className="text-accent-text" /> {mode.label}</dd>
        </div>
        <div className="flex items-start gap-3 px-4 py-3">
          <dt className="w-24 shrink-0 text-muted">{t.toolPage.privacy}</dt>
          <dd className="font-medium leading-snug">{tool.privacyNote}</dd>
        </div>
      </dl>
    </div>
  );
}

export async function StatusNotice({ tool }: { tool: ToolDefinition }) {
  if (tool.status === "active") return null;
  const t = await getT();
  if (tool.status === "coming-soon") {
    return (
      <div className="card mb-2 flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:gap-4">
        <Badge tone="warning">{t.common.comingSoon}</Badge>
        <div>
          <p className="font-semibold">{t.toolPage.comingSoonTitle}</p>
          <p className="mt-1 text-sm text-muted">{t.toolPage.comingSoonText}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="mb-6 flex items-center gap-2">
      <Badge tone="warning">{tool.status === "beta" ? t.common.beta : t.common.comingSoon}</Badge>
      <span className="text-sm text-muted">{tool.status === "beta" ? t.toolPage.betaText : t.toolPage.unavailable}</span>
    </div>
  );
}
