"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bot,
  ChevronRight,
  History as HistoryIcon,
  Info,
  Keyboard,
  ListTodo,
  Megaphone,
  Plug,
  Search,
  Stamp,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { timeAgo } from "@/components/activity/format-time";
import type {
  ActivityCategory,
  Approval,
  ClientTask,
  ExecutionStatus,
} from "@/lib/types";
import { useActivityStore } from "@/stores/use-activity-store";
import { useAgentStore } from "@/stores/use-agent-store";
import { useTaskStore } from "@/stores/use-task-store";
import { cn } from "@/lib/cn";

type HistoryRow = {
  id: string;
  kind: "activity" | "approval" | "task";
  time: string;
  title: string;
  sub: string;
  status?: ExecutionStatus;
  agentId?: string;
  route: string;
  icon: LucideIcon;
  chip: string;
};

const ACTIVITY_ROUTE: Record<ActivityCategory, string> = {
  agents: "/agents",
  outreach: "/outreach",
  keyboard: "/keyboard",
  tasks: "/tasks",
  platforms: "/platforms",
  system: "/activity",
};

const ACTIVITY_ICON: Record<ActivityCategory, LucideIcon> = {
  agents: Bot,
  outreach: Megaphone,
  keyboard: Keyboard,
  tasks: ListTodo,
  platforms: Plug,
  system: Info,
};

const APPROVAL_STATUS: Record<Approval["status"], ExecutionStatus> = {
  pending: "WAITING_FOR_USER",
  approved: "COMPLETED",
  cancelled: "CANCELLED",
};

const STATUSES: ExecutionStatus[] = [
  "READY",
  "RUNNING",
  "PAUSED",
  "WAITING_FOR_USER",
  "RETRYING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
];

/** Unified history: activity events + approvals + tasks. Rows link to their source page. */
export default function HistoryPage() {
  const router = useRouter();
  const events = useActivityStore((s) => s.events);
  const approvals = useAgentStore((s) => s.approvals);
  const tasks = useTaskStore((s) => s.tasks);
  const agents = useAgentStore((s) => s.agents);

  const [query, setQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ExecutionStatus>("all");

  const agentName = (id?: string) => agents.find((a) => a.id === id)?.name ?? id ?? "—";

  const rows: HistoryRow[] = useMemo(() => {
    const out: HistoryRow[] = [];

    for (const e of events) {
      out.push({
        id: `evt-${e.id}`,
        kind: "activity",
        time: e.time,
        title: e.text,
        sub: `Activity · ${e.category}`,
        route: ACTIVITY_ROUTE[e.category],
        icon: ACTIVITY_ICON[e.category],
        chip: "bg-slate-100 text-slate-600",
      });
    }
    for (const a of approvals) {
      out.push({
        id: `appr-${a.id}`,
        kind: "approval",
        time: a.createdAt,
        title: `${agentName(a.agentId)}: ${a.action} → ${a.target}`,
        sub: `Approval · ${a.message.slice(0, 80)}${a.message.length > 80 ? "…" : ""}`,
        status: APPROVAL_STATUS[a.status],
        agentId: a.agentId,
        route: "/agents",
        icon: Stamp,
        chip: "bg-cx-purpleLight text-cx-purpleDark",
      });
    }
    for (const t of tasks) {
      out.push({
        id: `task-${t.id}`,
        kind: "task",
        time: t.createdAt,
        title: t.title,
        sub: `Task · ${agentName(t.agentId)}${t.detail ? ` · ${t.detail.slice(0, 60)}` : ""}`,
        status: t.status,
        agentId: t.agentId,
        route: "/tasks",
        icon: ListTodo,
        chip: "bg-emerald-50 text-emerald-700",
      });
    }
    out.sort((x, y) => +new Date(y.time) - +new Date(x.time));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, approvals, tasks, agents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !`${r.title} ${r.sub}`.toLowerCase().includes(q)) return false;
      if (agentFilter !== "all" && r.agentId !== agentFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, query, agentFilter, statusFilter]);

  const selectCls =
    "h-10 rounded-xl  bg-cx-surface px-3 text-sm text-slate-700 shadow-sm focus:border-cx-purple focus:outline-none";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">History</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every event, approval and task in one searchable timeline. Select a row to open its source.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search history…"
            className="pl-10"
          />
        </div>
        <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className={selectCls} aria-label="Filter by agent">
          <option value="all">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | ExecutionStatus)}
          className={selectCls}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No matching history"
          description={
            rows.length === 0
              ? "Nothing has happened yet — history builds as you use Client X."
              : "Try a different search term or loosen the filters."
          }
        />
      ) : (
        <Card className="p-2 sm:p-3">
          <ol className="flex flex-col">
            {filtered.map((r, i) => {
              const Icon = r.icon;
              return (
                <motion.li
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.3) }}
                >
                  <button
                    onClick={() => router.push(r.route)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-cx-bg shadow-cx-inset-sm/80"
                  >
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", r.chip)}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">{r.title}</span>
                      <span className="block truncate text-xs text-slate-500">{r.sub}</span>
                    </span>
                    {r.status && <StatusBadge status={r.status} />}
                    <span className="hidden shrink-0 text-[11px] text-slate-400 sm:block">
                      {timeAgo(r.time)}
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-slate-300" />
                  </button>
                </motion.li>
              );
            })}
          </ol>
        </Card>
      )}
    </div>
  );
}
