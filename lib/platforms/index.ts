/* Client X — platform registry helpers. */

import { PLATFORM_REGISTRY } from "./registry";
import type { PlatformAvailability, PlatformEntry } from "./types";

export { PLATFORM_REGISTRY } from "./registry";
export type {
  PlatformAvailability,
  PlatformConnector,
  PlatformConnectorKind,
  PlatformEntry,
} from "./types";

export const CATEGORIES = [
  "Professional / B2B",
  "Freelancing / Client Marketplaces",
  "Communities",
  "Business Discovery",
  "Jobs / Opportunities",
] as const;

export const AVAILABILITY_LABEL: Record<PlatformAvailability, string> = {
  supported: "Supported",
  "oauth-available": "OAuth available",
  "api-available": "API available",
  "requires-configuration": "Requires configuration",
  "coming-soon": "Coming soon",
  unavailable: "Unavailable",
};

export const AVAILABILITY_DESCRIPTION: Record<PlatformAvailability, string> = {
  supported:
    "An official integration exists for this platform, but it is not configured on this workspace.",
  "oauth-available":
    "This platform offers official OAuth sign-in. No OAuth app is configured on this workspace yet.",
  "api-available":
    "This platform offers an official API. No API integration is configured on this workspace yet.",
  "requires-configuration":
    "Connecting requires a workspace admin to configure the official integration first.",
  "coming-soon":
    "No integration is available for this platform yet. The platform is listed for discovery only.",
  unavailable:
    "No official integration is available for this platform.",
};

export function getPlatform(id: string): PlatformEntry | undefined {
  return PLATFORM_REGISTRY.find((p) => p.id === id);
}

export function platformsByCategory(): { category: string; platforms: PlatformEntry[] }[] {
  return CATEGORIES.map((category) => ({
    category: category as string,
    platforms: PLATFORM_REGISTRY.filter((p) => p.category === category),
  })).filter((group) => group.platforms.length > 0);
}
