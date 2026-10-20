import type { NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";
import { ok, fail, unauthorized, internalError, parseJsonBody, isNonEmptyString } from "@/lib/server/http";

export async function GET(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    return ok(db.tasks.list());
  } catch {
    return internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    const body = await parseJsonBody(req);
    if (!body) return fail("Malformed request body");
    if (!isNonEmptyString(body.title)) return fail("title is required");
    if (!isNonEmptyString(body.agentId)) return fail("agentId is required");
    const task = db.tasks.create({
      title: body.title,
      agentId: body.agentId,
      detail: isNonEmptyString(body.detail) ? body.detail : undefined,
    });
    return ok(task, 201);
  } catch {
    return internalError();
  }
}
