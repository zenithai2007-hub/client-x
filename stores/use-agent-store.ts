"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Agent, AgentPlatform, AgentStatus, Approval, InFlightMap } from "@/lib/types";
import { agentService } from "@/lib/services/agent-service";
import { uid, nowISO } from "@/lib/services/base";
import { emitApprovalResolved } from "@/lib/approval-bus";
import { useActivityStore } from "./use-activity-store";
import { useNotificationStore } from "./use-notification-store";
import { beginAction, endAction, isInFlightKey } from "./_helpers";

interface RequestApprovalData {
  agentId: string;
  target: string;
  targetId?: string;
  campaignId?: string;
  action: string;
  message: string;
}

interface AgentState {
  agents: Agent[];
  activeAgentId: string;
  approvals: Approval[];
  loaded: boolean;
  inFlight: InFlightMap;
  isInFlight: (key: string) => boolean;

  load: () => Promise<void>;
  setActiveAgent: (id: string) => void;
  pauseAgent: (id: string) => Promise<void>;
  resumeAgent: (id: string) => Promise<void>;
  stopAgent: (id: string) => Promise<void>;
  updateInstructions: (id: string, text: string) => Promise<void>;
  togglePermission: (id: string, key: string) => Promise<void>;
  requestApproval: (data: RequestApprovalData) => Promise<Approval>;
  resolveApproval: (
    id: string,
    decision: "approved" | "cancelled" | "edited",
    editedText?: string
  ) => Promise<void>;
  logAgentActivity: (id: string, text: string) => void;
  pendingApprovals: () => Approval[];
  createAgent: (data: {
    name: string;
    platform: AgentPlatform;
    instructions: string;
    permissions?: Record<string, boolean>;
  }) => Promise<Agent>;
}

const agentName = (agents: Agent[], id: string) => agents.find((a) => a.id === id)?.name ?? id;

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [],
      activeAgentId: "ag-linkedin",
      approvals: [],
      loaded: false,
      inFlight: {},
      isInFlight: (key) => isInFlightKey(get().inFlight, key),

      load: async () => {
        if (get().loaded) return;
        const agents = await agentService.fetchAgents();
        set({ agents, loaded: true });
      },

      setActiveAgent: (id) => set({ activeAgentId: id }),

      pauseAgent: async (id) => {
        const key = `agent:${id}:pause`;
        const started = beginAction(get().inFlight, key);
        if (!started) return;
        set({ inFlight: started.map });
        try {
          await agentService.setStatus(id, "paused");
          set((s) => ({
            agents: s.agents.map((a) => (a.id === id ? { ...a, status: "paused" } : a)),
          }));
          get().logAgentActivity(id, "Paused by user.");
          useActivityStore.getState().logEvent("agents", `${agentName(get().agents, id)} paused.`);
        } finally {
          set((s) => ({ inFlight: endAction(s.inFlight, key) }));
        }
      },

      resumeAgent: async (id) => {
        const key = `agent:${id}:resume`;
        const started = beginAction(get().inFlight, key);
        if (!started) return;
        set({ inFlight: started.map });
        try {
          await agentService.setStatus(id, "active");
          set((s) => ({
            agents: s.agents.map((a) => (a.id === id ? { ...a, status: "active" } : a)),
          }));
          get().logAgentActivity(id, "Resumed by user.");
          useActivityStore.getState().logEvent("agents", `${agentName(get().agents, id)} resumed.`);
        } finally {
          set((s) => ({ inFlight: endAction(s.inFlight, key) }));
        }
      },

      stopAgent: async (id) => {
        const key = `agent:${id}:stop`;
        const started = beginAction(get().inFlight, key);
        if (!started) return;
        set({ inFlight: started.map });
        try {
          await agentService.setStatus(id, "ready");
          set((s) => ({
            agents: s.agents.map((a) =>
              a.id === id ? { ...a, status: "ready", currentTask: undefined, progress: undefined } : a
            ),
          }));
          get().logAgentActivity(id, "Stopped by user.");
          useActivityStore.getState().logEvent("agents", `${agentName(get().agents, id)} stopped.`);
        } finally {
          set((s) => ({ inFlight: endAction(s.inFlight, key) }));
        }
      },

      updateInstructions: async (id, text) => {
        const key = `agent:${id}:instructions`;
        const started = beginAction(get().inFlight, key);
        if (!started) return;
        set({ inFlight: started.map });
        try {
          await agentService.updateInstructions(id, text);
          set((s) => ({
            agents: s.agents.map((a) => (a.id === id ? { ...a, instructions: text } : a)),
          }));
          useActivityStore.getState().logEvent("agents", `Instructions updated for ${agentName(get().agents, id)}.`);
        } finally {
          set((s) => ({ inFlight: endAction(s.inFlight, key) }));
        }
      },

      togglePermission: async (id, permKey) => {
        const key = `agent:${id}:perm:${permKey}`;
        const started = beginAction(get().inFlight, key);
        if (!started) return;
        set({ inFlight: started.map });
        try {
          await agentService.togglePermission(id, permKey);
          set((s) => ({
            agents: s.agents.map((a) =>
              a.id === id
                ? { ...a, permissions: { ...a.permissions, [permKey]: !a.permissions[permKey] } }
                : a
            ),
          }));
        } finally {
          set((s) => ({ inFlight: endAction(s.inFlight, key) }));
        }
      },

      requestApproval: async (data) => {
        const approval = await agentService.requestApproval(data);
        set((s) => ({ approvals: [approval, ...s.approvals] }));
        const name = agentName(get().agents, data.agentId);
        useNotificationStore
          .getState()
          .push("Approval needed", `${name}: ${data.action} for ${data.target}.`, "approval");
        useActivityStore
          .getState()
          .logEvent("agents", `${name} requested approval (${data.action} → ${data.target}).`);
        return approval;
      },

      resolveApproval: async (id, decision, editedText) => {
        const key = `approval:${id}:resolve`;
        const started = beginAction(get().inFlight, key);
        if (!started) return;
        set({ inFlight: started.map });
        try {
          const approval = get().approvals.find((a) => a.id === id);
          // Pre-action verification: only a pending approval can be resolved.
          if (!approval || approval.status !== "pending") return;
          await agentService.resolveApproval(id, decision, editedText);
          const resolved: Approval = {
            ...approval,
            status: decision === "cancelled" ? "cancelled" : "approved",
            resolvedAt: nowISO(),
            ...(decision === "edited" && editedText ? { editedText } : {}),
          };
          set((s) => ({
            approvals: s.approvals.map((a) => (a.id === id ? resolved : a)),
          }));
          const name = agentName(get().agents, approval.agentId);
          useActivityStore
            .getState()
            .logEvent("agents", `${name}: approval ${resolved.status} for ${approval.target}.`);
          // Route to the owning domain (outreach targets) via the bus — no import cycle.
          emitApprovalResolved(resolved);
        } finally {
          set((s) => ({ inFlight: endAction(s.inFlight, key) }));
        }
      },

      logAgentActivity: (id, text) => {
        const entry = { time: nowISO(), text };
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === id ? { ...a, activity: [entry, ...a.activity].slice(0, 30) } : a
          ),
        }));
        // fire-and-forget service echo
        agentService.logActivity(id, text);
      },

      pendingApprovals: () => get().approvals.filter((a) => a.status === "pending"),

      createAgent: async (data) => {
        const key = `agent:create:${data.name}`;
        const started = beginAction(get().inFlight, key);
        if (!started) {
          // Idempotent: a create for this name is already in flight — return existing match.
          const existing = get().agents.find((a) => a.name === data.name);
          if (existing) return existing;
          throw new Error("Agent creation already in progress.");
        }
        set({ inFlight: started.map });
        try {
          await agentService.fetchAgents(); // mock latency
          const agent: Agent = {
            id: `ag-${uid()}`,
            name: data.name,
            platform: data.platform,
            status: "ready",
            instructions: data.instructions,
            permissions: data.permissions ?? {
              sendMessages: false,
              readProfile: true,
              manageConnections: false,
              autoApprove: false,
            },
            activity: [{ time: nowISO(), text: "Agent created from a community template." }],
          };
          set((s) => ({ agents: [agent, ...s.agents] }));
          useActivityStore
            .getState()
            .logEvent("agents", `Agent "${agent.name}" created from a community template.`);
          useNotificationStore
            .getState()
            .push("Agent created", `"${agent.name}" is ready in your workspace.`, "success");
          return agent;
        } finally {
          set((s) => ({ inFlight: endAction(s.inFlight, key) }));
        }
      },
    }),
    {
      name: "clientx-agent-store",
      storage: createJSONStorage(() => localStorage),
      // §26: persist agents (instructions/permissions) + approvals; never inFlight.
      partialize: (s) => ({
        agents: s.agents,
        activeAgentId: s.activeAgentId,
        approvals: s.approvals,
      }),
    }
  )
);
