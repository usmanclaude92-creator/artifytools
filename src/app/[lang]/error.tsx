"use client";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/components/i18n/locale-provider";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useMessages();
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="eyebrow">{t.error.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold">{t.error.title}</h1>
      <p className="mt-4 max-w-md text-lg text-muted">{t.error.text}</p>
      <Button className="mt-8" size="lg" onClick={reset}>{t.error.retry}</Button>
    </div>
  );
}
