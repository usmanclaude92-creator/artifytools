import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Faq } from "@/components/tools/tool-sections";
import { JsonLd } from "@/components/ui/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Help",
  description: "Answers to common questions about using Artify Tools: finding tools, privacy, shortcuts, supported browsers, and troubleshooting.",
  path: "/help",
});

const faqs = [
  { question: "How do I find the right tool?", answer: "Use the search box on the homepage, or press Ctrl+K (Cmd+K on Mac) or “/” anywhere on the site to open search. You can also browse by category or use filters on the All Tools page." },
  { question: "Are my files and text uploaded?", answer: "Most Artify tools process your input entirely in your browser, and nothing is uploaded. Every tool page has a Privacy section stating where processing happens. AI tools are different: they send your text to an AI provider, and they say so before you use them." },
  { question: "Which browsers are supported?", answer: "Current versions of Chrome, Edge, Firefox, and Safari. Tools rely on standard browser features such as the Web Crypto API, which older browsers may lack." },
  { question: "The Copy button doesn’t work. What can I do?", answer: "Copying needs a secure (https) page and, in some browsers, permission to access the clipboard. If it fails, select the text in the result box and copy it manually." },
  { question: "Do you save my results?", answer: "No. Results exist only on the page you’re viewing. If you refresh or close the tab they’re gone, so copy or download anything you need to keep." },
  { question: "Why do my calculator results differ from my spreadsheet?", answer: "Our calculators use exact decimal arithmetic and round half away from zero to two decimals. Spreadsheets use binary floating point and may round differently in the last digit." },
  { question: "Does Artify work offline?", answer: "Not yet. Once a tool page has loaded, browser-based tools keep working if your connection drops, but you need a connection to open new pages." },
  { question: "How do I report a bug or request a tool?", answer: "See the Contact page for how to reach us, and include the tool name, your browser, and what happened." },
];

export default function HelpPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }}
      />
      <PageHeader title="Help" description="Quick answers to common questions." breadcrumbs={[{ name: "Home", href: "/" }, { name: "Help" }]} />
      <div className="container-page grid gap-12 py-10 lg:grid-cols-[1fr_20rem]">
        <div className="max-w-3xl">
          <Faq faqs={faqs} />
        </div>
        <aside aria-labelledby="shortcuts-heading" className="card h-fit p-6">
          <h2 id="shortcuts-heading" className="text-lg font-semibold">Keyboard shortcuts</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt>Open search</dt>
              <dd><kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-xs">Ctrl/⌘ K</kbd> or <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-xs">/</kbd></dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Move through results</dt>
              <dd><kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-xs">↑</kbd> <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-xs">↓</kbd></dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Open result</dt>
              <dd><kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-xs">Enter</kbd></dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Close search or menu</dt>
              <dd><kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-xs">Esc</kbd></dd>
            </div>
          </dl>
          <p className="mt-5 text-sm text-muted">
            Still stuck? <Link href="/contact" className="text-accent-text underline underline-offset-4">Contact us</Link>.
          </p>
        </aside>
      </div>
    </>
  );
}
