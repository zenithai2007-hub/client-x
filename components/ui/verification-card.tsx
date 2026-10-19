"use client";

import { motion } from "framer-motion";
import { ExternalLink, ShieldAlert, CheckCircle2 } from "lucide-react";
import { VERIFICATION_COPY } from "@/lib/execution";
import { Button } from "./button";
import { Card } from "./card";
import { cn } from "@/lib/cn";

/**
 * §26 — reusable human-verification card.
 * Client X NEVER bypasses CAPTCHAs; this card pauses work and routes the
 * human to the platform, then resumes without repeating completed actions.
 */
export function VerificationCard({
  phase,
  contextTitle,
  platformUrl,
  onOpenPlatform,
  onConfirm,
  onPause,
  onCancel,
  onResume,
  className,
}: {
  /** "pending" → show the 4-button card; "confirmed" → show resume CTA */
  phase: "pending" | "confirmed";
  contextTitle: string;
  platformUrl?: string;
  onOpenPlatform: () => void;
  onConfirm: () => void;
  onPause: () => void;
  onCancel: () => void;
  onResume: () => void;
  className?: string;
}) {
  if (phase === "confirmed") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={cn("border-emerald-200/70 p-5", className)}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {VERIFICATION_COPY.completedTitle}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {contextTitle} — ready to continue from where it paused.
              </p>
              <Button variant="primary-orange" size="sm" className="mt-3" onClick={onResume}>
                {VERIFICATION_COPY.resumeTask}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={cn("border-orange-200/70 p-5", className)}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cx-orangeLight text-cx-orangeDark">
            <ShieldAlert size={20} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">{VERIFICATION_COPY.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {VERIFICATION_COPY.description}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">{VERIFICATION_COPY.honesty}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<ExternalLink size={14} />}
                onClick={onOpenPlatform}
              >
                {VERIFICATION_COPY.openPlatform}
              </Button>
              <Button size="sm" variant="primary-orange" onClick={onConfirm}>
                {VERIFICATION_COPY.confirmDone}
              </Button>
              <Button size="sm" variant="ghost" onClick={onPause}>
                {VERIFICATION_COPY.pauseTask}
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancel} className="text-red-600 hover:bg-red-50">
                {VERIFICATION_COPY.cancelTask}
              </Button>
            </div>
            {platformUrl && (
              <p className="mt-2 truncate text-[11px] text-slate-400">{platformUrl}</p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
