import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { ok, unauthorized, internalError } from "@/lib/server/http";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return unauthorized();
    return ok({ user: session.user });
  } catch {
    return internalError();
  }
}
