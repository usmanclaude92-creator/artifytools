/**
 * Tool logic returns English messages (and its unit tests check them). On other-language
 * pages the UI maps each known message to a translation with these rules. An unknown
 * message is shown as-is rather than hidden.
 */
export type MessageRule = [RegExp, string | ((...groups: string[]) => string)];

export function translateMessage(message: string, rules: MessageRule[] | null): string {
  if (!rules) return message;
  for (const [pattern, replacement] of rules) {
    const m = message.match(pattern);
    if (m) return typeof replacement === "string" ? message.replace(pattern, replacement) : replacement(...m.slice(1));
  }
  return message;
}
