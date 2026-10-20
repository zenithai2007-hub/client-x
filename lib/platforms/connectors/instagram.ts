/* Dedicated honest connector for instagram — always fails honestly.
   No fake OAuth, no fake QR pairing, no secrets, server-safe. */

import { createGenericConnector } from "./generic";
import type { ConnectionResult, PlatformConnector } from "../types";

export function createInstagramConnector(): PlatformConnector {
  const base = createGenericConnector("instagram");
  return {
    ...base,
    platformId: "instagram",
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
