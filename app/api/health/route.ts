import { ok, internalError } from "@/lib/server/http";

export async function GET() {
  try {
    return ok({ status: "ok", time: new Date().toISOString() });
  } catch {
    return internalError();
  }
}
