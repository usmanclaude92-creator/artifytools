import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use",
  description: "The terms that apply when you use Artify Tools, including acceptable use and disclaimers about results.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <PageHeader title="Terms of Use" description="Last updated 21 October 2026." breadcrumbs={[{ name: "Home", href: "/" }, { name: "Terms" }]} />
      <div className="container-page py-10">
        <div className="prose-artify">
          <h2 className="!mt-0">Using Artify Tools</h2>
          <p>By using artifytools.com you agree to these terms. If you don’t agree, please don’t use the site.</p>

          <h2>Acceptable use</h2>
          <ul>
            <li>Use the tools lawfully and don’t submit content you have no right to process.</li>
            <li>Don’t attempt to disrupt the service, bypass rate limits, or probe it for vulnerabilities without permission.</li>
            <li>Don’t use automated means to place excessive load on the service or its AI features.</li>
          </ul>

          <h2>Results and accuracy</h2>
          <p>
            We work hard to make tools correct, but results are provided “as is”. Check important results, especially for financial, legal, tax, medical, or security decisions. Calculators don’t know the rules that apply to your situation (such as the correct VAT rate), and AI-generated output can be inaccurate.
          </p>

          <h2>Your content</h2>
          <p>
            You keep all rights to what you enter. For browser-based tools it stays on your device. For AI tools, you grant us only the permission needed to transmit it to the provider and return the result. See the <Link href="/privacy">Privacy Policy</Link>.
          </p>

          <h2>Our content</h2>
          <p>The Artify Tools name, logo, design, and software are owned by us or our licensors. You may link to the site freely but may not copy it or imply endorsement.</p>

          <h2>Availability and changes</h2>
          <p>We may change, suspend, or remove tools or features at any time. We aim for a reliable service but don’t guarantee uninterrupted availability.</p>

          <h2>Limitation of liability</h2>
          <p>
            To the extent permitted by law, Artify Tools is not liable for indirect or consequential losses arising from use of the site or reliance on its results. Nothing in these terms limits liability that cannot be limited by law.
          </p>

          <h2>Contact</h2>
          <p>Questions about these terms? <Link href="/contact">Contact us</Link>.</p>
        </div>
      </div>
    </>
  );
}
