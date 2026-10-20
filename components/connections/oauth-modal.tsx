"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ConnectionPlatform } from "@/lib/types";

type Phase = "authorize" | "working" | "done";

const PERMISSIONS = [
  "Read your profile information",
  "Draft messages on your behalf",
  "Send only after your approval",
];

export function OAuthModal({
  platform,
  open,
  onClose,
  onAuthorized,
}: {
  platform: ConnectionPlatform | null;
  open: boolean;
  onClose: () => void;
  onAuthorized: (platformId: string) => Promise<void>;
}) {
  const [phase, setPhase] = useState<Phase>("authorize");
  const busy = useRef(false);

  useEffect(() => {
    if (open) {
      setPhase("authorize");
      busy.current = false;
    }
  }, [open, platform?.id]);

  const authorize = async () => {
    if (!platform || busy.current) return;
    busy.current = true;
    setPhase("working");
    await onAuthorized(platform.id);
    setPhase("done");
    window.setTimeout(onClose, 1100);
  };

  if (!platform) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Connect ${platform.name}`} className="max-w-sm">
      {phase === "working" ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Spinner className="h-9 w-9" />
          <p className="mt-4 text-sm font-semibold text-slate-900">
            Authorizing with {platform.name}…
          </p>
          <p className="mt-1 text-xs text-slate-500">Confirming your account.</p>
        </div>
      ) : phase === "done" ? (
        <div className="flex flex-col items-center py-10 text-center">
          <CheckCircle2 size={44} className="text-emerald-500" />
          <p className="mt-4 text-sm font-semibold text-slate-900">{platform.name} connected</p>
          <p className="mt-1 text-xs text-slate-500">Signed in as {platform.mockHandle}.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: platform.color }}
            >
              {platform.name.charAt(0)}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">{platform.name}</p>
              <p className="text-xs text-slate-500">{platform.tagline}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl  bg-cx-bg shadow-cx-inset-sm/60 p-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <ShieldCheck size={14} className="text-cx-purple" />
              Client X is requesting permission to:
            </p>
            <ul className="space-y-1.5 text-[13px] text-slate-600">
              {PERMISSIONS.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cx-purple" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 space-y-2">
            <Button
              variant="primary-orange"
              size="md"
              className="w-full"
              onClick={authorize}
            >
              Continue as {platform.mockHandle}
            </Button>
            <Button variant="ghost" size="md" className="w-full" onClick={onClose}>
              Cancel
            </Button>
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-400">
            Demo authorization — no real account needed.
          </p>
        </div>
      )}
    </Modal>
  );
}
