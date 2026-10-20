import type { NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";
import { ok, fail, unauthorized, internalError, parseJsonBody, isNonEmptyString } from "@/lib/server/http";

export async function GET(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    return ok(db.approvals.list());
  } catch {
    return internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    const body = await parseJsonBody(req);
    if (!body) return fail("Malformed request body");
    if (!isNonEmptyString(body.approvalId)) return fail("approvalId is required");
    if (typeof body.approved !== "boolean") return fail("approved must be a boolean");
    const approval = db.approvals.get(body.approvalId);
    if (!approval) return fail("Approval not found", 404);
    if (approval.status !== "pending") return fail(`Approval is already ${approval.status}`);
    const resolved = db.approvals.resolve(body.approvalId, body.approved);
    return ok(resolved ?? approval);
  } catch {
    return internalError();
  }
}
