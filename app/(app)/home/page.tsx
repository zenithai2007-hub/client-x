"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot, MessageSquare, Megaphone, ListTodo, Plus, Pause, Play, CheckCircle2, ShieldAlert,
} from "lucide-react";
import { useAgentStore } from "@/stores/use-agent-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { useActivityStore } from "@/stores/use-activity-store";
import { useTaskStore } from "@/stores/use-task-store";
import { useChatStore } from "@/stores/use-chat-store";
import { useOutreachStore } from "@/stores/use-outreach-store";
import { useUIStore } from "@/stores/use-ui-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, FieldLabel } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { VerificationCard } from "@/components/ui/verification-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const AGENT_TONE: Record<string, "green" | "blue" | "amber" | "slate" | "purple" | "orange"> = {
  active: "green",
  ready: "blue",
  paused: "amber",
  offline: "slate",
  waiting: "purple",
  needs_approval: "orange",
};

export default function HomePage() {
  const router = useRouter();
  const { agents, pauseAgent, resumeAgent, isInFlight, pendingApprovals } = useAgentStore();
  const { events } = useActivityStore();
  const {
    tasks, createTask, startTask, flagVerificationNeeded, confirmVerification,
    resumeAfterVerification, pauseTask, stopTask,
  } = useTaskStore();
  const newChat = useChatStore((s) => s.newChat);
  const authUser = useAuthStore((s) => s.user);
  const firstName = authUser?.name.split(" ")[0] ?? "there";
  const { campaigns } = useOutreachStore();
  const { setActiveNav } = useUIStore();
  const [taskModal, setTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const today = new Date().toDateString();
  const todaysEvents = events.filter((e) => new Date(e.time).toDateString() === today);
  const byCat = (cat: string) => todaysEvents.filter((e) => e.category === cat).length;
  const pending = pendingApprovals();
  const attentionTasks = tasks.filter((t) => t.status === "WAITING_FOR_USER");
  const runningTasks = tasks.filter((t) => t.status === "RUNNING");
  const activeCampaigns = campaigns.filter((c) => c.status === "RUNNING");

  const handleCreateTask = async () => {
    const title = taskTitle.trim();
    if (!title || creating) return;
    setCreating(true);
    try {
      const task = await createTask(title, agents[0]?.id ?? "ag-linkedin");
      await startTask(task.id);
      setTaskTitle("");
      setTaskModal(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{greeting()}, {firstName}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {runningTasks.length} task{runningTasks.length === 1 ? "" : "s"} running ·{" "}
          {pending.length} approval{pending.length === 1 ? "" : "s"} pending ·{" "}
          {attentionTasks.length} need{attentionTasks.length === 1 ? "s" : ""} your attention
        </p>
      </div>

      {/* Needs attention — §26 verification cards */}
      {attentionTasks.map((t) => (
        <VerificationCard
          key={t.id}
          phase={t.verification?.confirmed ? "confirmed" : "pending"}
          contextTitle={t.title}
          onOpenPlatform={() => window.open("https://www.google.com", "_blank", "noopener")}
          onConfirm={() => confirmVerification(t.id)}
          onPause={() => pauseTask(t.id)}
          onCancel={() => stopTask(t.id)}
          onResume={() => resumeAfterVerification(t.id)}
        />
      ))}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <Card hover className="p-4">
          <button
            className="flex w-full flex-col items-start gap-2 text-left"
            onClick={() => { newChat("New conversation"); setActiveNav("chat"); router.push("/chats"); }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cx-purpleLight text-cx-purpleDark"><MessageSquare size={17} /></span>
            <span className="text-sm font-semibold text-slate-800">New chat</span>
            <span className="text-xs text-slate-400">Talk to a contact</span>
          </button>
        </Card>
        <Card hover className="p-4">
          <button
            className="flex w-full flex-col items-start gap-2 text-left"
            onClick={() => { setActiveNav("outreach"); router.push("/outreach"); }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cx-orangeLight text-cx-orangeDark"><Megaphone size={17} /></span>
            <span className="text-sm font-semibold text-slate-800">Start outreach</span>
            <span className="text-xs text-slate-400">Launch a campaign</span>
          </button>
        </Card>
        <Card hover className="p-4">
          <button className="flex w-full flex-col items-start gap-2 text-left" onClick={() => setTaskModal(true)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><ListTodo size={17} /></span>
            <span className="text-sm font-semibold text-slate-800">Create task</span>
            <span className="text-xs text-slate-400">Assign to an agent</span>
          </button>
        </Card>
      </div>

      {/* Agent status cards */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Agents</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-cx-purpleLight text-cx-purpleDark">
                  <Bot size={17} />
                  <span className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
                    a.status === "active" ? "bg-emerald-500" : "bg-slate-300"
                  )} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{a.name}</p>
                  <p className="text-[11px] capitalize text-slate-400">{a.platform}</p>
                </div>
                <Badge tone={AGENT_TONE[a.status]}>{a.status}</Badge>
              </div>
              {a.currentTask && (
                <p className="mt-2.5 truncate text-xs text-slate-500">{a.currentTask}</p>
              )}
              <div className="mt-3 flex gap-2">
                {a.status === "active" ? (
                  <Button size="sm" icon={<Pause size={13} />} onClick={() => pauseAgent(a.id)}
                    disabled={isInFlight(`agent:${a.id}:pause`)} loading={isInFlight(`agent:${a.id}:pause`)}>
                    Pause
                  </Button>
                ) : (
                  <Button size="sm" icon={<Play size={13} />} onClick={() => resumeAgent(a.id)}
                    disabled={isInFlight(`agent:${a.id}:resume`)} loading={isInFlight(`agent:${a.id}:resume`)}>
                    Resume
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { setActiveNav("agents"); router.push("/agents"); }}>
                  Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Activity summary + running work */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-700">Today&apos;s activity</h3>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Agents", n: byCat("agents") },
              { label: "Outreach", n: byCat("outreach") },
              { label: "Tasks", n: byCat("tasks") },
              { label: "System", n: byCat("system") },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-cx-bg shadow-cx-inset-sm px-2 py-3">
                <p className="text-xl font-bold text-slate-900">{s.n}</p>
                <p className="text-[11px] text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
          <ul className="mt-3 space-y-2">
            {events.slice(0, 4).map((e) => (
              <li key={e.id} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                <span className="flex-1">{e.text}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Running work</h3>
            <Button size="sm" variant="ghost" onClick={() => { setActiveNav("tasks"); router.push("/tasks"); }}>
              View all
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {runningTasks.length === 0 && activeCampaigns.length === 0 && (
              <p className="py-4 text-center text-xs text-slate-400">Nothing running right now.</p>
            )}
            {runningTasks.map((t) => (
              <div key={t.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-slate-700">{t.title}</p>
                  <StatusBadge status={t.status} attempt={t.attempt} />
                </div>
                <ProgressBar value={(t.progress / t.total) * 100} className="mt-1.5" />
              </div>
            ))}
            {activeCampaigns.map((c) => {
              const done = c.targets.filter((t) => t.status === "COMPLETED").length;
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-medium text-slate-700">{c.name}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <ProgressBar value={c.targets.length ? (done / c.targets.length) * 100 : 0} className="mt-1.5" />
                </div>
              );
            })}
            {attentionTasks.length > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-orange-600">
                <ShieldAlert size={13} /> {attentionTasks.length} task needs manual verification.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Create task modal */}
      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="Create task">
        <FieldLabel>Task title</FieldLabel>
        <Input
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="e.g. Research 20 SaaS founders"
          onKeyDown={(e) => { if (e.key === "Enter") handleCreateTask(); }}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setTaskModal(false)}>Cancel</Button>
          <Button variant="primary-orange" icon={<Plus size={15} />} onClick={handleCreateTask} loading={creating} disabled={!taskTitle.trim()}>
            Create & Start
          </Button>
        </div>
      </Modal>
    </div>
  );
}
