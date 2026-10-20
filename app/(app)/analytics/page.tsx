"use client";

import { useMemo } from "react";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Stamp,
  Target,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/analytics/stat-card";
import { BarChart } from "@/components/analytics/bar-chart";
import type { ActivityCategory, ExecutionStatus } from "@/lib/types";
import { useActivityStore } from "@/stores/use-activity-store";
import { useAgentStore } from "@/stores/use-agent-store";
import { useChatStore } from "@/stores/use-chat-store";
import { useKeyboardStore } from "@/stores/use-keyboard-store";
import { useOutreachStore } from "@/stores/use-outreach-store";
import { useTaskStore } from "@/stores/use-task-store";

const CATEGORIES: ActivityCategory[] = ["agents", "outreach", "keyboard", "tasks", "platforms", "system"];
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

const STATUS_LABEL: Record<ExecutionStatus, string> = {
  READY: "ready",
  RUNNING: "running",
  PAUSED: "paused",
  WAITING_FOR_USER: "needs you",
  RETRYING: "retrying",
  COMPLETED: "done",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

/**
 * Analytics: every number is computed live from the stores.
 * Empty stores render "No activity yet." — numbers are never invented.
 */
export default function AnalyticsPage() {
  const events = useActivityStore((s) => s.events);
  const agents = useAgentStore((s) => s.agents);
  const approvals = useAgentStore((s) => s.approvals);
  const tasks = useTaskStore((s) => s.tasks);
  const campaigns = useOutreachStore((s) => s.campaigns);
  const messagesByConvo = useChatStore((s) => s.messagesByConvo);
  const generations = useKeyboardStore((s) => s.clipboardItems);

  const stats = useMemo(() => {
    const messagesSent = Object.values(messagesByConvo)
      .flat()
      .filter((m) => m.sender === "me" && !m.typing).length;
    const aiGenerations =
      events.filter((e) => e.category === "keyboard").length + generations.length;
    const approved = approvals.filter((a) => a.status === "approved").length;
    const cancelled = approvals.filter((a) => a.status === "cancelled").length;
    const tasksCompleted = tasks.filter((t) => t.status === "COMPLETED").length;
    const targetsCompleted = campaigns
      .flatMap((c) => c.targets)
      .filter((t) => t.status === "COMPLETED").length;
    const activeAgents = agents.filter((a) => a.status === "active").length;
    const allTargets = campaigns.flatMap((c) => c.targets);
    const outreachSent = allTargets.filter((t) => t.sentAt).length;
    const responses = Object.values(messagesByConvo)
      .flat()
      .filter((m) => m.sender === "them" && !m.typing).length;
    const conversionRate =
      outreachSent > 0 ? Math.round((targetsCompleted / outreachSent) * 100) : 0;
    const opportunitiesFound = allTargets.length;
    return { messagesSent, aiGenerations, approved, cancelled, tasksCompleted, targetsCompleted, activeAgents, outreachSent, responses, conversionRate, opportunitiesFound };
  }, [messagesByConvo, events, generations, approvals, tasks, campaigns, agents]);

  const platformPerformance = useMemo(() => {
    const byPlatform = new Map<string, number>();
    for (const c of campaigns) {
      const done = c.targets.filter((t) => t.status === "COMPLETED").length;
      byPlatform.set(c.platform, (byPlatform.get(c.platform) ?? 0) + done);
    }
    return Array.from(byPlatform.entries()).map(([label, value]) => ({ label, value }));
  }, [campaigns]);

  const activityByCategory = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return CATEGORIES.map((c) => ({
      label: c,
      value: events.filter((e) => e.category === c && +new Date(e.time) >= weekAgo).length,
    }));
  }, [events]);

  const tasksByStatus = useMemo(
    () =>
      STATUSES.map((s) => ({
        label: STATUS_LABEL[s],
        value: tasks.filter((t) => t.status === s).length,
      })),
    [tasks]
  );

  const hasAnyData =
    events.length > 0 || tasks.length > 0 || approvals.length > 0 || campaigns.length > 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live numbers from your workspace — computed from real store data, never estimated.
        </p>
      </div>

      {!hasAnyData ? (
        <EmptyState
          icon={BarChart3}
          title="No activity yet"
          description="Stats, charts and trends will appear here as you chat, run agents, do outreach and complete tasks."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <StatCard
              index={0}
              icon={MessageSquare}
              label="Messages sent"
              value={stats.messagesSent}
              accent="bg-blue-50 text-blue-700"
            />
            <StatCard
              index={1}
              icon={Sparkles}
              label="AI generations"
              value={stats.aiGenerations}
              sub="keyboard activity + copies"
              accent="bg-cx-purpleLight text-cx-purpleDark"
            />
            <StatCard
              index={2}
              icon={Stamp}
              label="Approvals approved"
              value={stats.approved}
              sub={`${stats.cancelled} cancelled`}
              accent="bg-emerald-50 text-emerald-700"
            />
            <StatCard
              index={3}
              icon={CheckCircle2}
              label="Tasks completed"
              value={stats.tasksCompleted}
              sub={`${tasks.length} total`}
              accent="bg-emerald-50 text-emerald-700"
            />
            <StatCard
              index={4}
              icon={Target}
              label="Outreach targets done"
              value={stats.targetsCompleted}
              sub={`${campaigns.length} campaigns`}
              accent="bg-cx-orangeLight text-cx-orangeDark"
            />
            <StatCard
              index={5}
              icon={Bot}
              label="Active agents"
              value={stats.activeAgents}
              sub={`${agents.length} total`}
              accent="bg-cx-purpleLight text-cx-purpleDark"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              index={6}
              icon={Target}
              label="Outreach sent"
              value={stats.outreachSent}
              sub="messages actually sent"
              accent="bg-cx-orangeLight text-cx-orangeDark"
            />
            <StatCard
              index={7}
              icon={MessageSquare}
              label="Responses"
              value={stats.responses}
              sub="incoming messages"
              accent="bg-blue-50 text-blue-700"
            />
            <StatCard
              index={8}
              icon={CheckCircle2}
              label="Conversion rate"
              value={`${stats.conversionRate}%`}
              sub="completed / sent"
              accent="bg-emerald-50 text-emerald-700"
            />
            <StatCard
              index={9}
              icon={Sparkles}
              label="Opportunities found"
              value={stats.opportunitiesFound}
              sub="discovered targets"
              accent="bg-cx-purpleLight text-cx-purpleDark"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <BarChart
              title="Activity by category"
              subtitle="Events logged in the last 7 days"
              data={activityByCategory}
              barClass="bg-cx-purple/80"
            />
            <BarChart
              title="Tasks by status"
              subtitle="Current task distribution across the 8 canonical states"
              data={tasksByStatus}
              barClass="bg-cx-orange/80"
            />
          </div>

          {platformPerformance.length > 0 && (
            <BarChart
              title="Platform performance"
              subtitle="Completed outreach targets per platform"
              data={platformPerformance}
              barClass="bg-cx-purple/80"
            />
          )}
        </>
      )}
    </div>
  );
}
