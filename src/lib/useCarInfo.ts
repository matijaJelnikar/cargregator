"use client";

import { useEffect, useState } from "react";
import { getGenerations, type CarGeneration } from "./carinfoDb";

const cache = new Map<string, Promise<CarGeneration[] | null>>();

/** One request per model per page load; a failure is remembered as null only until the next mount. */
function load(modelId: string): Promise<CarGeneration[] | null> {
  let p = cache.get(modelId);
  if (!p) {
    p = getGenerations(modelId).catch(() => {
      cache.delete(modelId);
      return null;
    });
    cache.set(modelId, p);
  }
  return p;
}

/**
 * The generations (with engines and recalls) of a model. `undefined` while loading, `null` when the data is
 * unavailable: callers show nothing then, so search never depends on the car-info database being up.
 */
export function useCarInfo(modelId: string | undefined): CarGeneration[] | null | undefined {
  const [state, setState] = useState<{ modelId: string; data: CarGeneration[] | null } | undefined>();
  useEffect(() => {
    if (!modelId) return;
    let live = true;
    load(modelId).then((data) => live && setState({ modelId, data }));
    return () => {
      live = false;
    };
  }, [modelId]);
  if (!modelId) return null;
  return state?.modelId === modelId ? state.data : undefined;
}
