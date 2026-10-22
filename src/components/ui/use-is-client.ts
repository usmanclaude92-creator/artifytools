import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false during server render and hydration, true afterwards. Use to defer client-only (e.g. random) output. */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
