import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * false during SSR and the hydration render, true afterwards. Gate any render
 * output that reads localStorage/window behind it so the first client render
 * matches the server HTML (React error #418 otherwise).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
