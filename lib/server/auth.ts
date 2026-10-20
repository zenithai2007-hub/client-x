/* Client X — server-side session helper for API route handlers.
   ====================================================================
   SERVER-ONLY. This module reads the `clientx_session` cookie that
   the client-side auth flow sets, and resolves it to a user object.

   Honest status: authentication is MOCK-BACKED for now. Any non-empty
   session cookie resolves to the demo user so the API boundary can be
   exercised end-to-end. The boundary itself is real: routes that call
   `requireSession` return `401 { ok: false, error: "Unauthorized" }`
   whenever the cookie is absent or empty.

   Production swap: replace `getSessionFromRequest` with a real
   session lookup (e.g. the `Session` model in prisma/schema.prisma
   via the adapter of the auth provider). Route handlers do not
   change. Session material is never logged and never returned to a
   client beyond the public user fields below.
   ==================================================================== */

import type { NextRequest } from "next/server";
import { db, type ServerUser } from "./db";

export const SESSION_COOKIE = "clientx_session";

export interface Session {
  user: ServerUser;
}

/** Resolve the request's session, or null when there is none. */
export function getSessionFromRequest(req: NextRequest): Session | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token || token.trim().length === 0) return null;
  // Mock-backed: any non-empty session cookie resolves to the demo
  // user. The value itself is never inspected, logged, or returned.
  const users = db.users.list();
  const user = users[0] ?? null;
  if (!user) return null;
  return { user };
}

/** Same as getSessionFromRequest — named for route handlers that
 *  treat a missing session as an error condition. */
export function requireSession(req: NextRequest): Session | null {
  return getSessionFromRequest(req);
}
