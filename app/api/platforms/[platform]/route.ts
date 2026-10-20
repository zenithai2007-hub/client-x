import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { getPlatform } from "@/lib/server/platforms";
import { ok, fail, unauthorized, internalError } from "@/lib/server/http";

export async function GET(req: NextRequest, { params }: { params: { platform: string } }) {
  try {
    if (!requireSession(req)) return unauthorized();
    const info = getPlatform(params.platform);
    if (!info) return fail(`Unknown platform: ${params.platform}`, 404);
    return ok(info);
  } catch {
    return internalError();
  }
}
