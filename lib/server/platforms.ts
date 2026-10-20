/* Client X — honest platform availability metadata.
   ====================================================================
   PLATFORM HONESTY POLICY (enforced server-side):
   - No platform is ever marked "Connected", "OAuth complete",
     "Linked", or similar, because no real integration is configured.
   - `status` is one of: "supported" | "oauth_available" |
     "api_available" | "requires_configuration" | "coming_soon" |
     "unavailable".
   - A connect flow that would need a real OAuth app, API key, or
     pairing step must end honestly ("not configured") — never with
     a fake success screen.
   - No credentials, tokens, or secrets appear in these responses.
   ==================================================================== */

export type PlatformAvailability =
  | "oauth_available"
  | "api_available"
  | "requires_configuration"
  | "coming_soon"
  | "unavailable";

export interface PlatformInfo {
  platform: string;
  label: string;
  kind: "messaging" | "social" | "automation";
  status: PlatformAvailability;
  connected: false; // always false until a real integration is configured
  integrationNotes: string;
}

const PLATFORMS: PlatformInfo[] = [
  {
    platform: "whatsapp",
    label: "WhatsApp",
    kind: "messaging",
    status: "requires_configuration",
    connected: false,
    integrationNotes:
      "Requires an official WhatsApp Business Platform integration (Meta Business Manager + approved templates). Not configured.",
  },
  {
    platform: "linkedin",
    label: "LinkedIn",
    kind: "social",
    status: "requires_configuration",
    connected: false,
    integrationNotes:
      "Would require an official LinkedIn developer app with OAuth 2.0. Cold outreach DMs are restricted by LinkedIn's API policies. Not configured.",
  },
  {
    platform: "instagram",
    label: "Instagram",
    kind: "social",
    status: "requires_configuration",
    connected: false,
    integrationNotes:
      "Would require a Meta developer app with Instagram Messaging API permissions. Cold first DMs are not permitted by the API. Not configured.",
  },
  {
    platform: "x",
    label: "X",
    kind: "social",
    status: "requires_configuration",
    connected: false,
    integrationNotes:
      "Would require an X (Twitter) developer app with OAuth 2.0. Not configured.",
  },
  {
    platform: "telegram",
    label: "Telegram",
    kind: "messaging",
    status: "api_available",
    connected: false,
    integrationNotes:
      "Telegram Bot API exists, but no bot token has been configured. Not connected.",
  },
  {
    platform: "browser",
    label: "Browser",
    kind: "automation",
    status: "coming_soon",
    connected: false,
    integrationNotes:
      "Browser automation is a planned future capability. Not available yet.",
  },
  {
    platform: "website",
    label: "Website",
    kind: "automation",
    status: "coming_soon",
    connected: false,
    integrationNotes:
      "Website chat widget integration is a planned future capability. Not available yet.",
  },
];

export function getPlatforms(): PlatformInfo[] {
  return PLATFORMS.map((p) => ({ ...p }));
}

export function getPlatform(platform: string): PlatformInfo | null {
  const found = PLATFORMS.find((p) => p.platform === platform.toLowerCase()) ?? null;
  return found ? { ...found } : null;
}
