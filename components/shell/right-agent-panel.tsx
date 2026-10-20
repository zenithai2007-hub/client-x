"use client";

import { useState } from "react";
import { Bot, Pause, Square, Check, ChevronRight, X } from "lucide-react";
import { useAgentStore } from "@/stores/use-agent-store";
import { useUIStore } from "@/stores/use-ui-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  ready: "bg-blue-50 text-blue-700",
  paused: "bg-amber-50 text-amber-700",
  offline: "bg-slate-100 text-slate-500",
};

export function AgentPanelCard() {
  const {
    agents, activeAgentId, setActiveAgent,
    pauseAgent, resumeAgent, stopAgent,
    pendingApprovals, resolveApproval, isInFlight,
  } = useAgentStore();
  const { toggleRightPanel } = useUIStore();
  const [approveOpen, setApproveOpen] = useState(false);

  const agent = agents.find((a) => a.id === activeAgentId) ?? agents[0];
  const pending = pendingApprovals().filter((a) => !agent || a.agentId === agent.id);

  return (
    <>
      <Card className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cx-purpleLight text-cx-purpleDark">
              <Bot size={18} />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">Client X Agent</p>
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    agent?.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                  )}
                />
                {agent ? agent.status : "—"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleRightPanel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/60"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Agent switcher */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => setActiveAgent(a.id)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                a.id === agent?.id
                  ? "bg-cx-purple text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {a.name.replace(" Agent", "")}
            </button>
          ))}
        </div>

        {agent && (
          <>
            {/* Current task */}
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Current task</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {agent.currentTask ?? "Idle — no active task"}
              </p>
              {agent.progress !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <ProgressBar value={agent.progress} className="flex-1" />
                  <span className="text-xs text-slate-500">{agent.progress}%</span>
                </div>
              )}
            </div>

            {/* Activity checklist */}
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Activity</p>
              <ul className="mt-2 space-y-2">
                {agent.activity.slice(0, 5).map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                    <span className="flex-1">{e.text}</span>
                  </li>
                ))}
                {agent.activity.length === 0 && (
                  <li className="text-xs text-slate-400">No activity yet.</li>
                )}
              </ul>
            </div>

            {/* Actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {agent.status === "paused" ? (
                <Button
                  size="sm"
                  onClick={() => resumeAgent(agent.id)}
                  disabled={isInFlight(`agent:${agent.id}:resume`)}
                  loading={isInFlight(`agent:${agent.id}:resume`)}
                >
                  Resume
                </Button>
              ) : (
                <Button
                  size="sm"
                  icon={<Pause size={14} />}
                  onClick={() => pauseAgent(agent.id)}
                  disabled={isInFlight(`agent:${agent.id}:pause`) || agent.status !== "active"}
                  loading={isInFlight(`agent:${agent.id}:pause`)}
                >
                  Pause
                </Button>
              )}
              <Button
                size="sm"
                variant="danger"
                icon={<Square size={14} />}
                onClick={() => stopAgent(agent.id)}
                disabled={isInFlight(`agent:${agent.id}:stop`)}
                loading={isInFlight(`agent:${agent.id}:stop`)}
              >
                Stop
              </Button>
              <Button
                size="sm"
                variant="primary-orange"
                icon={<Check size={14} />}
                className="col-span-2"
                onClick={() => setApproveOpen(true)}
                disabled={pending.length === 0}
              >
                Approve{pending.length > 0 ? ` (${pending.length})` : ""}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="col-span-2 justify-between"
                onClick={() => {
                  useUIStore.getState().setActiveNav("agents");
                  window.location.href = "/agents";
                }}
              >
                View Details <ChevronRight size={14} />
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Pending approvals modal */}
      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="Pending approvals">
        <div className="space-y-3">
          {pending.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">No pending approvals.</p>
          )}
          {pending.map((a) => (
            <div key={a.id} className="rounded-xl  p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{a.target}</p>
                <Badge tone="purple">{a.action}</Badge>
              </div>
              <p className="mt-1.5 rounded-lg bg-cx-bg shadow-cx-inset-sm p-2 text-xs text-slate-600">{a.message}</p>
              <div className="mt-2.5 flex gap-2">
                <Button
                  size="sm"
                  variant="primary-orange"
                  onClick={() => resolveApproval(a.id, "approved")}
                  disabled={isInFlight(`approval:${a.id}:resolve`)}
                  loading={isInFlight(`approval:${a.id}:resolve`)}
                >
                  Approve & Send
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => resolveApproval(a.id, "cancelled")}
                  disabled={isInFlight(`approval:${a.id}:resolve`)}
                  className="text-red-600 hover:bg-red-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}

/** Desktop wrapper: sticky right column. Mobile uses MobileAgentSheet. */
export function RightAgentPanel() {
  const { rightPanelOpen, toggleRightPanel } = useUIStore();
  if (!rightPanelOpen) {
    return (
      <button
        onClick={toggleRightPanel}
        className="fixed right-4 top-20 z-40 hidden h-10 w-10 items-center justify-center rounded-xl  bg-cx-surface text-slate-500 shadow-cx-card hover:text-slate-700 lg:flex"
        aria-label="Open agent panel"
      >
        <Bot size={18} />
      </button>
    );
  }
  return (
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 overflow-y-auto border-l border-white/60 bg-cx-surface/60 p-4 lg:block">
      <AgentPanelCard />
    </aside>
  );
}
