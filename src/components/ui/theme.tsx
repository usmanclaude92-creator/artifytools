"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "./icon";
import { useMessages } from "@/components/i18n/locale-provider";

export type Theme = "light" | "dark";
const STORAGE_KEY = "artify-theme";

/** Runs before first paint (inlined in <head>) so there is no flash of the wrong theme. */
export const themeInitScript = `try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const getSnapshot = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const getServerSnapshot = (): Theme => "light";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const next: Theme = theme === "dark" ? "light" : "dark";
  const t = useMessages();

  return (
    <button
      type="button"
      aria-label={t.theme.switchTo(next)}
      title={t.theme.switchTo(next)}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          /* storage unavailable: the preference simply won't persist */
        }
        listeners.forEach((l) => l());
      }}
      className="grid size-11 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={20} />
    </button>
  );
}
