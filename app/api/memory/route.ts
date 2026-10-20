import type { NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";
import { ok, fail, unauthorized, internalError, parseJsonBody, isNonEmptyString } from "@/lib/server/http";
import type { MemorySection } from "@/lib/types";

const VALID_SECTIONS: MemorySection[] = ["global", "agent", "platform", "conversation", "outreach"];

export async function GET(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    return ok(db.memories.list());
  } catch {
    return internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    const body = await parseJsonBody(req);
    if (!body) return fail("Malformed request body");
    if (!isNonEmptyString(body.section)) return fail("section is required");
    if (!VALID_SECTIONS.includes(body.section as MemorySection)) {
      return fail(`section must be one of: ${VALID_SECTIONS.join(", ")}`);
    }
    if (!isNonEmptyString(body.key)) return fail("key is required");
    if (!isNonEmptyString(body.value)) return fail("value is required");
    const item = db.memories.create({
      section: body.section as MemorySection,
      key: body.key,
      value: body.value,
    });
    return ok(item, 201);
  } catch {
    return internalError();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    const id = req.nextUrl.searchParams.get("id");
    if (!isNonEmptyString(id)) return fail("Missing required query parameter: id");
    const deleted = db.memories.delete(id);
    if (!deleted) return fail("Memory item not found", 404);
    return ok({ deleted: true });
  } catch {
    return internalError();
  }
}
