"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Pencil, Plus, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, FieldLabel } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toggle } from "@/components/ui/toggle";
import { selectCls } from "@/components/settings/settings-section";
import { useLocalStorage } from "@/components/settings/use-local-storage";
import { uid } from "@/lib/services/base";
import { useAgentStore } from "@/stores/use-agent-store";
import { useTaskStore } from "@/stores/use-task-store";
import { useActivityStore } from "@/stores/use-activity-store";
import { useNotificationStore } from "@/stores/use-notification-store";

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  triggerLabel: string;
  agentId: string;
  action: string;
  actionLabel: string;
  enabled: boolean;
}

const TRIGGERS = [
  { value: "new-linkedin-lead", label: "New LinkedIn lead found" },
  { value: "approval-requested", label: "Approval requested" },
  { value: "task-completed", label: "Task completed" },
  { value: "new-reply", label: "New chat reply received" },
  { value: "campaign-finished", label: "Outreach campaign finished" },
];

const ACTIONS = [
  { value: "draft-intro", label: "Draft a personalized intro message" },
  { value: "create-followup-task", label: "Create a follow-up task" },
  { value: "send-notification", label: "Send me a notification" },
  { value: "log-summary", label: "Log an activity summary" },
];

const labelOf = (list: { value: string; label: string }[], v: string) =>
  list.find((x) => x.value === v)?.label ?? v;

/** Automations: trigger → action rules. Enabling a rule spins up a real linked task. */
export default function AutomationsPage() {
  const agents = useAgentStore((s) => s.agents);
  const createTask = useTaskStore((s) => s.createTask);
  const startTask = useTaskStore((s) => s.startTask);
  const taskBusy = useTaskStore((s) => s.isInFlight("task:create"));
  const logEvent = useActivityStore((s) => s.logEvent);
  const push = useNotificationStore((s) => s.push);

  // null = never touched; seed defaults are shown until the user makes a change.
  const [rules, setRules] = useLocalStorage<AutomationRule[] | null>("cx-automations", null);

  const effectiveRules = useMemo<AutomationRule[]>(() => {
    if (rules) return rules;
    const agentId = agents[0]?.id ?? "";
    return [
      {
        id: "rule-1",
        name: "LinkedIn lead → draft intro",
        trigger: "new-linkedin-lead",
        triggerLabel: "New LinkedIn lead found",
        agentId,
        action: "draft-intro",
        actionLabel: "Draft a personalized intro message",
        enabled: false,
      },
      {
        id: "rule-2",
        name: "Approval requested → notify me",
        trigger: "approval-requested",
        triggerLabel: "Approval requested",
        agentId,
        action: "send-notification",
        actionLabel: "Send me a notification",
        enabled: false,
      },
      {
        id: "rule-3",
        name: "Task completed → log summary",
        trigger: "task-completed",
        triggerLabel: "Task completed",
        agentId,
        action: "log-summary",
        actionLabel: "Log an activity summary",
        enabled: false,
      },
    ];
  }, [rules, agents]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AutomationRule | null>(null);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState(TRIGGERS[0].value);
  const [agentId, setAgentId] = useState("");
  const [action, setAction] = useState(ACTIONS[0].value);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AutomationRule | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const persist = (next: AutomationRule[]) => setRules(next);

  const openNew = () => {
    setEditing(null);
    setName("");
    setTrigger(TRIGGERS[0].value);
    setAgentId(agents[0]?.id ?? "");
    setAction(ACTIONS[0].value);
    setModalOpen(true);
  };

  const openEdit = (r: AutomationRule) => {
    setEditing(r);
    setName(r.name);
    setTrigger(r.trigger);
    setAgentId(r.agentId);
    setAction(r.action);
    setModalOpen(true);
  };

  const save = () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    const rule: AutomationRule = {
      id: editing?.id ?? uid("rule"),
      name: name.trim(),
      trigger,
      triggerLabel: labelOf(TRIGGERS, trigger),
      agentId,
      action,
      actionLabel: labelOf(ACTIONS, action),
      enabled: editing?.enabled ?? false,
    };
    persist(editing ? effectiveRules.map((r) => (r.id === editing.id ? rule : r)) : [rule, ...effectiveRules]);
    void logEvent("system", `Automation ${editing ? "updated" : "created"}: "${rule.name}".`);
    setSaving(false);
    setModalOpen(false);
  };

  const toggleEnabled = async (r: AutomationRule) => {
    if (toggling) return;
    const next = !r.enabled;
    persist(effectiveRules.map((x) => (x.id === r.id ? { ...x, enabled: next } : x)));
    if (next) {
      setToggling(r.id);
      try {
        const task = await createTask(
          `Automation: ${r.name}`,
          r.agentId,
          `${r.triggerLabel} → ${r.actionLabel}`
        );
        await startTask(task.id);
        void push("Automation enabled", `"${r.name}" is now running as a task.`, "success");
        void logEvent("system", `Automation "${r.name}" enabled — linked task started.`);
      } catch {
        // createTask guards concurrent creation; roll the toggle back
        persist(effectiveRules.map((x) => (x.id === r.id ? { ...x, enabled: false } : x)));
      } finally {
        setToggling(null);
      }
    } else {
      void logEvent("system", `Automation "${r.name}" disabled.`);
    }
  };

  const deleteRule = (r: AutomationRule) => {
    persist(effectiveRules.filter((x) => x.id !== r.id));
    void logEvent("system", `Automation deleted: "${r.name}".`);
    setConfirmDelete(null);
  };

  const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? "Any agent";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Automations</h1>
          <p className="mt-1 text-sm text-slate-500">
            When something happens, Client X acts. Enabling a rule starts a real task you can watch
            in{" "}
            <Link href="/tasks" className="font-medium text-cx-purpleDark hover:underline">
              Tasks
            </Link>
            .
          </p>
        </div>
        <Button variant="primary-orange" icon={<Plus size={16} />} onClick={openNew}>
          New Automation
        </Button>
      </div>

      {effectiveRules.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No automations yet"
          description="Create your first rule — for example: when a new LinkedIn lead arrives, draft a personalized intro."
          action={
            <Button variant="primary-orange" icon={<Plus size={16} />} onClick={openNew}>
              New Automation
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {effectiveRules.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <Card className="p-4 sm:p-5" hover>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={
                        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " +
                        (r.enabled ? "bg-cx-purpleLight text-cx-purpleDark" : "bg-slate-100 text-slate-400")
                      }
                    >
                      <Zap size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                          {r.triggerLabel}
                        </span>
                        <ArrowRight size={12} className="text-slate-400" />
                        <span className="rounded-md bg-cx-purpleLight/60 px-1.5 py-0.5 font-medium text-cx-purpleDark">
                          {r.actionLabel}
                        </span>
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">Agent: {agentName(r.agentId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(r)}
                      aria-label={`Edit ${r.name}`}
                      className="rounded-lg p-2 text-slate-400 hover:bg-white/60 hover:text-slate-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(r)}
                      aria-label={`Delete ${r.name}`}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                    <Toggle
                      checked={r.enabled}
                      disabled={toggling === r.id || taskBusy}
                      onChange={() => void toggleEnabled(r)}
                      label={r.enabled ? "On" : "Off"}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* New / Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit automation" : "New automation"}>
        <FieldLabel>Rule name</FieldLabel>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. New LinkedIn lead → draft intro"
          className="mb-3"
          autoFocus
        />
        <FieldLabel>When this happens (trigger)</FieldLabel>
        <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className={`${selectCls} mb-3 w-full`}>
          {TRIGGERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <FieldLabel>Run as agent</FieldLabel>
        <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className={`${selectCls} mb-3 w-full`}>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <FieldLabel>Do this (action)</FieldLabel>
        <select value={action} onChange={(e) => setAction(e.target.value)} className={`${selectCls} mb-4 w-full`}>
          {ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary-orange" loading={saving} disabled={!name.trim()} onClick={save}>
            {editing ? "Save changes" : "Create automation"}
          </Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete automation?">
        <p className="mb-4 text-sm text-slate-600">
          Delete <span className="font-semibold text-slate-900">“{confirmDelete?.name}”</span>? Tasks
          it already started are kept.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => confirmDelete && deleteRule(confirmDelete)}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
