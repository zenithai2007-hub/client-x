"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Pause,
  Play,
  Plus,
  Save,
  Square,
  Trash2,
  X,
} from "lucide-react";
import type { MemoryItem } from "@/lib/types";
import { useAgentStore } from "@/stores/use-agent-store";
import { useTaskStore } from "@/stores/use-task-store";
import { useMemoryStore } from "@/stores/use-memory-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Input, Textarea, FieldLabel } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskCard } from "@/components/tasks/task-card";
import { ShareButton } from "@/components/growth/share-menu";
import { PublishModal } from "@/components/growth/publish-modal";
import {
  agentExecStatus,
  platformIcon,
  platformLabel,
  permissionHint,
  PERMISSION_LABELS,
  timeAgo,
  formatDateTime,
} from "@/components/agents/agent-meta";

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {action}
        </div>
        {children}
      </Card>
    </motion.section>
  );
}

function MemoryRow({ item }: { item: MemoryItem }) {
  const updateItem = useMemoryStore((s) => s.updateItem);
  const deleteItem = useMemoryStore((s) => s.deleteItem);
  const isInFlight = useMemoryStore((s) => s.isInFlight);
  const [editing, setEditing] = useState(false);
  const [key, setKey] = useState(item.key);
  const [value, setValue] = useState(item.value);
  const busy = isInFlight(`memory:${item.id}:update`);

  if (editing) {
    return (
      <div className="rounded-xl border border-cx-purple/30 bg-cx-purpleLight/30 p-3">
        <Input value={key} onChange={(e) => setKey(e.target.value)} className="mb-2" />
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={2} />
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="primary-orange"
            loading={busy}
            icon={<Save size={14} />}
            onClick={async () => {
              await updateItem(item.id, { key, value });
              setEditing(false);
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" icon={<X size={14} />} onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start justify-between gap-3 rounded-xl border border-white/50 bg-cx-bg shadow-cx-inset-sm/60 p-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800">{item.key}</p>
        <p className="mt-0.5 text-xs text-slate-500">{item.value}</p>
        <p className="mt-1 text-[10px] text-slate-400">Updated {timeAgo(item.updatedAt)}</p>
      </div>
      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600 hover:bg-red-50"
          onClick={() => deleteItem(item.id)}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

export default function AgentDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const agent = useAgentStore((s) => s.agents.find((a) => a.id === id));
  const pauseAgent = useAgentStore((s) => s.pauseAgent);
  const resumeAgent = useAgentStore((s) => s.resumeAgent);
  const stopAgent = useAgentStore((s) => s.stopAgent);
  const updateInstructions = useAgentStore((s) => s.updateInstructions);
  const togglePermission = useAgentStore((s) => s.togglePermission);
  const agentBusy = useAgentStore((s) => s.isInFlight);

  const tasks = useTaskStore((s) => s.tasks);

  const memoryItems = useMemoryStore((s) => s.items);
  const addItem = useMemoryStore((s) => s.addItem);
  const memoryBusy = useMemoryStore((s) => s.isInFlight);

  const [draft, setDraft] = useState("");
  const [savedTick, setSavedTick] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  useEffect(() => {
    if (agent) setDraft(agent.instructions);
  }, [agent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const agentTasks = useMemo(() => tasks.filter((t) => t.agentId === id), [tasks, id]);
  const agentMemory = useMemo(
    () => memoryItems.filter((i) => i.section === "agent"),
    [memoryItems]
  );

  if (!agent) {
    return (
      <div className="mx-auto max-w-4xl">
        <EmptyState
          title="Agent not found"
          description="This agent does not exist."
          action={
            <Link href="/agents">
              <Button variant="secondary">Back to agents</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const Icon = platformIcon[agent.platform];
  const isPaused = agent.status === "paused";
  const savingInstructions = agentBusy(`agent:${agent.id}:instructions`);

  const handleSaveInstructions = async () => {
    await updateInstructions(agent.id, draft);
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 2000);
  };

  const handleClearActivity = () => {
    /* Store gap (reported): no clearAgentActivity action exists.
       Workaround: clear the array via setState — no mutation of nested state. */
    useAgentStore.setState((s) => ({
      agents: s.agents.map((a) => (a.id === agent.id ? { ...a, activity: [] } : a)),
    }));
  };

  const handleStop = async () => {
    await stopAgent(agent.id);
  };

  const handleAddMemory = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    await addItem("agent", newKey.trim(), newValue.trim());
    setNewKey("");
    setNewValue("");
    setAdding(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Back to agents
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar
              name={agent.name}
              color="#7C3AED"
              size="lg"
              online={agent.status === "active"}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">{agent.name}</h1>
                <StatusBadge status={agentExecStatus(agent.status)} />
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <Icon size={14} /> {platformLabel[agent.platform]}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                loading={agentBusy(`agent:${agent.id}:pause`) || agentBusy(`agent:${agent.id}:resume`)}
                icon={isPaused ? <Play size={14} /> : <Pause size={14} />}
                onClick={() => (isPaused ? resumeAgent(agent.id) : pauseAgent(agent.id))}
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={agentBusy(`agent:${agent.id}:stop`)}
                icon={<Square size={14} />}
                onClick={handleStop}
              >
                Stop
              </Button>
              <ShareButton
                kind="agent"
                title={agent.name}
                extra={platformLabel[agent.platform]}
                sharePath={`/share/agent/${agent.id}`}
              />
              <Button size="sm" variant="secondary" onClick={() => setPublishOpen(true)}>
                Publish
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Current task */}
      <Section title="Current Task">
        {agent.currentTask ? (
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-800">{agent.currentTask}</p>
              <span className="text-xs tabular-nums text-slate-500">
                {Math.round(agent.progress ?? 0)}%
              </span>
            </div>
            <ProgressBar value={agent.progress ?? 0} className="mt-2" />
          </div>
        ) : (
          <p className="text-sm text-slate-400">No active task right now.</p>
        )}
      </Section>

      {/* Instructions */}
      <Section
        title="Instructions"
        action={
          <Button
            size="sm"
            variant="primary-orange"
            loading={savingInstructions}
            icon={savedTick ? <Check size={14} /> : <Save size={14} />}
            onClick={handleSaveInstructions}
          >
            {savedTick ? "Saved" : "Save"}
          </Button>
        }
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder="How this agent should behave…"
        />
      </Section>

      {/* Permissions */}
      <Section title="Permissions">
        <div className="divide-y divide-slate-100">
          {Object.keys(agent.permissions).map((key) => (
            <div key={key} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {PERMISSION_LABELS[key] ?? key}
                </p>
                <p className="text-xs text-slate-500">{permissionHint(key)}</p>
              </div>
              <Toggle
                checked={!!agent.permissions[key]}
                disabled={agentBusy(`agent:${agent.id}:perm:${key}`)}
                onChange={() => togglePermission(agent.id, key)}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Memory */}
      <Section
        title="Memory"
        action={
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus size={14} />}
            onClick={() => setAdding((v) => !v)}
          >
            Add
          </Button>
        }
      >
        <div className="space-y-2">
          {adding && (
            <div className="rounded-xl border border-cx-purple/30 bg-cx-purpleLight/30 p-3">
              <FieldLabel>Key</FieldLabel>
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. Daily cap"
                className="mb-2"
              />
              <FieldLabel>Value</FieldLabel>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g. Max 10 connection requests per day"
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary-orange"
                  loading={memoryBusy("memory:add")}
                  icon={<Check size={14} />}
                  onClick={handleAddMemory}
                >
                  Add memory
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {agentMemory.length === 0 && !adding ? (
            <p className="text-sm text-slate-400">No memory entries for this agent yet.</p>
          ) : (
            agentMemory.map((item) => <MemoryRow key={item.id} item={item} />)
          )}
        </div>
      </Section>

      {/* Activity */}
      <Section title="Activity">
        {agent.activity.length === 0 ? (
          <p className="text-sm text-slate-400">No activity recorded.</p>
        ) : (
          <ol className="relative space-y-3 border-l border-white/50 pl-4">
            {agent.activity.map((entry, i) => (
              <li key={`${entry.time}-${i}`} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-cx-purple shadow" />
                <p className="text-sm text-slate-700">{entry.text}</p>
                <p className="text-[11px] text-slate-400">
                  {timeAgo(entry.time)} · {formatDateTime(entry.time)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* Tasks */}
      <Section title={`Tasks (${agentTasks.length})`}>
        {agentTasks.length === 0 ? (
          <p className="text-sm text-slate-400">No tasks assigned to this agent.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {agentTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </Section>

      {/* Danger / settings */}
      <Section title="Danger Zone">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="danger"
            loading={agentBusy(`agent:${agent.id}:stop`)}
            icon={<Square size={14} />}
            onClick={handleStop}
          >
            Stop agent
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Trash2 size={14} />}
            onClick={handleClearActivity}
          >
            Clear activity
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Stopping an agent clears its current task. Clearing activity removes its local
          timeline (persisted approvals and global activity are kept).
        </p>
      </Section>
      <PublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        kind="agent"
        initialTitle={agent.name}
        initialDescription={`A ${platformLabel[agent.platform]} agent setup shared from my workspace.`}
        payload={{
          platform: agent.platform,
          instructions: agent.instructions,
          permissions: agent.permissions,
        }}
      />
    </div>
  );
}
