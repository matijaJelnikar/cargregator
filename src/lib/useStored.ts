"use client";

import { useSyncExternalStore } from "react";
import { readRaw, subscribe, type StoreName } from "./storage";

/** Raw stored string; `undefined` while prerendering/hydrating, `null` when nothing is stored. */
export function useStored(store: StoreName, key: string): string | null | undefined {
  return useSyncExternalStore(subscribe, () => readRaw(store, key), () => undefined);
}
