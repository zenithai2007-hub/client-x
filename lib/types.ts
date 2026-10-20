/* Client X — shared domain types.
   Feature builders: import types from here, never redefine them. */

export type MessageStatus = "sent" | "delivered" | "read";

export interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string; // ISO 8601
  status: MessageStatus;
  typing?: boolean; // ephemeral typing indicator row
}

export interface Conversation {
  id: string;
  name: string;
  avatarColor: string; // hex for Avatar fallback
  lastMessage: string;
  lastTime: string; // ISO 8601
  unread: number;
  online: boolean;
  platform?: string;
  mentions?: number;
}

export type AgentStatus = "active" | "ready" | "paused" | "offline";
export type AgentPlatform = "linkedin" | "whatsapp" | "instagram" | "browser" | "website";

export interface Agent {
  id: string;
  name: string;
  platform: AgentPlatform;
  status: AgentStatus;
  currentTask?: string;
  progress?: number; // 0-100
  instructions: string;
  permissions: Record<string, boolean>;
  activity: { time: string; text: string }[];
}

/* ------------------------------------------------------------------ */
/* §26 — Canonical execution states. Use EXACTLY these everywhere.      */
/* ------------------------------------------------------------------ */

export type ExecutionStatus =
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "WAITING_FOR_USER"
  | "RETRYING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

/** Granular outreach pipeline. Each target ALSO carries a canonical `status`. */
export type TargetState =
  | "waiting"
  | "searching"
  | "profile_found"
  | "reviewing"
  | "generating"
  | "waiting_approval"
  | "executing"
  | "completed"
  | "failed"
  | "paused"
  | "waiting_for_user";

export interface Target {
  id: string;
  name: string;
  /** granular pipeline position */
  state: TargetState;
  /** canonical status for badges */
  status: ExecutionStatus;
  message?: string;
  note?: string;
  /** true while an Approval entity is driving this target */
  awaitingApproval?: boolean;
  approvalId?: string;
  /** retry bookkeeping */
  attempt?: number;
  error?: string;
  /** set once a message was actually sent — the dedupe guard */
  sentAt?: string;
  /** pipeline state to return to after a WAITING_FOR_USER verification */
  resumeFrom?: TargetState;
  verificationConfirmed?: boolean;
  /** pipeline state to retry from after a FAILED */
  retryFrom?: TargetState;
}

export interface Campaign {
  id: string;
  name: string;
  platform: string;
  targets: Target[];
  goal: string;
  tone: string;
  messageStyle: string;
  status: ExecutionStatus;
  createdAt: string; // ISO 8601
  /** retry bookkeeping for campaign-level failures */
  attempt?: number;
  error?: string;
}

export interface ClientTask {
  id: string;
  title: string;
  agentId: string;
  status: ExecutionStatus;
  progress: number; // 0-100
  total: number;
  createdAt: string; // ISO 8601
  detail?: string;
  /** retry bookkeeping */
  attempt?: number;
  error?: string;
  /** status to restore after a WAITING_FOR_USER verification completes */
  prevStatus?: ExecutionStatus;
  verification?: {
    reason: string;
    confirmed: boolean;
  };
  /** set once the task's side-effect ran — dedupe guard */
  completedAt?: string;
}

export type MemorySection = "global" | "agent" | "platform" | "conversation" | "outreach";

export interface MemoryItem {
  id: string;
  section: MemorySection;
  key: string;
  value: string;
  updatedAt: string; // ISO 8601
}

export type ActivityCategory = "agents" | "outreach" | "keyboard" | "tasks" | "system";

export interface ActivityEvent {
  id: string;
  time: string; // ISO 8601
  category: ActivityCategory;
  text: string;
}

export type NotificationKind = "info" | "success" | "warning" | "approval" | "agent";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string; // ISO 8601
  read: boolean;
  kind: NotificationKind;
  /** deep-link — clicking the notification opens this route */
  href?: string;
}

export type ApprovalStatus = "pending" | "approved" | "cancelled";

export interface Approval {
  id: string;
  agentId: string;
  /** what the approval is attached to, e.g. an outreach target */
  target: string;
  targetId?: string;
  campaignId?: string;
  action: string; // e.g. "send-message", "execute"
  message: string; // the draft text to approve
  status: ApprovalStatus;
  createdAt: string; // ISO 8601
  resolvedAt?: string;
  editedText?: string;
}

export interface Settings {
  appearance: {
    theme: "light" | "dark";
    sidebarCollapsed: boolean;
    rightPanelOpen: boolean;
  };
  notifications: {
    enabled: boolean;
    sound: boolean;
    approvalAlerts: boolean;
    agentAlerts: boolean;
  };
  ai: {
    tone: "professional" | "friendly" | "concise";
    autoReply: boolean;
    approvalRequired: boolean;
  };
  privacy: {
    readReceipts: boolean;
    onlineStatus: boolean;
  };
  growth: {
    attribution: boolean; // show "Made with Client X" on shared/exported content
  };
  outreach: {
    defaultPlatform: string;
    dailyLimit: number;
    delayBetween: number; // seconds
  };
}

export type AITransformKind =
  | "rewrite"
  | "professional"
  | "friendly"
  | "shorter"
  | "longer"
  | "translate"
  | "generate-reply"
  | "personalize"
  | "improve";

export type NavKey =
  | "home"
  | "chat"
  | "agents"
  | "outreach"
  | "tasks"
  | "keyboard"
  | "memory"
  | "activity"
  | "history"
  | "automations"
  | "analytics"
  | "referrals"
  | "templates"
  | "connections"
  | "settings";

/** Per-action idempotency bookkeeping kept in the state layer. */
export interface InFlightMap {
  [actionKey: string]: string; // actionKey -> idempotency UUID
}

/* ------------------------------------------------------------------ */
/* Growth — referrals, sharing, community templates                     */
/* ------------------------------------------------------------------ */

export interface ReferralStats {
  invitesSent: number;
  friendsJoined: number;
  creditsEarned: number;
}

export interface ReferralReward {
  id: string;
  text: string;
  credits: number;
  time: string;
}

export type TemplateKind = "agent" | "style" | "outreach";

export interface CommunityTemplate {
  id: string;
  kind: TemplateKind;
  title: string;
  description: string;
  author: string;
  uses: number;
  rating: number; // 0–5
  createdAt: string;
  mine?: boolean;
  payload: {
    platform?: AgentPlatform;
    instructions?: string;
    permissions?: Record<string, boolean>;
    tone?: string;
    goal?: string;
    messageStyle?: string;
    targets?: string[];
  };
}

export type ShareKind = "output" | "agent" | "campaign" | "template";

/* ------------------------------------------------------------------ */
/* Connections — mock-first integrations (no credential entry in UI)    */
/* ------------------------------------------------------------------ */

export type ConnectionKind = "whatsapp" | "oauth";

export interface ConnectionPlatform {
  id: string;
  name: string;
  kind: ConnectionKind;
  /** hex brand color for the card icon */
  color: string;
  tagline: string;
  capabilities: string[];
  /** mock identity shown after connecting */
  mockHandle: string;
  mockLabel: string; // e.g. "Phone number" / "Account"
}

export interface PlatformConnection {
  platformId: string;
  status: "connected" | "disconnected";
  handle?: string;
  connectedAt?: string; // ISO 8601
  lastSyncedAt?: string; // ISO 8601 (mock)
  messageCount?: number; // mock count shown on connected cards
}
