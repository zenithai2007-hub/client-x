"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Pause, Play } from "lucide-react";
import type { Agent } from "@/lib/types";
import { useAgentStore } from "@/stores/use-agent-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { agentExecStatus, platformIcon, platformLabel, timeAgo } from "./agent-meta";

export function AgentCard({ agent, index = 0 }: { agent: Agent; index?: number }) {
  const pauseAgent = useAgentStore((s) => s.pauseAgent);
  const resumeAgent = useAgentStore((s) => s.resumeAgent);
  const isInFlight = useAgentStore((s) => s.isInFlight);

  const Icon = platformIcon[agent.platform];
  const isPaused = agent.status === "paused";
  const busy = isInFlight(`agent:${agent.id}:pause`) || isInFlight(`agent:${agent.id}:resume`);
  const lastActivity = agent.activity[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
    >
      <Card hover className="flex h-full flex-col p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cx-purpleLight text-cx-purpleDark">
            <Icon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-900">{agent.name}</h3>
              <StatusBadge status={agentExecStatus(agent.status)} />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{platformLabel[agent.platform]}</p>
          </div>
        </div>

        <div className="mt-4 flex-1 space-y-3">
          {agent.currentTask ? (
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium text-slate-700">{agent.currentTask}</p>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
                  {Math.round(agent.progress ?? 0)}%
                </span>
              </div>
              <ProgressBar value={agent.progress ?? 0} className="mt-1.5" />
            </div>
          ) : (
            <p className="text-xs text-slate-400">No active task</p>
          )}

          {lastActivity ? (
            <p className="truncate text-[11px] text-slate-400">
              {lastActivity.text} · {timeAgo(lastActivity.time)}
            </p>
          ) : (
            <p className="text-[11px] text-slate-400">No activity yet</p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-white/50 pt-3">
          <Button
            size="sm"
            variant="ghost"
            loading={busy}
            icon={isPaused ? <Play size={14} /> : <Pause size={14} />}
            onClick={() => (isPaused ? resumeAgent(agent.id) : pauseAgent(agent.id))}
          >
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Link href={`/agents/${agent.id}`} className="ml-auto">
            <Button size="sm" variant="secondary" icon={<ArrowRight size={14} />}>
              Details
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
