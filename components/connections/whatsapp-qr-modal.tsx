"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, MessageCircle, RefreshCw, Smartphone } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MockQR } from "./mock-qr";
import { connectionService } from "@/lib/services/connection-service";

type Phase = "qr" | "pairing" | "done";

function mockPhone(): string {
  const a = 100 + Math.floor(Math.random() * 900);
  const b = 1000 + Math.floor(Math.random() * 9000);
  return `+1 (555) 0${String(a).slice(0, 2)}-${b}`;
}

export function WhatsAppQRModal({
  open,
  onClose,
  onPaired,
}: {
  open: boolean;
  onClose: () => void;
  onPaired: (phone: string) => Promise<void>;
}) {
  const [phase, setPhase] = useState<Phase>("qr");
  const [payload, setPayload] = useState("");
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    if (open) {
      setPhase("qr");
      setPayload(connectionService.pairingPayload());
      clearTimers();
      // Demo auto-flow: pretend the phone scanned after a few seconds.
      timers.current.push(
        window.setTimeout(() => setPhase("pairing"), 6000),
        window.setTimeout(() => setPhase("done"), 9000)
      );
    } else {
      clearTimers();
    }
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  useEffect(() => {
    if (phase === "done" && open) {
      const t = window.setTimeout(() => {
        void onPaired(mockPhone()).then(() => onClose());
      }, 1200);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, open]);

  const simulateScan = () => {
    clearTimers();
    setPhase("pairing");
    timers.current.push(window.setTimeout(() => setPhase("done"), 2500));
  };

  const refreshCode = () => {
    clearTimers();
    setPayload(connectionService.pairingPayload());
    setPhase("qr");
    timers.current.push(
      window.setTimeout(() => setPhase("pairing"), 6000),
      window.setTimeout(() => setPhase("done"), 9000)
    );
  };

  const body = useMemo(() => {
    if (phase === "pairing") {
      return (
        <div className="flex flex-col items-center py-10 text-center">
          <Spinner className="h-9 w-9" />
          <p className="mt-4 text-sm font-semibold text-slate-900">Pairing with WhatsApp…</p>
          <p className="mt-1 text-xs text-slate-500">Confirming the secure handshake on your phone.</p>
        </div>
      );
    }
    if (phase === "done") {
      return (
        <div className="flex flex-col items-center py-10 text-center">
          <CheckCircle2 size={44} className="text-emerald-500" />
          <p className="mt-4 text-sm font-semibold text-slate-900">WhatsApp connected</p>
          <p className="mt-1 text-xs text-slate-500">Linking your account to Client X…</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center text-center">
        <div className="relative rounded-2xl border border-slate-200/70 bg-white p-3 shadow-cx-card">
          {payload && <MockQR payload={payload} size={200} />}
        </div>
        <ol className="mt-4 space-y-1.5 text-left text-[13px] text-slate-600">
          <li className="flex gap-2"><Smartphone size={15} className="mt-0.5 shrink-0 text-slate-400" /> Open WhatsApp on your phone</li>
          <li className="flex gap-2"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">2</span> Go to Settings → Linked devices → Link a device</li>
          <li className="flex gap-2"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">3</span> Scan the code above</li>
        </ol>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={refreshCode}>
            Refresh code
          </Button>
          <button
            onClick={simulateScan}
            className="rounded-lg px-2.5 py-1.5 text-xs text-slate-400 underline decoration-dotted underline-offset-2 hover:text-slate-600"
          >
            Demo: simulate a scan
          </button>
        </div>
      </div>
    );
  }, [phase, payload]);

  return (
    <Modal open={open} onClose={onClose} title="Connect WhatsApp" className="max-w-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#1da851]">
          <MessageCircle size={20} />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">Link with WhatsApp</p>
          <p className="text-xs text-slate-500">Scan to pair — no keys needed.</p>
        </div>
      </div>
      {body}
    </Modal>
  );
}
