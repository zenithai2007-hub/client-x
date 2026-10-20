"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity as ActivityIcon,
  ArrowUpRight,
  Bot,
  Info,
  Keyboard,
  ListTodo,
  Megaphone,
  Plug,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { timeAgo } from "@/components/activity/format-time";
import type { ActivityCategory } from "@/lib/types";
import { useActivityStore } from "@/stores/use-activity-store";
import { cn } from "@/lib/cn";

const CATEGORY_META: Record<ActivityCategory, { icon: LucideIcon; chip: string }> = {
  agents: { icon: Bot, chip: "bg-cx-purpleLight text-cx-purpleDark" },
  outreach: { icon: Megaphone, chip: "bg-cx-orangeLight text-cx-orangeDark" },
  keyboard: { icon: Keyboard, chip: "bg-blue-50 text-blue-700" },
  tasks: { icon: ListTodo, chip: "bg-emerald-50 text-emerald-700" },
  platforms: { icon: Plug, chip: "bg-cyan-50 text-cyan-700" },
  system: { icon: Info, chip: "bg-slate-100 text-slate-600" },
};

type Filter = "all" | ActivityCategory;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "agents", label: "Agents" },
  { key: "outreach", label: "Outreach" },
  { key: "keyboard", label: "Keyboard" },
  { key: "tasks", label: "Tasks" },
  { key: "platforms", label: "Platforms" },
  { key: "system", label: "System" },
];

export default function ActivityPage() {
  const events = useActivityStore((s) => s.events);
  const clear = useActivityStore((s) => s.clear);
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmClear, setConfirmClear] = useState(false);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: events.length, agents: 0, outreach: 0, keyboard: 0, tasks: 0, platforms: 0, system: 0 };
    for (const e of events) c[e.category] += 1;
    return c;
  }, [events]);

  const filtered = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.category === filter)),
    [events, filter]
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Activity</h1>
          <p className="mt-1 text-sm text-slate-500">
            Everything happening across Client X, in real time.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/analytics">
            <Button variant="secondary" size="sm" icon={<ArrowUpRight size={15} />}>
              Analytics
            </Button>
          </Link>
          {events.length > 0 && (
            <Button variant="ghost" size="sm" icon={<Trash2 size={15} />} onClick={() => setConfirmClear(true)}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <Tabs
        tabs={FILTERS.map((f) => ({ key: f.key, label: f.label, count: counts[f.key] }))}
        active={filter}
        onChange={(k) => setFilter(k as Filter)}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title={filter === "all" ? "No activity yet" : `No ${filter} activity yet`}
          description={
            filter === "all"
              ? "Events from agents, outreach, the keyboard and tasks will appear here as they happen."
              : "Use Client X and new events in this category will stream in live."
          }
        />
      ) : (
        <Card className="p-2 sm:p-3">
          <ol className="relative">
            <AnimatePresence initial={false}>
              {filtered.map((e) => {
                const meta = CATEGORY_META[e.category];
                const Icon = meta.icon;
                return (
                  <motion.li
                    key={e.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-cx-bg shadow-cx-inset-sm/70"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        meta.chip
                      )}
                    >
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-800">{e.text}</p>
                      <p className="mt-0.5 text-[11px] capitalize text-slate-400">
                        {e.category} · {timeAgo(e.time)}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        </Card>
      )}

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="Clear activity?">
        <p className="mb-4 text-sm text-slate-600">
          This removes all {events.length} activity events. It does not affect tasks, approvals or
          memory.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              clear();
              setConfirmClear(false);
            }}
          >
            Clear activity
          </Button>
        </div>
      </Modal>
    </div>
  );
}
