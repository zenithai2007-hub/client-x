"use client";

import { useMemo, useState } from "react";
import { ListTodo, Plus } from "lucide-react";
import type { ExecutionStatus } from "@/lib/types";
import { useTaskStore } from "@/stores/use-task-store";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskCard } from "@/components/tasks/task-card";
import { NewTaskModal } from "@/components/tasks/new-task-modal";

const FILTERS: { key: string; label: string; status?: ExecutionStatus }[] = [
  { key: "all", label: "All" },
  { key: "READY", label: "Created", status: "READY" },
  { key: "RUNNING", label: "Running", status: "RUNNING" },
  { key: "PAUSED", label: "Waiting", status: "PAUSED" },
  { key: "WAITING_FOR_USER", label: "Waiting for User", status: "WAITING_FOR_USER" },
  { key: "RETRYING", label: "Retrying", status: "RETRYING" },
  { key: "COMPLETED", label: "Completed", status: "COMPLETED" },
  { key: "FAILED", label: "Failed", status: "FAILED" },
  { key: "CANCELLED", label: "Cancelled", status: "CANCELLED" },
];

export default function TasksPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  const tabs = useMemo(
    () =>
      FILTERS.map((f) => ({
        key: f.key,
        label: f.label,
        count: f.status ? tasks.filter((t) => t.status === f.status).length : tasks.length,
      })),
    [tasks]
  );

  const visible = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tasks</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {tasks.length} tasks · {tasks.filter((t) => t.status === "RUNNING").length} running
          </p>
        </div>
        <Button
          variant="primary-orange"
          icon={<Plus size={16} />}
          onClick={() => setModalOpen(true)}
        >
          New Task
        </Button>
      </div>

      <Tabs tabs={tabs} active={filter} onChange={setFilter} className="max-w-full overflow-x-auto" />

      {visible.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={filter === "all" ? "No tasks yet" : `No ${tabs.find((t) => t.key === filter)?.label.toLowerCase()} tasks`}
          description={
            filter === "all"
              ? "Create a task and assign it to an agent to get started."
              : "Tasks in this state will appear here."
          }
          action={
            filter === "all" ? (
              <Button variant="primary-orange" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
                New Task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((task, i) => (
            <TaskCard key={task.id} task={task} index={i} />
          ))}
        </div>
      )}

      <NewTaskModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
