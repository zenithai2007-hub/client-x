import type { NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";
import { ok, fail, unauthorized, internalError } from "@/lib/server/http";
import type { ActivityCategory } from "@/lib/types";

const VALID_CATEGORIES: ActivityCategory[] = ["agents", "outreach", "keyboard", "tasks", "system"];

export async function GET(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    const category = req.nextUrl.searchParams.get("category");
    if (category !== null && !VALID_CATEGORIES.includes(category as ActivityCategory)) {
      return fail(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }
    return ok(db.activity.list(category ?? undefined));
  } catch {
    return internalError();
  }
}
