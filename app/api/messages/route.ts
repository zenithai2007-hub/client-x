import type { NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";
import { ok, fail, unauthorized, internalError, parseJsonBody, isNonEmptyString } from "@/lib/server/http";

export async function GET(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    const conversationId = req.nextUrl.searchParams.get("conversationId");
    if (!isNonEmptyString(conversationId)) {
      return fail("Missing required query parameter: conversationId");
    }
    return ok(db.messages.list(conversationId));
  } catch {
    return internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    const body = await parseJsonBody(req);
    if (!body) return fail("Malformed request body");
    const conversationId = body.conversationId;
    const text = body.text;
    if (!isNonEmptyString(conversationId)) return fail("conversationId is required");
    if (!isNonEmptyString(text)) return fail("text is required");
    if (!db.conversations.get(conversationId)) return fail("Conversation not found", 404);
    const message = db.messages.create(conversationId, { text });
    return ok(message, 201);
  } catch {
    return internalError();
  }
}
