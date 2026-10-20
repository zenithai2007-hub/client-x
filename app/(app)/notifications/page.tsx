"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import type { AppNotification, NavKey } from "@/lib/types";
import { useNotificationStore } from "@/stores/use-notification-store";
import { useUIStore } from "@/stores/use-ui-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { timeAgo } from "@/components/agents/agent-meta";
import { cn } from "@/lib/cn";

/** Notification deep-links → sidebar nav key (keeps the topbar title in sync). */
const NAV_BY_HREF: Record<string, NavKey> = {
  "/home": "home",
  "/chats": "chat",
  "/discover": "discover",
  "/platforms": "platforms",
  "/agents": "agents",
  "/tasks": "tasks",
  "/outreach": "outreach",
  "/activity": "activity",
  "/history": "history",
  "/memory": "memory",
  "/keyboard": "keyboard",
  "/automations": "automations",
  "/analytics": "analytics",
  "/notifications": "notifications",
  "/referrals": "referrals",
  "/templates": "templates",
  "/settings": "settings",
};

const KIND_DOT: Record<string, string> = {
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-cx-orange",
  approval: "bg-cx-purple",
  agent: "bg-slate-500",
};

function NotificationRow({ n }: { n: AppNotification }) {
  const router = useRouter();
  const markRead = useNotificationStore((s) => s.markRead);
  const setActiveNav = useUIStore((s) => s.setActiveNav);

  const open = async () => {
    await markRead(n.id);
    if (n.href) {
      const nav = NAV_BY_HREF[n.href];
      if (nav) setActiveNav(nav);
      router.push(n.href);
    }
  };

  return (
    <Card className={cn("p-4", !n.read && "ring-2 ring-cx-purple/20")}>
      <button onClick={open} className="flex w-full items-start gap-3 text-left" aria-label={`Open notification: ${n.title}`}>
        <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", KIND_DOT[n.kind] ?? "bg-slate-400")} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{n.title}</span>
            {!n.read && <Badge tone="purple">New</Badge>}
          </span>
          <span className="mt-0.5 block text-sm text-slate-500">{n.body}</span>
          <span className="mt-1 block text-[11px] text-slate-400">
            {timeAgo(n.time)} · {n.kind}
          </span>
        </span>
      </button>
    </Card>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, load, loaded, markAllRead, unreadCount } = useNotificationStore();
  const [tab, setTab] = useState("all");

  useEffect(() => {
    void load();
  }, [load]);

  const unread = unreadCount();
  const visible = useMemo(
    () => (tab === "unread" ? notifications.filter((n) => !n.read) : notifications),
    [notifications, tab]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Bell size={20} className="text-cx-purple" /> Notifications
          </h1>
          <p className="mt-0.5 text-sm text-slate-500" role="status">
            {unread === 0 ? "All caught up." : `${unread} unread`}
          </p>
        </div>
        {unread > 0 && (
          <Button size="sm" variant="secondary" icon={<CheckCheck size={14} />} onClick={() => markAllRead()}>
            Mark all read
          </Button>
        )}
      </div>

      <Tabs
        tabs={[
          { key: "all", label: "All", count: notifications.length },
          { key: "unread", label: "Unread", count: unread },
        ]}
        active={tab}
        onChange={setTab}
        className="overflow-x-auto"
      />

      {!loaded ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-400">Loading notifications…</p>
        </Card>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={tab === "unread" ? "No unread notifications" : "No notifications"}
          description={
            tab === "unread"
              ? "You're all caught up."
              : "Activity, approvals and agent events will show up here."
          }
          action={
            tab === "unread" ? (
              <Button variant="secondary" onClick={() => setTab("all")}>
                Show all
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => router.push("/home")}>
                Back to Home
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2.5">
          {visible.map((n) => (
            <NotificationRow key={n.id} n={n} />
          ))}
        </div>
      )}
    </div>
  );
}
