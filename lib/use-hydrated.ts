"use client";

import { useSyncExternalStore } from "react";

// Never fires. The value we are reporting changes exactly once, when React
// swaps the server snapshot for the client one, so there is nothing to
// subscribe to.
const subscribe = () => () => {};

/**
 * False during server render and the hydration pass, true afterwards.
 *
 * The store rehydrates from localStorage after the first paint, so anything
 * that reads persisted task state has to hold back its real markup until this
 * returns true or the SSR output will not match what the client renders.
 *
 * This replaces the usual setState-in-an-effect mounted flag. Same behaviour,
 * without the extra render pass that the React lint rule warns about.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
