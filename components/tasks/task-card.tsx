"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Pause,
  Play,
  ShieldAlert,
  Square,
  Trash2,
} from "lucide-react";
import type { ClientTask } from "@/lib/types";
import { useTaskStore } from "@/stores/use-task-store";
import { useAgentStore } from "@/stores/use-agent-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Modal } from "@/components/ui/modal";
import { timeAgo, formatDateTime } from "@/components/agents/agent-meta";

const PERCENT = (t: ClientTask) => Math.round((t.progress / Math.max(1, t.total)) * 100);

export function TaskCard({ task, index = 0 }: { task: ClientTask; index?: number }) {
  const startTask = useTaskStore((s) => s.startTask);
  const pauseTask = useTaskStore((s) => s.pauseTask);
  const resumeTask = useTaskStore((s) => s.resumeTask);
  const stopTask = useTaskStore((s) => s.stopTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const confirmVerification = useTaskStore((s) => s.confirmVerification);
  const resumeAfterVerification = useTaskStore((s) => s.resumeAfterVerification);
  const isInFlight = useTaskStore((s) => s.isInFlight);
  const agentName = useAgentStore(
    (s) => s.agents.find((a) => a.id === task.agentId)?.name ?? task.agentId
  );

  const [detailsOpen, setDetailsOpen] = useState(false);
  const key = `task:${task.id}`;

  const pct = PERCENT(task);
  const waiting = task.status === "WAITING_FOR_USER";
  const verified = task.verification?.confirmed === true;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.25 }}
      >
        <Card hover className="flex h-full flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={() => setDetailsOpen(true)}
              className="min-w-0 flex-1 text-left"
              title="View details"
            >
              <h3 className="truncate text-sm font-semibold text-slate-900 hover:text-cx-purpleDark">
                {task.title}
              </h3>
            </button>
            <StatusBadge status={task.status} attempt={task.attempt} />
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {agentName} · created {timeAgo(task.createdAt)}
          </p>

          <div className="mt-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] tabular-nums text-slate-500">
                {Math.round(task.progress)}/{task.total}
              </span>
              <span className="text-[11px] tabular-nums text-slate-500">{pct}%</span>
            </div>
            <ProgressBar value={pct} className="mt-1" />
          </div>

          {task.error && task.status === "FAILED" && (
            <p className="mt-2 truncate text-[11px] text-red-600" title={task.error}>
              {task.error}
            </p>
          )}

          {waiting && (
            <div className="mt-3 rounded-xl border border-orange-200/70 bg-orange-50/50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-800">
                <ShieldAlert size={14} /> Manual verification required
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {task.verification?.reason === "captcha"
                  ? "This task paused — the platform needs human verification."
                  : task.detail ?? "This task paused — human verification needed."}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {!verified ? (
                  <Button
                    size="sm"
                    variant="primary-orange"
                    onClick={() => confirmVerification(task.id)}
                  >
                    I&apos;ve completed verification
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary-orange"
                    loading={isInFlight(`${key}:resume-verify`)}
                    icon={<CheckCircle2 size={14} />}
                    onClick={() => resumeAfterVerification(task.id)}
                  >
                    Verification completed — resume
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
            {(task.status === "READY" || task.status === "CANCELLED") && (
              <Button
                size="sm"
                variant="secondary"
                loading={isInFlight(`${key}:start`)}
                icon={<Play size={14} />}
                onClick={() => startTask(task.id)}
              >
                Start
              </Button>
            )}
            {task.status === "PAUSED" && (
              <Button
                size="sm"
                variant="secondary"
                loading={isInFlight(`${key}:resume`)}
                icon={<Play size={14} />}
                onClick={() => resumeTask(task.id)}
              >
                Resume
              </Button>
            )}
            {(task.status === "RUNNING" || task.status === "RETRYING") && (
              <Button
                size="sm"
                variant="ghost"
                loading={isInFlight(`${key}:pause`)}
                icon={<Pause size={14} />}
                onClick={() => pauseTask(task.id)}
              >
                Pause
              </Button>
            )}
            {["READY", "RUNNING", "PAUSED", "RETRYING", "WAITING_FOR_USER"].includes(task.status) && (
              <Button
                size="sm"
                variant="ghost"
                loading={isInFlight(`${key}:stop`)}
                icon={<Square size={14} />}
                onClick={() => stopTask(task.id)}
              >
                Stop
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-red-600 hover:bg-red-50"
              loading={isInFlight(`${key}:delete`)}
              icon={<Trash2 size={14} />}
              onClick={() => deleteTask(task.id)}
            >
              Delete
            </Button>
          </div>
        </Card>
      </motion.div>

      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Task details">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">{task.title}</h3>
            <StatusBadge status={task.status} attempt={task.attempt} />
          </div>
          {task.detail && <p className="text-sm text-slate-600">{task.detail}</p>}
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            <p>
              <span className="font-medium text-slate-700">Agent:</span> {agentName}
            </p>
            <p className="mt-1">
              <span className="font-medium text-slate-700">Progress:</span> {Math.round(task.progress)}/
              {task.total} ({pct}%)
            </p>
            <p className="mt-1">
              <span className="font-medium text-slate-700">Created:</span> {formatDateTime(task.createdAt)}
            </p>
            {task.completedAt && (
              <p className="mt-1">
                <span className="font-medium text-slate-700">Completed:</span>{" "}
                {formatDateTime(task.completedAt)}
              </p>
            )}
          </div>
          {task.error && (
            <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{task.error}</p>
          )}
          <ProgressBar value={pct} />
        </div>
      </Modal>
    </>
  );
}
