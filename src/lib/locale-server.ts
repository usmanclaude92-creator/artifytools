import "server-only";
import { lang } from "next/root-params";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { getMessages, type Messages } from "@/lib/messages";

/** Current page language for Server Components (from the [lang] root segment). */
export async function getLocale(): Promise<Locale> {
  const l = await lang();
  return l && isLocale(l) ? l : defaultLocale;
}

export async function getT(): Promise<Messages> {
  return getMessages(await getLocale());
}
