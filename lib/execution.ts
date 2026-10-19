/* §26 — execution helpers: canonical status mapping, pre-action
   verification, and the CAPTCHA flow copy (exact strings). */

import type { ExecutionStatus, TargetState } from "./types";

/** Granular outreach pipeline → canonical status for badges. */
export function canonicalForPipeline(state: TargetState): ExecutionStatus {
  switch (state) {
    case "waiting":
      return "READY";
    case "searching":
    case "profile_found":
    case "reviewing":
    case "generating":
    case "waiting_approval":
    case "executing":
      return "RUNNING";
    case "waiting_for_user":
      return "WAITING_FOR_USER";
    case "completed":
      return "COMPLETED";
    case "failed":
      return "FAILED";
    case "paused":
      return "PAUSED";
  }
}

/** Ordered pipeline; used to resume a target from its stored position. */
export const PIPELINE_ORDER: TargetState[] = [
  "waiting",
  "searching",
  "profile_found",
  "reviewing",
  "generating",
  "waiting_approval",
  "executing",
  "completed",
];

/* ------------------------------------------------------------------ */
/* Pre-action verification: every state transition must verify the     */
/* entity is still in its expected pre-condition. On mismatch the      */
/* caller fails gracefully — never silently.                           */
/* ------------------------------------------------------------------ */

export class StateMismatchError extends Error {
  entityId: string;
  expected: string;
  actual: string;
  constructor(entityId: string, expected: string, actual: string) {
    super(
      `Pre-action check failed for ${entityId}: expected "${expected}", found "${actual}". Action aborted safely.`
    );
    this.name = "StateMismatchError";
    this.entityId = entityId;
    this.expected = expected;
    this.actual = actual;
  }
}

export function requireStatus(
  entityId: string,
  actual: ExecutionStatus,
  expected: ExecutionStatus | ExecutionStatus[],
  action: string
): void {
  const list = Array.isArray(expected) ? expected : [expected];
  if (!list.includes(actual)) {
    throw new StateMismatchError(entityId, `${action} requires ${list.join("|")}`, actual);
  }
}

export function requirePipeline(
  entityId: string,
  actual: TargetState,
  expected: TargetState | TargetState[],
  action: string
): void {
  const list = Array.isArray(expected) ? expected : [expected];
  if (!list.includes(actual)) {
    throw new StateMismatchError(entityId, `${action} requires ${list.join("|")}`, actual);
  }
}

/* ------------------------------------------------------------------ */
/* CAPTCHA / human-verification flow — EXACT copy, used by the          */
/* VerificationCard component and the store actions.                   */
/* ------------------------------------------------------------------ */

export const VERIFICATION_COPY = {
  title: "Manual verification required",
  description:
    "Client X has paused this task because the target platform requires human verification. Complete the verification on the target platform to continue.",
  openPlatform: "Open Platform",
  confirmDone: "I've Completed Verification",
  pauseTask: "Pause Task",
  cancelTask: "Cancel Task",
  completedTitle: "Verification completed",
  resumeTask: "Resume Task",
  honesty:
    "Client X NEVER bypasses, evades, or auto-solves CAPTCHAs, anti-bot challenges, rate limits, or login challenges.",
} as const;
