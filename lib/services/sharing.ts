/**
 * sharing.ts — share intents + Web Share API helpers.
 * Mock-ready boundary: no network calls here, only URL building and
 * browser APIs with graceful fallbacks. Swappable for a real backend later.
 */

export type ShareChannel = "whatsapp" | "x" | "linkedin" | "telegram" | "email";

export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

/** Pre-filled share copy with Client X attribution. */
export function shareTextFor(kind: string, title: string, extra = ""): string {
  const base =
    kind === "output"
      ? `Check out what Client X wrote for me:\n\n"${title}"`
      : kind === "agent"
        ? `I'm using the "${title}" AI agent on Client X — it handles my ${extra || "messages"} for me.`
        : kind === "campaign"
          ? `Running my "${title}" outreach with the Client X agent — personalized, approval-gated, no spam.`
          : `Found this in the Client X template gallery: "${title}"${extra ? ` — ${extra}` : ""}`;
  return `${base}\n\nMade with Client X`;
}

export function shareUrlFor(channel: ShareChannel, text: string, url: string): string {
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(url);
  switch (channel) {
    case "whatsapp":
      return `https://wa.me/?text=${t}%20${u}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "telegram":
      return `https://t.me/share/url?url=${u}&text=${t}`;
    case "email":
      return `mailto:?subject=${encodeURIComponent("Try Client X")}&body=${t}%0A%0A${u}`;
  }
}

export function openShare(channel: ShareChannel, payload: SharePayload): void {
  const href = shareUrlFor(channel, payload.text, payload.url);
  window.open(href, "_blank", "noopener,noreferrer");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function canSystemShare(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator;
}

/** Uses the Web Share API where available, falls back to clipboard. */
export async function systemShare(payload: SharePayload): Promise<"shared" | "copied" | "unavailable"> {
  if (canSystemShare()) {
    try {
      await navigator.share({ title: payload.title, text: payload.text, url: payload.url });
      return "shared";
    } catch (e) {
      // User dismissed the sheet — not an error.
      if (e instanceof Error && e.name === "AbortError") return "unavailable";
    }
  }
  const ok = await copyText(`${payload.text}\n${payload.url}`);
  return ok ? "copied" : "unavailable";
}

/** Absolute URL for an invite code / share route, works in any environment. */
export function appUrl(path: string): string {
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return path;
}
