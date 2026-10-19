"use client";

import type { ReactNode } from "react";

export function Tooltip({ tip, children }: { tip: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs text-white opacity-0 shadow-cx-pop transition-opacity group-hover:opacity-100">
        {tip}
      </span>
    </span>
  );
}
