"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useSettingsStore } from "@/stores/use-settings-store";
import { cn } from "@/lib/cn";

/** Tiny "Made with Client X" attribution line. Hidden when disabled in settings. */
export function Attribution({ className }: { className?: string }) {
  const enabled = useSettingsStore((s) => s.growth.attribution);
  if (!enabled) return null;
  return (
    <p className={cn("text-[11px] text-slate-400", className)}>
      Made with <span className="font-semibold text-cx-purple">Client X</span>
    </p>
  );
}

/** Tasteful one-line sharing nudge for empty states / completion moments. */
export function ShareNudge({ text, href = "/referrals" }: { text: string; href?: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 rounded-xl border border-cx-purple/20 bg-cx-purpleLight/40 px-3 py-2 text-xs text-slate-600 transition-colors hover:border-cx-purple/40 hover:bg-cx-purpleLight/70"
    >
      <Sparkles size={14} className="shrink-0 text-cx-purple" />
      <span>
        {text}{" "}
        <span className="font-semibold text-cx-purple group-hover:underline">
          Share Client X with a friend
        </span>
      </span>
    </Link>
  );
}
