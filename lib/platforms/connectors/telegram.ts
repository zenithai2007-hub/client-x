/* Dedicated honest connector for telegram — always fails honestly.
   No fake OAuth, no fake QR pairing, no secrets, server-safe. */

import { createGenericConnector } from "./generic";
import type { ConnectionResult, PlatformConnector } from "../types";

export function createTelegramConnector(): PlatformConnector {
  const base = createGenericConnector("telegram");
  return {
    ...base,
    platformId: "telegram",
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
