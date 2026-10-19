"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 rounded-xl bg-slate-100/80 p-1", className)}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "relative flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
              isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="cx-tab-pill"
                className="absolute inset-0 rounded-lg bg-white shadow-cx-card"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative flex items-center justify-center gap-1.5">
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px]",
                    isActive ? "bg-cx-purpleLight text-cx-purpleDark" : "bg-slate-200 text-slate-500"
                  )}
                >
                  {t.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
