"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 text-4xl font-semibold">That didn’t work</h1>
      <p className="mt-4 max-w-md text-lg text-muted">An unexpected error occurred. Your input hasn’t been sent anywhere. Try again, and if it keeps happening, let us know.</p>
      <Button className="mt-8" size="lg" onClick={reset}>Try again</Button>
    </div>
  );
}
