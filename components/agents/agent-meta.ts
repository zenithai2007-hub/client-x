/* Client X — shared agent presentation helpers (agents feature only). */

import {
  BookOpen,
  Compass,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Megaphone,
  MessageCircle,
  MonitorSmartphone,
  type LucideIcon,
} from "lucide-react";
import type { AgentPlatform, AgentStatus, ExecutionStatus } from "@/lib/types";

/** Platform → Lucide icon (no emojis anywhere). */
export const platformIcon: Record<AgentPlatform, LucideIcon> = {
  linkedin: Linkedin,
  whatsapp: MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
  browser: Globe,
  website: MonitorSmartphone,
  outreach: Megaphone,
  discovery: Compass,
  research: BookOpen,
};

export const platformLabel: Record<AgentPlatform, string> = {
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  browser: "Browser",
  website: "Website",
  outreach: "Outreach",
  discovery: "Discovery",
  research: "Research",
};

/**
 * AgentStatus → canonical ExecutionStatus for StatusBadge.
 * Agents live outside the §26 execution lifecycle; mapping is:
 * active→RUNNING, ready→READY, paused→PAUSED, offline→CANCELLED,
 * waiting→WAITING_FOR_USER, needs_approval→WAITING_FOR_USER
 * (both are "waiting on the user" states — there is no separate
 * ExecutionStatus for approval, so both surface as WAITING_FOR_USER).
 */
export function agentExecStatus(s: AgentStatus): ExecutionStatus {
  switch (s) {
    case "active":
      return "RUNNING";
    case "ready":
      return "READY";
    case "paused":
      return "PAUSED";
    case "offline":
      return "CANCELLED";
    case "waiting":
      return "WAITING_FOR_USER";
    case "needs_approval":
      return "WAITING_FOR_USER";
  }
}

export const PERMISSION_LABELS: Record<string, string> = {
  sendMessages: "Send messages",
  readProfile: "Read profile",
  manageConnections: "Manage connections",
  autoApprove: "Auto-approve actions",
};

const PERMISSION_HINTS: Record<string, string> = {
  sendMessages: "Agent can send messages on this platform",
  readProfile: "Agent can read profiles and contact info",
  manageConnections: "Agent can manage connections and follows",
  autoApprove: "Agent can act without asking for approval",
};

export function permissionHint(key: string): string {
  return PERMISSION_HINTS[key] ?? "Agent capability";
}

/** Short relative time, e.g. "4m ago", "2h ago", "3d ago". */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
