/* Client X — connection service (honest version).
   No real integrations are configured on this workspace.
   Every platform reports "disconnected" and connect() always fails
   with an honest, human-readable explanation. Nothing here fabricates
   a connected state, a handle, a QR pairing, or an OAuth session. */

import { PLATFORM_REGISTRY, getPlatform } from "@/lib/platforms";
import type { PlatformConnection } from "@/lib/types";

export interface ConnectionSnapshot {
  connections: PlatformConnection[];
}

function disconnected(platformId: string): PlatformConnection {
  return { platformId, status: "disconnected" };
}

class ConnectionService {
  async getSnapshot(): Promise<ConnectionSnapshot> {
    return {
      connections: PLATFORM_REGISTRY.map((p) => disconnected(p.id)),
    };
  }

  async connect(
    platformId: string
  ): Promise<{ ok: false; error: string }> {
    const entry = getPlatform(platformId);
    if (!entry) {
      return {
        ok: false,
        error: "Unknown platform — no integration is available for it.",
      };
    }
    if (entry.availability === "coming-soon") {
      return {
        ok: false,
        error:
          "Coming soon — no integration is available for this platform yet.",
      };
    }
    if (entry.availability === "unavailable") {
      return {
        ok: false,
        error: "Unavailable — no official integration is available for this platform.",
      };
    }
    return {
      ok: false,
      error:
        "Requires configuration — no official integration is configured for this platform yet.",
    };
  }

  async disconnect(platformId: string): Promise<PlatformConnection> {
    return disconnected(platformId);
  }

  /** Keep compatibility with store hydration — never resurrects a connection. */
  hydrate(_connections: PlatformConnection[]): void {
    // intentionally no-op: persisted connected states are never trusted.
    // Only real server-verified state may mark a platform connected.
    void _connections;
  }
}

export const connectionService = new ConnectionService();
