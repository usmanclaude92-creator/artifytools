import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ToolGrid } from "@/components/tools/tool-card";
import { Icon, type IconName } from "@/components/ui/icon";
import { Badge } from "@/components/ui/misc";
import { StatusMessage } from "@/components/ui/feedback";
import { pageMetadata } from "@/lib/seo/metadata";
import { getPublishedTools, toDirectoryItem } from "@/lib/tools/registry";

export const metadata: Metadata = pageMetadata({
  title: "AI Tools",
  description: "AI-assisted tools from Artify: what works today, what requires configuration, and what is planned — with honest privacy disclosures.",
  path: "/ai-tools",
});

const planned: { name: string; text: string; icon: IconName }[] = [
  { name: "AI Writing Assistant", text: "Draft, rephrase, and tighten text.", icon: "wand" },
  { name: "AI Email Writer", text: "Turn bullet points into a clear email.", icon: "file-text" },
  { name: "AI Document Summarizer", text: "Summarize longer documents and files.", icon: "layers" },
  { name: "AI Information Extractor", text: "Pull names, dates, and figures out of text.", icon: "list-x" },
  { name: "AI Data Explainer", text: "Explain what a table or dataset shows.", icon: "sparkles" },
];

export default function AiToolsPage() {
  const tools = getPublishedTools().filter((t) => t.aiPowered).map(toDirectoryItem);
  return (
    <>
      <PageHeader
        eyebrow="AI tools"
        title="Meet a smarter way to work."
        description="AI can take care of the heavy reading and rewriting. We only list what actually works, and we say clearly when your text leaves your device."
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "AI Tools" }]}
      />
      <div className="container-page space-y-16 py-10">
        <section aria-labelledby="available-heading">
          <h2 id="available-heading" className="text-2xl font-semibold">Coming soon</h2>
          <div className="mt-5 max-w-3xl">
            <StatusMessage tone="info">
              AI tools are the exception to Artify’s “runs in your browser” approach: the text you submit will be sent through an Artify server to a third-party AI provider. We’re adding fair-use limits before switching them on.
            </StatusMessage>
          </div>
          <div className="mt-6">
            <ToolGrid tools={tools} />
          </div>
        </section>

        <section aria-labelledby="planned-heading">
          <h2 id="planned-heading" className="text-2xl font-semibold">Planned</h2>
          <p className="mt-2 max-w-2xl text-muted">These are ideas on the roadmap, not working features. We’ll add each one only when it genuinely works.</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planned.map((p) => (
              <li key={p.name} className="flex items-start gap-4 rounded-lg border border-dashed border-line-strong p-5">
                <Icon name={p.icon} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold">{p.name} <Badge>Planned</Badge></p>
                  <p className="mt-1 text-sm text-muted">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ai-principles" className="max-w-3xl">
          <h2 id="ai-principles" className="text-2xl font-semibold">How we approach AI</h2>
          <ul className="prose-artify mt-3">
            <li><strong>No fake results.</strong> If an AI provider isn’t configured, the tool says so. It never invents output.</li>
            <li><strong>Keys stay on the server.</strong> API keys are never exposed to your browser.</li>
            <li><strong>Limits and timeouts.</strong> Inputs are size-limited, requests are rate-limited, and slow requests are cancelled.</li>
            <li><strong>Honest disclosure.</strong> Every AI tool states who processes your text, and we don’t store it.</li>
            <li><strong>Verify the output.</strong> AI can be wrong. Treat results as drafts.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
