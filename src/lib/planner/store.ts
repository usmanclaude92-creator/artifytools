import { sanitize, uid, type PlannerData } from "./model";

const KEY = "artify-planner-v1";

export interface StoredMap { id: string; updated: number; data: PlannerData }
export interface Stored { current: string; maps: StoredMap[] }

export function loadStored(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as { current?: unknown; maps?: unknown };
    if (!Array.isArray(j.maps)) return null;
    const maps: StoredMap[] = [];
    for (const m of j.maps.slice(0, 50)) {
      const o = (m ?? {}) as { id?: unknown; updated?: unknown; data?: unknown };
      const data = sanitize(o.data);
      if (data && typeof o.id === "string") maps.push({ id: o.id, updated: typeof o.updated === "number" ? o.updated : 0, data });
    }
    if (maps.length === 0) return null;
    const current = typeof j.current === "string" && maps.some((m) => m.id === j.current) ? j.current : maps[0]!.id;
    return { current, maps };
  } catch {
    return null;
  }
}

export function saveStored(s: Stored): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export const newMapId = () => uid("m");
