import type { NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";
import { ok, fail, unauthorized, internalError, parseJsonBody, isNonEmptyString } from "@/lib/server/http";
import type { ExecutionStatus } from "@/lib/types";

const VALID_STATUSES: ExecutionStatus[] = [
  "READY",
  "RUNNING",
  "PAUSED",
  "WAITING_FOR_USER",
  "RETRYING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!requireSession(req)) return unauthorized();
    const body = await parseJsonBody(req);
    if (!body) return fail("Malformed request body");
    if (!isNonEmptyString(body.status)) return fail("status is required");
    if (!VALID_STATUSES.includes(body.status as ExecutionStatus)) {
      return fail(`status must be one of: ${VALID_STATUSES.join(", ")}`);
    }
    const task = db.tasks.get(params.id);
    if (!task) return fail("Task not found", 404);
    const updated = db.tasks.update(params.id, { status: body.status as ExecutionStatus });
    if (!updated) return fail("Task not found", 404);
    return ok(updated);
  } catch {
    return internalError();
  }
}
