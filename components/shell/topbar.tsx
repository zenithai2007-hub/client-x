"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, Search } from "lucide-react";
import type { NavKey } from "@/lib/types";
import { useUIStore } from "@/stores/use-ui-store";
import { useNotificationStore } from "@/stores/use-notification-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const TITLES: Record<NavKey, string> = {
  home: "Home",
  chat: "Chats",
  agents: "Agents",
  outreach: "Outreach",
  tasks: "Tasks",
  keyboard: "Keyboard",
  memory: "Memory",
  activity: "Activity",
  history: "History",
  automations: "Automations",
  analytics: "Analytics",
  referrals: "Referrals",
  templates: "Templates",
  connections: "Connections",
  settings: "Settings",
};

const KIND_DOT: Record<string, string> = {
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-cx-orange",
  approval: "bg-cx-purple",
  agent: "bg-slate-500",
};

/** Notification deep-links → sidebar nav key (keeps the topbar title in sync). */
const NAV_BY_HREF: Record<string, NavKey> = {
  "/home": "home",
  "/chats": "chat",
  "/agents": "agents",
  "/outreach": "outreach",
  "/tasks": "tasks",
  "/keyboard": "keyboard",
  "/memory": "memory",
  "/activity": "activity",
  "/history": "history",
  "/automations": "automations",
  "/analytics": "analytics",
  "/referrals": "referrals",
  "/templates": "templates",
  "/connections": "connections",
  "/settings": "settings",
};

export function TopBar() {
  const router = useRouter();
  const { activeNav, setActiveNav, toggleCommandPalette } = useUIStore();
  const { notifications, load, markRead, markAllRead, unreadCount } = useNotificationStore();
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!bellOpen) return;
    const close = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [bellOpen]);

  const unread = unreadCount();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/60 bg-[#E9EDF4]/90 px-4 backdrop-blur sm:px-6">
      <h1 className="text-lg font-bold tracking-tight text-slate-900">{TITLES[activeNav]}</h1>

      <div className="ml-auto flex items-center gap-2">
        {/* Ctrl+K trigger */}
        <button
          onClick={toggleCommandPalette}
          className="hidden items-center gap-2 rounded-xl  bg-cx-surface px-3 py-2 text-sm text-slate-400 shadow-cx-card hover:text-slate-600 sm:flex"
        >
          <Search size={15} />
          <span>Search…</span>
          <kbd className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
            Ctrl K
          </kbd>
        </button>
        <button
          onClick={toggleCommandPalette}
          className="flex h-10 w-10 items-center justify-center rounded-xl  bg-cx-surface text-slate-500 shadow-cx-card sm:hidden"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        {/* Notifications */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen((o) => !o)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl  bg-cx-surface text-slate-500 shadow-cx-card hover:text-slate-700"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cx-orange px-1 text-[11px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          <AnimatePresence>
            {bellOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 z-50 mt-2 w-[340px] max-w-[90vw] rounded-2xl  bg-cx-surface p-2 shadow-cx-pop"
              >
                <div className="flex items-center justify-between px-2 py-1.5">
                  <p className="text-sm font-semibold text-slate-800">Notifications</p>
                  <button
                    onClick={() => markAllRead()}
                    className="flex items-center gap-1 text-xs font-medium text-cx-purple hover:text-cx-purpleDark"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                </div>
                <div className="max-h-[380px] overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="px-3 py-8 text-center text-sm text-slate-400">All caught up.</p>
                  )}
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        void markRead(n.id);
                        setBellOpen(false);
                        if (n.href) {
                          const nav = NAV_BY_HREF[n.href];
                          if (nav) setActiveNav(nav);
                          router.push(n.href);
                        }
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-cx-bg shadow-cx-inset-sm",
                        !n.read && "bg-cx-purpleLight/40"
                      )}
                    >
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", KIND_DOT[n.kind])} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-800">{n.title}</span>
                        <span className="block truncate text-xs text-slate-500">{n.body}</span>
                      </span>
                      {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cx-purple" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
