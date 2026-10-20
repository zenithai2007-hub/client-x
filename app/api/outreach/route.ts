import type { NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";
import { ok, fail, unauthorized, internalError, parseJsonBody, isNonEmptyString } from "@/lib/server/http";

export async function GET(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    return ok(db.campaigns.list());
  } catch {
    return internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    const body = await parseJsonBody(req);
    if (!body) return fail("Malformed request body");
    if (!isNonEmptyString(body.name)) return fail("name is required");
    if (!isNonEmptyString(body.platform)) return fail("platform is required");
    if (!isNonEmptyString(body.goal)) return fail("goal is required");
    // Drafts only: nothing is sent until a real integration is
    // configured and the user approves. Status stays READY.
    const campaign = db.campaigns.create({
      name: body.name,
      platform: body.platform,
      goal: body.goal,
      tone: isNonEmptyString(body.tone) ? body.tone : undefined,
      messageStyle: isNonEmptyString(body.messageStyle) ? body.messageStyle : undefined,
    });
    return ok(campaign, 201);
  } catch {
    return internalError();
  }
}
