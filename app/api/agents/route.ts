import type { NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";
import { ok, unauthorized, internalError } from "@/lib/server/http";

export async function GET(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    return ok(db.agents.list());
  } catch {
    return internalError();
  }
}
