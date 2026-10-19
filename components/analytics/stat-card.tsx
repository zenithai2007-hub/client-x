"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

/** One KPI number, computed live from the stores. Never faked. */
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  index = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  sub?: string;
  accent: string; // chip classes, e.g. "bg-cx-purpleLight text-cx-purpleDark"
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
    >
      <Card className="p-4" hover>
        <div className="flex items-center justify-between">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
            <Icon size={17} />
          </span>
        </div>
        <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
      </Card>
    </motion.div>
  );
}
