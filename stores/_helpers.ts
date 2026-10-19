/* Shared in-flight / idempotency helpers for all stores.
   Every mutating action: beginAction() guards duplicates and mints a
   per-action UUID idempotency key; endAction() releases it in a finally. */

import { uid } from "@/lib/services/base";
import type { InFlightMap } from "@/lib/types";

export function beginAction(
  inFlight: InFlightMap,
  key: string
): { map: InFlightMap; idemKey: string } | null {
  if (inFlight[key]) return null; // duplicate click / double dispatch guard
  const idemKey = uid("idem");
  return { map: { ...inFlight, [key]: idemKey }, idemKey };
}

export function endAction(inFlight: InFlightMap, key: string): InFlightMap {
  const next = { ...inFlight };
  delete next[key];
  return next;
}

export const isInFlightKey = (inFlight: InFlightMap, key: string): boolean =>
  Boolean(inFlight[key]);
