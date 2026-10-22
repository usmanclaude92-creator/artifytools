"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
import { arabicPublic, localizeHref, stripLocale } from "@/lib/i18n";

/**
 * Links to the same page in the other language. While Arabic is unpublished it only
 * appears on Arabic pages (to get back to English), so English visitors never see it.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const path = stripLocale(usePathname());
  if (!arabicPublic && locale === "en") return null;
  const target = locale === "en" ? "ar" : "en";
  return (
    <NextLink
      href={localizeHref(path, target)}
      hrefLang={target}
      lang={target}
      className="inline-flex min-h-10 items-center rounded-md px-2.5 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      {target === "ar" ? "العربية" : "English"}
    </NextLink>
  );
}
