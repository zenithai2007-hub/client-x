"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export interface BarDatum {
  label: string;
  value: number;
}

/** Simple div-built bar chart — honest counts, no chart library. */
export function BarChart({
  title,
  subtitle,
  data,
  barClass,
}: {
  title: string;
  subtitle?: string;
  data: BarDatum[];
  barClass?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <Card className="p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-4 flex h-40 items-end gap-2 sm:gap-3">
        {data.map((d, i) => (
          <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-[11px] font-semibold tabular-nums text-slate-600">{d.value}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(3, (d.value / max) * 100)}%` }}
              transition={{ type: "spring", stiffness: 220, damping: 26, delay: i * 0.05 }}
              className={`w-full max-w-[44px] rounded-t-lg ${barClass ?? "bg-cx-purple/80"}`}
              style={{ minHeight: d.value > 0 ? 8 : 3 }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="w-full truncate text-center text-[10px] capitalize text-slate-400">
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
