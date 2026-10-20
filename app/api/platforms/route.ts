import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { getPlatforms } from "@/lib/server/platforms";
import { ok, unauthorized, internalError } from "@/lib/server/http";

export async function GET(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    // Honest by construction: every platform reports connected: false.
    return ok(getPlatforms());
  } catch {
    return internalError();
  }
}
