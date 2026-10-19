/* Approval routing bus.
   The agent store resolves approvals; the outreach store must continue the
   affected target. This tiny bus decouples the two stores (no import cycle):
   agent store emits, outreach store subscribes. */

import type { Approval } from "./types";

type ApprovalListener = (approval: Approval) => void;

const listeners = new Set<ApprovalListener>();

export function onApprovalResolved(fn: ApprovalListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitApprovalResolved(approval: Approval): void {
  listeners.forEach((fn) => {
    try {
      fn(approval);
    } catch {
      /* a listener must never break approval resolution */
    }
  });
}
