/* Dedicated honest connector for facebook — always fails honestly.
   No fake OAuth, no fake QR pairing, no secrets, server-safe. */

import { createGenericConnector } from "./generic";
import type { ConnectionResult, PlatformConnector } from "../types";

export function createFacebookConnector(): PlatformConnector {
  const base = createGenericConnector("facebook");
  return {
    ...base,
    platformId: "facebook",
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
