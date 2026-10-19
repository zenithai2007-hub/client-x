"use client";

import type { ExecutionStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const styles: Record<ExecutionStatus, { pill: string; dot: string; label: string; pulse?: boolean }> = {
  READY: { pill: "bg-slate-100 text-slate-600", dot: "bg-slate-400", label: "Ready" },
  RUNNING: { pill: "bg-blue-50 text-blue-700", dot: "bg-blue-500", label: "Running", pulse: true },
  PAUSED: { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500", label: "Paused" },
  WAITING_FOR_USER: { pill: "bg-orange-50 text-orange-700", dot: "bg-cx-orange", label: "Needs you", pulse: true },
  RETRYING: { pill: "bg-violet-50 text-violet-700", dot: "bg-violet-500", label: "Retrying", pulse: true },
  COMPLETED: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", label: "Completed" },
  FAILED: { pill: "bg-red-50 text-red-700", dot: "bg-red-500", label: "Failed" },
  CANCELLED: { pill: "bg-slate-200/70 text-slate-500", dot: "bg-slate-400", label: "Cancelled" },
};

/** §26 — visually distinct badge for each of the 8 canonical states. */
export function StatusBadge({
  status,
  attempt,
  className,
}: {
  status: ExecutionStatus;
  /** shown when RETRYING, e.g. "Retrying · attempt 2" */
  attempt?: number;
  className?: string;
}) {
  const s = styles[status];
  const label = status === "RETRYING" && attempt ? `Retrying · ${attempt}/3` : s.label;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        s.pill,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot, s.pulse && "animate-pulse")} />
      {label}
    </span>
  );
}
