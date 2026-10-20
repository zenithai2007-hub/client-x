/* Client X — platform ecosystem types.
   The connection system is honest: nothing here is a real integration.
   Everything starts "disconnected" and nothing can fake a connected state. */

export type PlatformAvailability =
  | "supported"
  | "oauth-available"
  | "api-available"
  | "requires-configuration"
  | "coming-soon"
  | "unavailable";

export type PlatformConnectorKind = "official" | "community" | "none";

export interface PlatformEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  availability: PlatformAvailability;
  connectorKind: PlatformConnectorKind;
  color: string;
  /** public website host used by the Open button, e.g. "linkedin.com" */
  website: string;
  /** env var names a workspace admin would configure (names only, no values) */
  requiredConfig?: string[];
  icon?: string;
  canOpen: boolean;
}

export type ConnectionResult =
  | { ok: true }
  | { ok: false; error: string };

export interface PlatformConnector {
  /** registry id of the platform this connector handles */
  readonly platformId: string;
  availability(): PlatformAvailability;
  /**
   * Attempt to connect the platform.
   * HONEST: no real integrations are configured, so this must never
   * resolve to a success. It always explains what is missing.
   */
  startConnection(): Promise<ConnectionResult>;
  /** short honest status line, e.g. "Not connected" */
  statusText(): string;
  openUrl?(): string | undefined;
}
