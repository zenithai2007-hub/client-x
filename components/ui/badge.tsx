import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "slate" | "purple" | "orange" | "green" | "red" | "amber" | "blue";

const tones: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600",
  purple: "bg-cx-purpleLight text-cx-purpleDark",
  orange: "bg-cx-orangeLight text-cx-orangeDark",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
};

export function Badge({
  tone = "slate",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
