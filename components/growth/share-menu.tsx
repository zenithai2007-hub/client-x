"use client";

import { useState } from "react";
import { Check, Link2, Mail, MessageCircle, Send, Share2 } from "lucide-react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  appUrl,
  canSystemShare,
  copyText,
  openShare,
  shareTextFor,
  systemShare,
  type ShareChannel,
  type SharePayload,
} from "@/lib/services/sharing";
import { useActivityStore } from "@/stores/use-activity-store";
import type { ShareKind } from "@/lib/types";

const CHANNELS: { key: ShareChannel | "copy" | "system"; label: string; icon: React.ReactNode }[] = [
  { key: "whatsapp", label: "WhatsApp", icon: <MessageCircle size={15} /> },
  { key: "x", label: "X", icon: <Share2 size={15} /> },
  { key: "linkedin", label: "LinkedIn", icon: <Share2 size={15} /> },
  { key: "telegram", label: "Telegram", icon: <Send size={15} /> },
  { key: "email", label: "Email", icon: <Mail size={15} /> },
  { key: "copy", label: "Copy link", icon: <Link2 size={15} /> },
  { key: "system", label: "More…", icon: <Share2 size={15} /> },
];

/**
 * Share button with per-platform share intents.
 * `sharePath` is the public route (e.g. `/share/agent/ag-1`).
 */
export function ShareButton({
  kind,
  title,
  extra,
  sharePath,
  variant = "ghost",
  size = "sm",
}: {
  kind: ShareKind;
  title: string;
  extra?: string;
  sharePath: string;
  variant?: "ghost" | "secondary";
  size?: "sm" | "md" | "icon";
}) {
  const [copied, setCopied] = useState(false);

  const payload = (): SharePayload => ({
    title: `Client X — ${title}`,
    text: shareTextFor(kind, title, extra),
    url: appUrl(sharePath),
  });

  const handleSelect = async (key: string) => {
    const p = payload();
    if (key === "copy") {
      const ok = await copyText(`${p.text}\n${p.url}`);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
      useActivityStore.getState().logEvent("system", `Share link copied (${kind}).`);
      return;
    }
    if (key === "system") {
      const res = await systemShare(p);
      if (res === "copied") {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
      return;
    }
    openShare(key as ShareChannel, p);
    useActivityStore.getState().logEvent("system", `Shared via ${key} (${kind}).`);
  };

  const items = CHANNELS.filter((c) => c.key !== "system" || canSystemShare()).map((c) => ({
    key: c.key,
    label: c.label,
    icon: c.icon,
  }));

  return (
    <DropdownMenu
      trigger={
        <Button size={size} variant={variant} icon={copied ? <Check size={14} /> : <Share2 size={14} />}>
          {size === "icon" ? null : copied ? "Copied" : "Share"}
        </Button>
      }
      items={items}
      onSelect={handleSelect}
    />
  );
}
