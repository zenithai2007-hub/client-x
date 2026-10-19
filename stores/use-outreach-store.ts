"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Approval,
  Campaign,
  ExecutionStatus,
  InFlightMap,
  Target,
  TargetState,
} from "@/lib/types";
import { outreachService, type NewCampaignData } from "@/lib/services/outreach-service";
import { uid } from "@/lib/services/base";
import { withRetry, RetryExhaustedError } from "@/lib/retry";
import {
  canonicalForPipeline,
  requirePipeline,
  requireStatus,
  StateMismatchError,
} from "@/lib/execution";
import { onApprovalResolved } from "@/lib/approval-bus";
import { useAgentStore } from "./use-agent-store";
import { useActivityStore } from "./use-activity-store";
import { useNotificationStore } from "./use-notification-store";
import { beginAction, endAction, isInFlightKey } from "./_helpers";

interface OutreachState {
  campaigns: Campaign[];
  activeCampaignId: string | null;
  loaded: boolean;
  inFlight: InFlightMap;
  isInFlight: (key: string) => boolean;

  load: () => Promise<void>;
  createCampaign: (data: NewCampaignData) => Promise<Campaign>;
  startCampaign: (id: string) => Promise<void>;
  pauseCampaign: (id: string) => Promise<void>;
  resumeCampaign: (id: string) => Promise<void>;
  stopCampaign: (id: string) => Promise<void>;
  retryTarget: (campaignId: string, targetId: string) => Promise<void>;

  /** §26 CAPTCHA flow for a single target */
  flagTargetVerification: (campaignId: string, targetId: string) => void;
  confirmTargetVerification: (campaignId: string, targetId: string) => void;
  resumeTargetAfterVerification: (campaignId: string, targetId: string) => Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Module-level run control. A token invalidates stale async loops     */
/* when a campaign is paused / stopped / restarted.                    */
/* ------------------------------------------------------------------ */
const runTokens = new Map<string, number>();
const bumpToken = (campaignId: string): number => {
  const next = (runTokens.get(campaignId) ?? 0) + 1;
  runTokens.set(campaignId, next);
  return next;
};
const tokenValid = (campaignId: string, token: number) => runTokens.get(campaignId) === token;

const TERMINAL_TARGET: ExecutionStatus[] = ["COMPLETED", "FAILED", "CANCELLED"];

/** Assigned during store creation; lets the approval bus + rehydrate resume
    a campaign without going through the public start/resume preconditions. */
let driveCampaign: ((campaignId: string) => void) | null = null;

function setTarget(
  set: (fn: (s: OutreachState) => Partial<OutreachState>) => void,
  campaignId: string,
  targetId: string,
  patch: Partial<Target>
) {
  set((s) => ({
    campaigns: s.campaigns.map((c) =>
      c.id === campaignId
        ? { ...c, targets: c.targets.map((t) => (t.id === targetId ? { ...t, ...patch } : t)) }
        : c
    ),
  }));
}

function setCampaignStatus(
  set: (fn: (s: OutreachState) => Partial<OutreachState>) => void,
  campaignId: string,
  status: ExecutionStatus,
  patch: Partial<Campaign> = {}
) {
  set((s) => ({
    campaigns: s.campaigns.map((c) => (c.id === campaignId ? { ...c, status, ...patch } : c)),
  }));
}

const readTarget = (campaignId: string, targetId: string): { camp: Campaign; t: Target } | null => {
  const camp = useOutreachStore.getState().campaigns.find((c) => c.id === campaignId);
  if (!camp) return null;
  const t = camp.targets.find((x) => x.id === targetId);
  if (!t) return null;
  return { camp, t };
};

export const useOutreachStore = create<OutreachState>()(
  persist(
    (set, get) => {
      /* Drive ONE target through the pipeline until it waits or finishes. */
      const driveTarget = async (campaignId: string, targetId: string, token: number) => {
        for (;;) {
          const cur = readTarget(campaignId, targetId);
          if (!cur) return;
          const { camp, t } = cur;

          // Abort conditions: token invalid, campaign not running, target settled.
          if (!tokenValid(campaignId, token)) return;
          if (camp.status !== "RUNNING") return;
          if (t.sentAt || t.status === "COMPLETED") return; // dedupe: never send twice
          if (
            t.status === "FAILED" ||
            t.status === "PAUSED" ||
            t.status === "CANCELLED" ||
            t.status === "WAITING_FOR_USER"
          )
            return;

          try {
            switch (t.state) {
              case "waiting": {
                requirePipeline(t.id, t.state, "waiting", "begin research");
                setTarget(set, campaignId, targetId, { state: "searching", status: "RUNNING" });
                await outreachService.researchTarget(t.id);
                break;
              }
              case "searching": {
                requirePipeline(t.id, t.state, "searching", "profile found");
                setTarget(set, campaignId, targetId, { state: "profile_found", status: "RUNNING" });
                await new Promise((r) => setTimeout(r, 500));
                break;
              }
              case "profile_found": {
                requirePipeline(t.id, t.state, "profile_found", "review");
                setTarget(set, campaignId, targetId, { state: "reviewing", status: "RUNNING" });
                await new Promise((r) => setTimeout(r, 400));
                break;
              }
              case "reviewing": {
                requirePipeline(t.id, t.state, "reviewing", "generate");
                setTarget(set, campaignId, targetId, { state: "generating", status: "RUNNING" });
                const message = await outreachService.draftMessage(t.name, camp.goal, camp.tone);
                setTarget(set, campaignId, targetId, { message });
                break;
              }
              case "generating": {
                requirePipeline(t.id, t.state, "generating", "request approval");
                // Reuse an existing pending approval instead of creating a duplicate.
                const existing = t.approvalId
                  ? useAgentStore.getState().approvals.find((a) => a.id === t.approvalId)
                  : undefined;
                if (existing && existing.status === "pending") {
                  setTarget(set, campaignId, targetId, {
                    state: "waiting_approval",
                    status: "RUNNING",
                    awaitingApproval: true,
                  });
                  return; // wait for the bus event
                }
                setTarget(set, campaignId, targetId, {
                  state: "waiting_approval",
                  status: "RUNNING",
                  awaitingApproval: true,
                });
                const agentId = useAgentStore.getState().activeAgentId;
                const approval = await useAgentStore
                  .getState()
                  .requestApproval({
                    agentId,
                    target: t.name,
                    targetId: t.id,
                    campaignId,
                    action: "send-message",
                    message: t.message ?? "",
                  });
                setTarget(set, campaignId, targetId, { approvalId: approval.id });
                return; // wait for approval resolution via the bus
              }
              case "waiting_approval":
                return; // driven by onApprovalResolved
              case "executing": {
                requirePipeline(t.id, t.state, "executing", "execute send");
                // Demo target: pause for human verification instead of sending.
                if (t.note?.includes("Demo target") && !t.verificationConfirmed) {
                  get().flagTargetVerification(campaignId, targetId);
                  return;
                }
                // Dedupe guard, checked again right before the side effect.
                if (readTarget(campaignId, targetId)?.t.sentAt) return;
                try {
                  await withRetry(() => outreachService.sendMessage(t), {
                    maxAttempts: 3,
                    baseDelayMs: 1000,
                    onAttempt: (attempt, err) =>
                      setTarget(set, campaignId, targetId, {
                        status: "RETRYING",
                        attempt,
                        error: err.message,
                      }),
                  });
                } catch (err) {
                  const attempts = err instanceof RetryExhaustedError ? err.attempts : 3;
                  const message = err instanceof Error ? err.message : String(err);
                  setTarget(set, campaignId, targetId, {
                    state: "failed",
                    status: "FAILED",
                    attempt: attempts,
                    error: message,
                    retryFrom: "executing",
                    awaitingApproval: false,
                  });
                  useActivityStore
                    .getState()
                    .logEvent("outreach", `Failed to message ${t.name} after ${attempts} attempts: ${message}`);
                  return;
                }
                const sentAt = new Date().toISOString();
                setTarget(set, campaignId, targetId, {
                  state: "completed",
                  status: "COMPLETED",
                  sentAt,
                  awaitingApproval: false,
                  attempt: undefined,
                  error: undefined,
                });
                useActivityStore
                  .getState()
                  .logEvent("outreach", `Message sent to ${t.name}.`);
                return;
              }
              default:
                return;
            }
          } catch (err) {
            if (err instanceof StateMismatchError) {
              // Graceful failure with a clear reason — never silent.
              setTarget(set, campaignId, targetId, {
                state: "failed",
                status: "FAILED",
                error: err.message,
                retryFrom: t.state === "failed" ? undefined : t.state,
              });
              useActivityStore.getState().logEvent("outreach", err.message);
              return;
            }
            throw err;
          }
        }
      };

      /* Run all targets of a campaign in order, skipping settled ones. */
      const runCampaign = async (campaignId: string, token: number) => {
        const camp = get().campaigns.find((c) => c.id === campaignId);
        if (!camp) return;
        for (const t of camp.targets) {
          if (!tokenValid(campaignId, token)) return;
          const fresh = get().campaigns.find((c) => c.id === campaignId);
          if (!fresh || fresh.status !== "RUNNING") return;
          const ft = fresh.targets.find((x) => x.id === t.id);
          if (!ft || ft.sentAt || TERMINAL_TARGET.includes(ft.status)) continue; // skip settled
          if (ft.status === "WAITING_FOR_USER") continue; // waits for the human
          if (ft.state === "waiting_approval" && ft.awaitingApproval) {
            // If the approval is already resolved, the bus handler continues it.
            continue;
          }
          await driveTarget(campaignId, t.id, token);
        }
        // Campaign completes when every target reached a terminal state.
        const done = get().campaigns.find((c) => c.id === campaignId);
        if (
          done &&
          done.status === "RUNNING" &&
          done.targets.every((t) => TERMINAL_TARGET.includes(t.status))
        ) {
          setCampaignStatus(set, campaignId, "COMPLETED");
          useActivityStore
            .getState()
            .logEvent("outreach", `Campaign "${done.name}" completed.`);
          useNotificationStore
            .getState()
            .push("Campaign completed", `"${done.name}" finished all targets.`, "success");
        }
      };

      // expose the internal driver for the approval bus + rehydrate path
      driveCampaign = (campaignId: string) => {
        const token = bumpToken(campaignId);
        void runCampaign(campaignId, token);
      };

      return {
        campaigns: [],
        activeCampaignId: null,
        loaded: false,
        inFlight: {},
        isInFlight: (key) => isInFlightKey(get().inFlight, key),

        load: async () => {
          if (get().loaded) return;
          const campaigns = await outreachService.fetchCampaigns();
          set({ campaigns, loaded: true, activeCampaignId: campaigns[0]?.id ?? null });
        },

        createCampaign: async (data) => {
          const key = `campaign:create`;
          const started = beginAction(get().inFlight, key);
          if (!started) throw new Error("Campaign creation already in progress.");
          set({ inFlight: started.map });
          try {
            const campaign = await outreachService.createCampaign(data);
            set((s) => ({
              campaigns: [campaign, ...s.campaigns],
              activeCampaignId: campaign.id,
            }));
            useActivityStore
              .getState()
              .logEvent("outreach", `Campaign "${campaign.name}" created (${campaign.targets.length} targets).`);
            return campaign;
          } finally {
            set((s) => ({ inFlight: endAction(s.inFlight, key) }));
          }
        },

        startCampaign: async (id) => {
          const key = `campaign:${id}:start`;
          const started = beginAction(get().inFlight, key);
          if (!started) return;
          set({ inFlight: started.map });
          try {
            const camp = get().campaigns.find((c) => c.id === id);
            if (!camp) return;
            requireStatus(camp.id, camp.status, ["READY", "PAUSED"], "start campaign");
            await outreachService.setStatus(id, "RUNNING");
            setCampaignStatus(set, id, "RUNNING", { error: undefined });
            set({ activeCampaignId: id });
            const token = bumpToken(id);
            useActivityStore.getState().logEvent("outreach", `Campaign "${camp.name}" started.`);
            void runCampaign(id, token);
          } catch (err) {
            if (err instanceof StateMismatchError) {
              useActivityStore.getState().logEvent("outreach", err.message);
            } else throw err;
          } finally {
            set((s) => ({ inFlight: endAction(s.inFlight, key) }));
          }
        },

        pauseCampaign: async (id) => {
          const key = `campaign:${id}:pause`;
          const started = beginAction(get().inFlight, key);
          if (!started) return;
          set({ inFlight: started.map });
          try {
            const camp = get().campaigns.find((c) => c.id === id);
            if (!camp) return;
            requireStatus(camp.id, camp.status, "RUNNING", "pause campaign");
            bumpToken(id); // invalidate the running loop
            await outreachService.setStatus(id, "PAUSED");
            setCampaignStatus(set, id, "PAUSED");
            // Targets mid-pipeline show as paused (their pipeline state is kept for resume).
            set((s) => ({
              campaigns: s.campaigns.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      targets: c.targets.map((t) =>
                        TERMINAL_TARGET.includes(t.status) || t.status === "WAITING_FOR_USER"
                          ? t
                          : { ...t, status: "PAUSED" as ExecutionStatus }
                      ),
                    }
                  : c
              ),
            }));
            useActivityStore.getState().logEvent("outreach", `Campaign "${camp.name}" paused.`);
          } catch (err) {
            if (err instanceof StateMismatchError) {
              useActivityStore.getState().logEvent("outreach", err.message);
            } else throw err;
          } finally {
            set((s) => ({ inFlight: endAction(s.inFlight, key) }));
          }
        },

        resumeCampaign: async (id) => {
          const key = `campaign:${id}:resume`;
          const started = beginAction(get().inFlight, key);
          if (!started) return;
          set({ inFlight: started.map });
          try {
            const camp = get().campaigns.find((c) => c.id === id);
            if (!camp) return;
            requireStatus(camp.id, camp.status, "PAUSED", "resume campaign");
            await outreachService.setStatus(id, "RUNNING");
            // Restore canonical statuses from stored pipeline positions; completed stays completed.
            set((s) => ({
              campaigns: s.campaigns.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      status: "RUNNING" as ExecutionStatus,
                      targets: c.targets.map((t) =>
                        TERMINAL_TARGET.includes(t.status) || t.status === "WAITING_FOR_USER"
                          ? t
                          : { ...t, status: canonicalForPipeline(t.state) }
                      ),
                    }
                  : c
              ),
            }));
            const token = bumpToken(id);
            useActivityStore.getState().logEvent("outreach", `Campaign "${camp.name}" resumed — completed targets skipped.`);
            void runCampaign(id, token);
          } catch (err) {
            if (err instanceof StateMismatchError) {
              useActivityStore.getState().logEvent("outreach", err.message);
            } else throw err;
          } finally {
            set((s) => ({ inFlight: endAction(s.inFlight, key) }));
          }
        },

        stopCampaign: async (id) => {
          const key = `campaign:${id}:stop`;
          const started = beginAction(get().inFlight, key);
          if (!started) return;
          set({ inFlight: started.map });
          try {
            const camp = get().campaigns.find((c) => c.id === id);
            if (!camp) return;
            requireStatus(
              camp.id,
              camp.status,
              ["READY", "RUNNING", "PAUSED", "RETRYING", "WAITING_FOR_USER"],
              "stop campaign"
            );
            bumpToken(id);
            await outreachService.setStatus(id, "CANCELLED");
            set((s) => ({
              campaigns: s.campaigns.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      status: "CANCELLED" as ExecutionStatus,
                      targets: c.targets.map((t) =>
                        TERMINAL_TARGET.includes(t.status)
                          ? t
                          : { ...t, state: "paused" as TargetState, status: "CANCELLED" as ExecutionStatus, awaitingApproval: false }
                      ),
                    }
                  : c
              ),
            }));
            useActivityStore.getState().logEvent("outreach", `Campaign "${camp.name}" cancelled.`);
          } catch (err) {
            if (err instanceof StateMismatchError) {
              useActivityStore.getState().logEvent("outreach", err.message);
            } else throw err;
          } finally {
            set((s) => ({ inFlight: endAction(s.inFlight, key) }));
          }
        },

        retryTarget: async (campaignId, targetId) => {
          const key = `target:${targetId}:retry`;
          const started = beginAction(get().inFlight, key);
          if (!started) return;
          set({ inFlight: started.map });
          try {
            const cur = readTarget(campaignId, targetId);
            if (!cur) return;
            requireStatus(cur.t.id, cur.t.status, "FAILED", "retry target");
            await outreachService.retryTarget(targetId);
            const from: TargetState = cur.t.retryFrom ?? "waiting";
            setTarget(set, campaignId, targetId, {
              state: from,
              status: canonicalForPipeline(from),
              attempt: undefined,
              error: undefined,
              retryFrom: undefined,
            });
            useActivityStore.getState().logEvent("outreach", `Retrying ${cur.t.name} from "${from}".`);
            const camp = get().campaigns.find((c) => c.id === campaignId);
            if (camp?.status === "RUNNING") {
              const token = runTokens.get(campaignId) ?? bumpToken(campaignId);
              void driveTarget(campaignId, targetId, token);
            }
          } catch (err) {
            if (err instanceof StateMismatchError) {
              useActivityStore.getState().logEvent("outreach", err.message);
            } else throw err;
          } finally {
            set((s) => ({ inFlight: endAction(s.inFlight, key) }));
          }
        },

        /* ---------------- §26 verification flow (targets) ---------------- */

        flagTargetVerification: (campaignId, targetId) => {
          const cur = readTarget(campaignId, targetId);
          if (!cur) return;
          setTarget(set, campaignId, targetId, {
            resumeFrom: cur.t.state === "waiting_for_user" ? cur.t.resumeFrom : cur.t.state,
            state: "waiting_for_user",
            status: "WAITING_FOR_USER",
            verificationConfirmed: false,
          });
          useNotificationStore
            .getState()
            .push("Manual verification required", `${cur.t.name}: the platform needs human verification.`, "warning");
          useActivityStore
            .getState()
            .logEvent("outreach", `${cur.t.name} paused — human verification required.`);
        },

        confirmTargetVerification: (campaignId, targetId) => {
          const cur = readTarget(campaignId, targetId);
          if (!cur || cur.t.state !== "waiting_for_user") return;
          setTarget(set, campaignId, targetId, { verificationConfirmed: true });
          useActivityStore
            .getState()
            .logEvent("outreach", `Verification confirmed for ${cur.t.name}.`);
        },

        resumeTargetAfterVerification: async (campaignId, targetId) => {
          const key = `target:${targetId}:resume-verify`;
          const started = beginAction(get().inFlight, key);
          if (!started) return;
          set({ inFlight: started.map });
          try {
            const cur = readTarget(campaignId, targetId);
            if (!cur) return;
            // Pre-action verification: must still be waiting, and confirmed by the user.
            requirePipeline(cur.t.id, cur.t.state, "waiting_for_user", "resume after verification");
            if (!cur.t.verificationConfirmed) {
              throw new StateMismatchError(cur.t.id, "resume requires user confirmation", "unconfirmed");
            }
            const from: TargetState = cur.t.resumeFrom ?? "executing";
            setTarget(set, campaignId, targetId, {
              state: from,
              status: canonicalForPipeline(from),
              resumeFrom: undefined,
              verificationConfirmed: undefined,
            });
            useActivityStore
              .getState()
              .logEvent("outreach", `${cur.t.name} resumed from "${from}" — completed actions not repeated.`);
            const camp = get().campaigns.find((c) => c.id === campaignId);
            if (camp?.status === "RUNNING") {
              const token = runTokens.get(campaignId) ?? bumpToken(campaignId);
              void driveTarget(campaignId, targetId, token);
            }
          } catch (err) {
            if (err instanceof StateMismatchError) {
              useActivityStore.getState().logEvent("outreach", err.message);
            } else throw err;
          } finally {
            set((s) => ({ inFlight: endAction(s.inFlight, key) }));
          }
        },
      };
    },
    {
      name: "clientx-outreach-store",
      storage: createJSONStorage(() => localStorage),
      // §26: persist campaigns; never inFlight / loaded flags.
      partialize: (s) => ({ campaigns: s.campaigns, activeCampaignId: s.activeCampaignId }),
      // §26: on rehydrate, re-verify RUNNING campaigns and resume —
      // completed/sent targets are never repeated (driveTarget skips them,
      // pending approvals are not recreated).
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        for (const camp of state.campaigns) {
          if (camp.status !== "RUNNING") continue;
          setTimeout(() => {
            const fresh = useOutreachStore.getState().campaigns.find((c) => c.id === camp.id);
            if (fresh && fresh.status === "RUNNING") driveCampaign?.(camp.id);
          }, 600);
        }
      },
    }
  )
);

/* Approval resolutions from the agent store continue the owning target. */
if (typeof window !== "undefined") {
  onApprovalResolved((approval: Approval) => {
    const { campaignId, targetId } = approval;
    if (!campaignId || !targetId) return;
    const camp = useOutreachStore.getState().campaigns.find((c) => c.id === campaignId);
    const t = camp?.targets.find((x) => x.id === targetId);
    if (!camp || !t) return;
    if (t.state !== "waiting_approval") return; // pre-condition: still waiting

    if (approval.status === "approved") {
      const msg = approval.editedText ?? t.message;
      useOutreachStore.setState((s) => ({
        campaigns: s.campaigns.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                targets: c.targets.map((x) =>
                  x.id === targetId
                    ? {
                        ...x,
                        state: "executing" as TargetState,
                        status: "RUNNING" as ExecutionStatus,
                        awaitingApproval: false,
                        ...(msg ? { message: msg } : {}),
                      }
                    : x
                ),
              }
            : c
        ),
      }));
      useActivityStore.getState().logEvent("outreach", `Approved — sending to ${t.name}.`);
      if (camp.status === "RUNNING") driveCampaign?.(campaignId);
    } else {
      // cancelled approval → target paused with a clear note, campaign continues
      useOutreachStore.setState((s) => ({
        campaigns: s.campaigns.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                targets: c.targets.map((x) =>
                  x.id === targetId
                    ? {
                        ...x,
                        state: "paused" as TargetState,
                        status: "PAUSED" as ExecutionStatus,
                        awaitingApproval: false,
                        note: "Approval cancelled by user.",
                      }
                    : x
                ),
              }
            : c
        ),
      }));
      useActivityStore.getState().logEvent("outreach", `Approval cancelled for ${t.name} — target paused.`);
    }
  });
}
