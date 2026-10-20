/* Client X — shared helpers for API route handlers.
   SERVER-ONLY. Every response uses the same envelope:
   success -> { ok: true, data: ... }
   failure -> { ok: false, error: "..." }
   No secrets are ever serialised here. */

import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(error: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error }, { status });
}

export const unauthorized = () => fail("Unauthorized", 401);
export const internalError = () => fail("Internal error", 500);

/** True when `value` is a non-empty string after trimming. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Parse a JSON request body defensively. Returns null for empty,
 *  malformed, or non-object bodies so routes can answer 400. */
export async function parseJsonBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text();
    if (!text || text.trim().length === 0) return null;
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}
