/* Mock-first connection service.
   Simulates QR pairing (WhatsApp) and OAuth-style authorization flows
   with realistic states. Real backends plug in behind this interface later —
   the UI never asks for API keys or credentials. */

import { delay, jitter, uid, nowISO } from "./base";
import type { ConnectionPlatform, PlatformConnection } from "@/lib/types";

export const PLATFORMS: ConnectionPlatform[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    kind: "whatsapp",
    color: "#25D366",
    tagline: "Send and receive messages through your WhatsApp account.",
    capabilities: ["Read messages", "Send messages", "Approval-gated sends"],
    mockHandle: "+1 (555) 014-2288",
    mockLabel: "Phone number",
  },
  {
    id: "instagram",
    name: "Instagram",
    kind: "oauth",
    color: "#E1306C",
    tagline: "Handle DMs and comments with your Instagram agent.",
    capabilities: ["Read DMs", "Draft replies", "Approval-gated sends"],
    mockHandle: "@clientx.demo",
    mockLabel: "Account",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    kind: "oauth",
    color: "#0A66C2",
    tagline: "Run outreach campaigns to your LinkedIn network.",
    capabilities: ["Find profiles", "Personalized outreach", "Approval-gated sends"],
    mockHandle: "@clientx-demo",
    mockLabel: "Account",
  },
  {
    id: "x",
    name: "X",
    kind: "oauth",
    color: "#0F1419",
    tagline: "Draft and schedule posts with your X agent.",
    capabilities: ["Draft posts", "Reply assistance", "Approval-gated posts"],
    mockHandle: "@clientx_demo",
    mockLabel: "Handle",
  },
  {
    id: "telegram",
    name: "Telegram",
    kind: "oauth",
    color: "#229ED9",
    tagline: "Automate chats and channels via Telegram.",
    capabilities: ["Read chats", "Send messages", "Approval-gated sends"],
    mockHandle: "@clientx_demo_bot",
    mockLabel: "Account",
  },
  {
    id: "facebook",
    name: "Facebook",
    kind: "oauth",
    color: "#1877F2",
    tagline: "Manage Page messages with your Facebook agent.",
    capabilities: ["Page messages", "Draft replies", "Approval-gated sends"],
    mockHandle: "Client X Demo Page",
    mockLabel: "Page",
  },
];

export interface ConnectionSnapshot {
  connections: PlatformConnection[];
}

class ConnectionService {
  private state: PlatformConnection[] = PLATFORMS.map((p) => ({
    platformId: p.id,
    status: "disconnected" as const,
  }));

  platform(id: string): ConnectionPlatform | undefined {
    return PLATFORMS.find((p) => p.id === id);
  }

  async getSnapshot(): Promise<ConnectionSnapshot> {
    await jitter(80, 220);
    return { connections: this.state.map((c) => ({ ...c })) };
  }

  /** Mock QR pairing payload — looks real, carries no credentials. */
  pairingPayload(): string {
    return `clientx-mock-pairing:${uid("pair")}`;
  }

  async completeWhatsAppPairing(phone: string): Promise<PlatformConnection> {
    await delay(2200); // realistic pairing handshake
    return this.setConnected("whatsapp", phone);
  }

  async completeOAuth(platformId: string): Promise<PlatformConnection> {
    await jitter(900, 1600); // realistic authorization round-trip
    const p = this.platform(platformId);
    return this.setConnected(platformId, p?.mockHandle ?? "@clientx.demo");
  }

  async disconnect(platformId: string): Promise<PlatformConnection> {
    await jitter(200, 500);
    this.state = this.state.map((c) =>
      c.platformId === platformId
        ? { platformId, status: "disconnected" as const, handle: undefined, connectedAt: undefined }
        : c
    );
    const c = this.state.find((x) => x.platformId === platformId)!;
    return { ...c };
  }

  /** Restore persisted snapshot into the mock backend. */
  hydrate(connections: PlatformConnection[]) {
    const known = new Set(PLATFORMS.map((p) => p.id));
    this.state = PLATFORMS.map((p) => {
      const saved = connections.find((c) => c.platformId === p.id);
      return saved && known.has(saved.platformId)
        ? { ...saved }
        : { platformId: p.id, status: "disconnected" as const };
    });
  }

  private setConnected(platformId: string, handle: string): PlatformConnection {
    this.state = this.state.map((c) =>
      c.platformId === platformId
        ? { platformId, status: "connected" as const, handle, connectedAt: nowISO() }
        : c
    );
    const c = this.state.find((x) => x.platformId === platformId)!;
    return { ...c };
  }
}

export const connectionService = new ConnectionService();
