/* Generic honest connector — used for every platform without a dedicated
   connector. Never fakes a successful connection. Server-safe: no secrets,
   no browser-only APIs. */

import { getPlatform } from "../index";
import type { ConnectionResult, PlatformAvailability, PlatformConnector } from "../types";

export function createGenericConnector(platformId: string): PlatformConnector {
  const entry = getPlatform(platformId);
  return {
    platformId,

    availability(): PlatformAvailability {
      return entry?.availability ?? "unavailable";
    },

    async startConnection(): Promise<ConnectionResult> {
      const avail = entry?.availability ?? "unavailable";
      if (avail === "requires-configuration") {
        return {
          ok: false,
          error:
            "Requires configuration — the official integration is not configured on this workspace yet.",
        };
      }
      if (avail === "coming-soon") {
        return {
          ok: false,
          error:
            "Coming soon — no integration is available for this platform yet.",
        };
      }
      if (avail === "unavailable") {
        return {
          ok: false,
          error: "Unavailable — no official integration is available for this platform.",
        };
      }
      return {
        ok: false,
        error:
          "Requires configuration — the official integration is not configured on this workspace yet.",
      };
    },

    statusText(): string {
      return "Not connected";
    },

    openUrl(): string | undefined {
      return entry?.canOpen && entry.website ? `https://${entry.website}` : undefined;
    },
  };
}

export function getConnector(platformId: string): PlatformConnector {
  return createGenericConnector(platformId);
}
