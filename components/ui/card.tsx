import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Soft 3D raised card — brighter than the page bg, dual diffused shadows,
 *  inner top highlight. No flat borders. */
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
        "rounded-2xl bg-cx-surface shadow-cx-card",
        hover && "transition-shadow duration-200 hover:shadow-cx-card-hover",
        className
      )}
    >
      {children}
    </div>
  );
}
