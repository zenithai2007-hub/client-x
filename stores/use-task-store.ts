"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ClientTask, ExecutionStatus, InFlightMap } from "@/lib/types";
import { taskService } from "@/lib/services/task-service";
import { nowISO } from "@/lib/services/base";
import { requireStatus, StateMismatchError } from "@/lib/execution";
import { useActivityStore } from "./use-activity-store";
import { useNotificationStore } from "./use-notification-store";
import { beginAction, endAction, isInFlightKey } from "./_helpers";

interface TaskState {
  tasks: ClientTask[];
  loaded: boolean;
  inFlight: InFlightMap;
  isInFlight: (key: string) => boolean;

  load: () => Promise<void>;
  createTask: (title: string, agentId: string, detail?: string) => Promise<ClientTask>;
  startTask: (id: string) => Promise<void>;
  pauseTask: (id: string) => Promise<void>;
  resumeTask: (id: string) => Promise<void>;
  stopTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  /** Simulated progress for running tasks (also driven by the internal ticker). */
  tickProgress: (id: string) => void;

  /** §26 CAPTCHA / human-verification flow */
  flagVerificationNeeded: (id: string, reason?: string) => void;
  confirmVerification: (id: string) => void;
  resumeAfterVerification: (id: string) => Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Simulated progress ticker — advances RUNNING tasks until completion. */
/* Never repeats completed work: progress is persisted and monotonic.  */
/* ------------------------------------------------------------------ */
let ticker: ReturnType<typeof setInterval> | null = null;

function ensureTicker() {
  if (ticker || typeof window === "undefined") return;
  ticker = setInterval(() => {
    const st = useTaskStore.getState();
    for (const t of st.tasks) {
      if (t.status === "RUNNING" && t.progress < t.total) {
        st.tickProgress(t.id);
      }
    }
  }, 2000);
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => {
      const patchTask = (id: string, patch: Partial<ClientTask>) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }));

      const find = (id: string) => get().tasks.find((t) => t.id === id);

      const completeTask = (t: ClientTask) => {
        patchTask(t.id, { status: "COMPLETED", progress: t.total, completedAt: nowISO() });
        useActivityStore.getState().logEvent("tasks", `Task "${t.title}" completed.`);
        useNotificationStore.getState().push("Task completed", `"${t.title}" finished.`, "success");
      };

      return {
        tasks: [],
        loaded: false,
        inFlight: {},
        isInFlight: (key) => isInFlightKey(get().inFlight, key),

        load: async () => {
          if (get().loaded) return;
          const tasks = await taskService.fetchTasks();
          set({ tasks, loaded: true });
          ensureTicker();
        },

        createTask: async (title, agentId, detail) => {
          const key = `task:create`;
          const started = beginAction(get().inFlight, key);
          if (!started) throw new Error("Task creation already in progress.");
          set({ inFlight: started.map });
          try {
            const task = await taskService.createTask({ title, agentId, detail });
            task.status = "READY";
            set((s) => ({ tasks: [task, ...s.tasks] }));
            useActivityStore.getState().logEvent("tasks", `Task "${title}" created.`);
            return task;
          } finally {
            set((s) => ({ inFlight: endAction(s.inFlight, key) }));
          }
        },

        startTask: async (id) => {
          const key = `task:${id}:start`;
          const started = beginAction(get().inFlight, key);
          if (!started) return;
          set({ inFlight: started.map });
          try {
            const t = find(id);
            if (!t) return;
            requireStatus(t.id, t.status, ["READY", "PAUSED"], "start task");
            await taskService.setStatus(id, "RUNNING");
            patchTask(id, { status: "RUNNING", error: undefined });
            ensureTicker();
            useActivityStore.getState().logEvent("tasks", `Task "${t.title}" started.`);
          } catch (err) {
            if (err instanceof StateMismatchError) {
              useActivityStore.getState().logEvent("tasks", err.message);
            } else throw err;
          } finally {
            set((s) => ({ inFlight: endAction(s.inFlight, key) }));
          }
        },

        pauseTask: async (id) => {
          const key = `task:${id}:pause`;
          const started = beginAction(get().inFlight, key);
          if (!started) return;
          set({ inFlight: started.map });
          try {
            const t = find(id);
            if (!t) return;
            requireStatus(t.id, t.status, ["RUNNING", "RETRYING"], "pause task");
            await taskService.setStatus(id, "PAUSED");
            patchTask(id, { status: "PAUSED" });
            useActivityStore.getState().logEvent("tasks", `Task "${t.title}" paused.`);
          } catch (err) {
            if (err instanceof StateMismatchError) {
              useActivityStore.getState().logEvent("tasks", err.message);
            } else throw err;
          } finally {
            set((s) => ({ inFlight: endAction(s.inFlight, key) }));
          }
        },

        resumeTask: async (id) => {
          const key = `task:${id}:resume`;
          const started = beginAction(get().inFlight, key);
          if (!started) return;
          set({ inFlight: started.map });
          try {
            const t = find(id);
            if (!t) return;
            requireStatus(t.id, t.status, "PAUSED", "resume task");
            // Re-verify: if progress already reached total, complete instead of resuming.
            if (t.progress >= t.total) {
              completeTask(t);
              return;
            }
            await taskService.setStatus(id, "RUNNING");
            patchTask(id, { status: "RUNNING" });
            ensureTicker();
            useActivityStore.getState().logEvent("tasks", `Task "${t.title}" resumed.`);
          } catch (err) {
            if (err instanceof StateMismatchError) {
              useActivityStore.getState().logEvent("tasks", err.message);
            } else throw err;
          } finally {
            set((s) => ({ inFlight: endAction(s.inFlight, key) }));
          }
        },

        stopTask: async (id) => {
          const key = `task:${id}:stop`;
          const started = beginAction(get().inFlight, key);
          if (!started) return;
          set({ inFlight: started.map });
          try {
            const t = find(id);
            if (!t) return;
            requireStatus(
              t.id,
              t.status,
              ["READY", "RUNNING", "PAUSED", "RETRYING", "WAITING_FOR_USER"],
              "stop task"
            );
            await taskService.setStatus(id, "CANCELLED");
            patchTask(id, { status: "CANCELLED" });
            useActivityStore.getState().logEvent("tasks", `Task "${t.title}" cancelled.`);
          } catch (err) {
            if (err instanceof StateMismatchError) {
              useActivityStore.getState().logEvent("tasks", err.message);
            } else throw err;
          } finally {
            set((s) => ({ inFlight: endAction(s.inFlight, key) }));
          }
        },

        deleteTask: async (id) => {
          const t = find(id);
          if (!t) return;
          await taskService.deleteTask(id);
          set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) }));
          useActivityStore.getState().logEvent("tasks", `Task "${t.title}" deleted.`);
        },

        tickProgress: (id) => {
          const t = find(id);
          if (!t || t.status !== "RUNNING") return; // pre-condition: only RUNNING advances
          const next = Math.min(t.total, t.progress + 2 + Math.floor(Math.random() * 5));
          if (next >= t.total) {
            completeTask({ ...t, progress: next });
          } else {
            patchTask(id, { progress: next });
            taskService.updateProgress(id, next);
          }
        },

        /* ---------------- §26 verification flow (tasks) ---------------- */

        flagVerificationNeeded: (id, reason = "captcha") => {
          const t = find(id);
          if (!t) return;
          if (t.status === "WAITING_FOR_USER") return; // already flagged
          patchTask(id, {
            prevStatus: t.status === "COMPLETED" || t.status === "FAILED" ? "READY" : t.status,
            status: "WAITING_FOR_USER",
            verification: { reason, confirmed: false },
          });
          useNotificationStore
            .getState()
            .push("Manual verification required", `Task "${t.title}" needs human verification.`, "warning");
          useActivityStore
            .getState()
            .logEvent("tasks", `Task "${t.title}" paused — human verification required.`);
        },

        confirmVerification: (id) => {
          const t = find(id);
          if (!t || t.status !== "WAITING_FOR_USER" || !t.verification) return;
          patchTask(id, { verification: { ...t.verification, confirmed: true } });
          useActivityStore
            .getState()
            .logEvent("tasks", `Verification confirmed for "${t.title}".`);
        },

        resumeAfterVerification: async (id) => {
          const key = `task:${id}:resume-verify`;
          const started = beginAction(get().inFlight, key);
          if (!started) return;
          set({ inFlight: started.map });
          try {
            const t = find(id);
            if (!t) return;
            // Pre-action verification: still waiting + user confirmed.
            requireStatus(t.id, t.status, "WAITING_FOR_USER", "resume after verification");
            if (!t.verification?.confirmed) {
              throw new StateMismatchError(t.id, "resume requires user confirmation", "unconfirmed");
            }
            const restore: ExecutionStatus = t.prevStatus ?? "READY";
            const patch: Partial<ClientTask> = {
              status: restore,
              prevStatus: undefined,
              verification: undefined,
            };
            // Re-verify current state before resuming: don't restart finished work.
            if (t.progress >= t.total) {
              patch.status = "COMPLETED";
              patch.completedAt = nowISO();
            }
            patchTask(id, patch);
            ensureTicker();
            useActivityStore
              .getState()
              .logEvent("tasks", `Task "${t.title}" resumed from "${restore}" — completed work not repeated.`);
          } catch (err) {
            if (err instanceof StateMismatchError) {
              useActivityStore.getState().logEvent("tasks", err.message);
            } else throw err;
          } finally {
            set((s) => ({ inFlight: endAction(s.inFlight, key) }));
          }
        },
      };
    },
    {
      name: "clientx-task-store",
      storage: createJSONStorage(() => localStorage),
      // §26: persist tasks; never inFlight / loaded flags.
      partialize: (s) => ({ tasks: s.tasks }),
      // §26: on rehydrate, RUNNING tasks re-verify then resume via the ticker.
      // Progress is monotonic + persisted, so completed work never repeats.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        for (const t of state.tasks) {
          if (t.status === "RUNNING") {
            if (t.progress >= t.total) {
              t.status = "COMPLETED";
              t.completedAt = t.completedAt ?? nowISO();
            }
          }
        }
        setTimeout(() => ensureTicker(), 600);
      },
    }
  )
);
