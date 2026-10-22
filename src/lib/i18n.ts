/**
 * Locales. English is served at unprefixed URLs (/tools); Arabic under /ar (/ar/tools).
 * The proxy rewrites unprefixed URLs to /en internally, so the [lang] segment always has a value.
 */
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/**
 * Arabic stays hidden (noindex, no switcher, no hreflang, not in the sitemap)
 * until its translations are published. Flip to true when they ship.
 */
export const arabicPublic = true;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Prefixes internal absolute paths with the locale; leaves external, hash and relative links alone. */
export function localizeHref(href: string, locale: Locale): string {
  if (locale === defaultLocale || !href.startsWith("/") || href.startsWith("//")) return href;
  if (href === "/") return `/${locale}`;
  if (href === `/${locale}` || href.startsWith(`/${locale}/`) || href.startsWith(`/${locale}?`)) return href;
  return `/${locale}${href}`;
}

/** Removes a locale prefix: "/ar/tools" -> "/tools". */
export function stripLocale(pathname: string): string {
  for (const l of locales) {
    if (pathname === `/${l}`) return "/";
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  }
  return pathname;
}
