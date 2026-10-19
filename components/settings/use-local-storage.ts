"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Small persisted-state hook for view-level preferences.
 * Used where the settings store has no matching field (reported as store gaps).
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* corrupted value — keep initial */
    }
  }, [key]);

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === "function" ? (v as (prev: T) => T)(prev) : v;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* storage unavailable — state still updates */
        }
        return next;
      });
    },
    [key]
  );

  return [value, set] as const;
}
