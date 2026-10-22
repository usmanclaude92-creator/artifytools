/** Saved cheque layouts live in this browser only (and can be exported as a file). */
import { FIELD_IDS, type ChequeLayout } from "./templates";

const KEY = "artify-cheque-layouts";

export interface SavedLayout extends ChequeLayout {
  saved: true;
  offsetX: number;
  offsetY: number;
  fontSize: number;
}

export function loadSavedLayouts(): SavedLayout[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter(isSavedLayout) : [];
  } catch {
    return [];
  }
}

export function storeSavedLayouts(list: SavedLayout[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

/** Validates a layout from storage or an imported file. */
export function isSavedLayout(v: unknown): v is SavedLayout {
  if (!v || typeof v !== "object") return false;
  const l = v as Partial<SavedLayout>;
  const num = (n: unknown) => typeof n === "number" && Number.isFinite(n);
  return (
    typeof l.id === "string" &&
    typeof l.name?.en === "string" &&
    num(l.width) && num(l.height) && num(l.offsetX) && num(l.offsetY) && num(l.fontSize) &&
    !!l.fields &&
    FIELD_IDS.every((f) => { const b = l.fields![f]; return b && num(b.x) && num(b.y) && num(b.w) && num(b.h); })
  );
}
