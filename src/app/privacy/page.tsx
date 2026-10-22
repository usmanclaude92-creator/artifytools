import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { pageMetadata } from "@/lib/seo/metadata";
import { processingLabels } from "@/lib/tools/labels";
import { getPublishedTools } from "@/lib/tools/registry";
import type { ProcessingMode } from "@/lib/tools/types";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How Artify Tools handles your data: most tools run in your browser, and we state clearly where any exception sends data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  const tools = getPublishedTools();
  const modes: ProcessingMode[] = ["browser-local", "server-side", "external-provider"];
  return (
    <>
      <PageHeader title="Privacy Policy" description="Last updated 22 October 2026." breadcrumbs={[{ name: "Home", href: "/" }, { name: "Privacy" }]} />
      <div className="container-page py-10">
        <div className="prose-artify">
          <h2 className="!mt-0">The short version</h2>
          <ul>
            <li>You don’t need an account, and we don’t ask for personal information to use the tools.</li>
            <li>Most tools process what you enter <strong>inside your browser</strong>. That input is not sent to us.</li>
            <li>The exceptions are listed below. They are labelled on the tool’s page before you use them.</li>
            <li>We don’t use advertising or set cookies. We count page visits with cookieless, anonymous analytics; nothing you type into a tool is included.</li>
          </ul>

          <h2>How each tool processes your data</h2>
          {modes.map((m) => {
            const list = tools.filter((t) => t.processingMode === m);
            if (list.length === 0) return null;
            return (
              <div key={m}>
                <h3>{processingLabels[m].label}</h3>
                <p>{processingLabels[m].description}</p>
                <ul>
                  {list.map((t) => (
                    <li key={t.id}><Link href={`/tools/${t.slug}`}>{t.name}</Link></li>
                  ))}
                </ul>
              </div>
            );
          })}

          <h2>AI tools</h2>
          <p>
            When you use an AI tool, the text you submit is sent over HTTPS to an Artify server and forwarded to a third-party AI provider (currently Anthropic) to generate the result. Artify does not store the text or the result and does not write them to logs. The provider processes the text under its own terms and privacy policy. Don’t submit confidential or regulated information unless you are permitted to share it with such a provider. To limit abuse, the server briefly keeps your IP address in memory for rate limiting (about a minute).
          </p>

          <h2>Information we may receive automatically</h2>
          <p>
            Like any website, our hosting infrastructure may record standard technical information such as IP address, requested URL, browser type, and timestamp in server logs. We use this only to operate, secure, and debug the service.
          </p>

          <h2>Visit statistics</h2>
          <p>
            To understand which tools are useful, we use Vercel Web Analytics, which counts page visits without cookies. It records the page path (with any query string removed), the referring site, the country, and the browser, device and operating-system type. It does not use cookies or fingerprinting, does not track you across websites, and never receives the text, files, or values you enter into a tool. Visitors are counted using a hash that resets every day, so individual visits can’t be linked over time.
          </p>

          <h2>Cookies and local storage</h2>
          <p>
            Artify sets no cookies. If you switch themes, your choice is saved in your browser’s local storage under the key <code>artify-theme</code>. See the <Link href="/cookies">Cookies</Link> page.
          </p>

          <h2>Your choices and rights</h2>
          <p>
            Because browser-based tools never send us your input, there is nothing for us to access, correct, or delete. Depending on where you live, you may have rights over any personal data we do hold (such as server logs). To exercise them, <Link href="/contact">contact us</Link>.
          </p>

          <h2>Children</h2>
          <p>Artify is a general-audience utility site and is not directed at children under 13.</p>

          <h2>Changes</h2>
          <p>If we change how data is handled, for example by adding a tool that uploads files, we will update this page and the affected tool pages before the change takes effect.</p>
        </div>
      </div>
    </>
  );
}
