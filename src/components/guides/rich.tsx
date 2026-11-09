import type { ReactNode } from "react";
import Link from "@/components/ui/locale-link";

const LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

/** Renders text with links written as [text](/tools/merge-pdf). Links keep the visitor's language. */
export function Rich({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<Link key={m.index} href={m[2]!} className="font-medium text-accent-text underline underline-offset-4">{m[1]}</Link>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/** The same text without link markup (for structured data and plain-text files). */
export function plain(text: string): string {
  return text.replace(LINK, "$1");
}
