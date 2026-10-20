/* Dedicated honest connector for reddit — always fails honestly.
   No fake OAuth, no fake QR pairing, no secrets, server-safe. */

import { createGenericConnector } from "./generic";
import type { ConnectionResult, PlatformConnector } from "../types";

export function createRedditConnector(): PlatformConnector {
  const base = createGenericConnector("reddit");
  return {
    ...base,
    platformId: "reddit",
    async startConnection(): Promise<ConnectionResult> {
      return {
        ok: false,
        error:
          "Requires configuration — the official integration is not configured on this workspace yet.",
      };
    },
    statusText(): string {
      return "Not connected";
    },
  };
}
