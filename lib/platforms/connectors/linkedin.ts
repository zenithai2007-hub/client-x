/* Dedicated honest connector for linkedin — always fails honestly.
   No fake OAuth, no fake QR pairing, no secrets, server-safe. */

import { createGenericConnector } from "./generic";
import type { ConnectionResult, PlatformConnector } from "../types";

export function createLinkedInConnector(): PlatformConnector {
  const base = createGenericConnector("linkedin");
  return {
    ...base,
    platformId: "linkedin",
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
