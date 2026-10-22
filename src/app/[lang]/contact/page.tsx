import type { Metadata } from "next";
import Link from "@/components/ui/locale-link";
import { PageHeader } from "@/components/layout/page-header";
import { buttonClasses } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/feedback";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "How to reach the Artify Tools team with feedback, bug reports, or tool suggestions.",
  path: "/contact",
});

export default function ContactPage() {
  const email = siteConfig.contactEmail;
  return (
    <>
      <PageHeader title="Contact" description="Feedback, bug reports, and tool ideas are welcome." breadcrumbs={[{ name: "Home", href: "/" }, { name: "Contact" }]} />
      <div className="container-page py-10">
        <div className="prose-artify">
          {email ? (
            <p className="!mt-0">
              Email us at <a href={`mailto:${email}`}>{email}</a>.
            </p>
          ) : (
            <StatusMessage tone="info">
              A public contact address hasn&apos;t been published yet. It will appear here as soon as the support mailbox is set up.
            </StatusMessage>
          )}
          <h2>What helps us help you</h2>
          <ul>
            <li><strong>Bug report:</strong> the tool name, what you entered (without sensitive data), what you expected, and what happened.</li>
            <li><strong>Browser and device:</strong> for example “Safari 18 on iPhone”.</li>
            <li><strong>Tool idea:</strong> the task you’re trying to get done and why current options fall short.</li>
          </ul>
          <h2>Before you write</h2>
          <p>
            Many answers are in the <Link href="/help">Help centre</Link>. Please don’t send passwords, personal documents, or other confidential material by email.
          </p>
        </div>
        <div className="mt-8">
          <Link href="/help" className={buttonClasses({ variant: "secondary" })}>Visit the Help centre</Link>
        </div>
      </div>
    </>
  );
}
