import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  hover,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white border border-slate-200/70 shadow-cx-card",
        hover && "transition-shadow hover:shadow-cx-card-hover",
        className
      )}
    >
      {children}
    </div>
  );
}
