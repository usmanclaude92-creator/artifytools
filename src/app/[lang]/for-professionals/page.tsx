import type { Metadata } from "next";
import Link from "@/components/ui/locale-link";
import { PageHeader } from "@/components/layout/page-header";
import { ToolGrid } from "@/components/tools/tool-card";
import { Icon } from "@/components/ui/icon";
import { pageMetadata } from "@/lib/seo/metadata";
import { getTool, toDirectoryItem } from "@/lib/tools/registry";

export const metadata: Metadata = pageMetadata({
  title: "Tools for Professionals",
  description: "Reliable everyday tools for developers, finance and operations teams, writers and editors, and security-conscious professionals.",
  path: "/for-professionals",
});

const groups = [
  {
    id: "developers",
    title: "Developers",
    text: "Inspect payloads, encode data, and generate identifiers without pasting production data into a random website: these tools run in your browser.",
    tools: ["json-formatter", "base64-encoder-decoder", "url-encoder-decoder", "uuid-generator", "color-converter"],
  },
  {
    id: "finance",
    title: "Finance & operations",
    text: "Exact decimal arithmetic for the sums that end up in invoices, quotes, and plans.",
    tools: ["vat-calculator", "discount-calculator", "percentage-calculator", "date-difference"],
  },
  {
    id: "writers",
    title: "Writers & editors",
    text: "Check length, fix formatting, and tidy lists before you publish.",
    tools: ["word-counter", "case-converter", "text-cleaner", "remove-duplicate-lines"],
  },
  {
    id: "security",
    title: "Security-conscious teams",
    text: "Generate strong credentials locally. Nothing is transmitted or stored.",
    tools: ["password-generator", "qr-code-generator"],
  },
];

export default function ForProfessionalsPage() {
  return (
    <>
      <PageHeader
        eyebrow="For professionals"
        title="Dependable tools for professional work."
        description="The same free tools, grouped by the kind of work you do. No account needed, and we state exactly how each tool handles your data."
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "For Professionals" }]}
      />
      <div className="container-page space-y-16 py-10">
        {groups.map((g) => {
          const tools = g.tools.map(getTool).filter((t) => t !== undefined).map(toDirectoryItem);
          return (
            <section key={g.id} aria-labelledby={`${g.id}-heading`}>
              <h2 id={`${g.id}-heading`} className="text-2xl font-semibold">{g.title}</h2>
              <p className="mt-2 max-w-2xl text-muted">{g.text}</p>
              <div className="mt-6">
                <ToolGrid tools={tools} />
              </div>
            </section>
          );
        })}

        <section aria-labelledby="roadmap-heading" className="card max-w-3xl p-6 sm:p-8">
          <h2 id="roadmap-heading" className="flex items-center gap-2 text-xl font-semibold">
            <Icon name="clock" className="text-accent-text" /> On our radar
          </h2>
          <p className="mt-3 text-muted">
            We’re exploring batch processing, larger file limits, and team workflows for people who use Artify heavily. None of these exist yet, and there’s nothing to buy today. Every tool on the site is free to use. If something would help your team,{" "}
            <Link href="/contact" className="text-accent-text underline underline-offset-4">tell us</Link>.
          </p>
        </section>
      </div>
    </>
  );
}
