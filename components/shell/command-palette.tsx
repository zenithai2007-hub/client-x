"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, MessageSquare, Bot, ListTodo, Brain, Megaphone, Plus, Play, X,
  ArrowRight, Keyboard as KeyboardIcon, Settings as SettingsIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/use-ui-store";
import { useChatStore } from "@/stores/use-chat-store";
import { useAgentStore } from "@/stores/use-agent-store";
import { useTaskStore } from "@/stores/use-task-store";
import { useMemoryStore } from "@/stores/use-memory-store";
import { useOutreachStore } from "@/stores/use-outreach-store";
import { cn } from "@/lib/cn";

interface Entry {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, setActiveNav } = useUIStore();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const conversations = useChatStore((s) => s.conversations);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const newChat = useChatStore((s) => s.newChat);
  const agents = useAgentStore((s) => s.agents);
  const setActiveAgent = useAgentStore((s) => s.setActiveAgent);
  const tasks = useTaskStore((s) => s.tasks);
  const memoryItems = useMemoryStore((s) => s.items);
  const createCampaign = useOutreachStore((s) => s.createCampaign);
  const createTask = useTaskStore((s) => s.createTask);

  const go = (href: string, nav?: Parameters<typeof setActiveNav>[0]) => {
    if (nav) setActiveNav(nav);
    setCommandPaletteOpen(false);
    setQuery("");
    router.push(href);
  };

  const entries: Entry[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (s: string) => !q || s.toLowerCase().includes(q);
    const list: Entry[] = [];

    // Actions
    const actions: Entry[] = [
      { id: "act-new-chat", group: "Actions", label: "New chat", icon: Plus, run: () => { newChat("New conversation"); go("/chats", "chat"); } },
      { id: "act-start-outreach", group: "Actions", label: "Start outreach", icon: Megaphone, run: () => go("/outreach", "outreach") },
      { id: "act-create-task", group: "Actions", label: "Create task", icon: ListTodo, run: () => go("/tasks", "tasks") },
      { id: "act-keyboard", group: "Actions", label: "Open keyboard", icon: KeyboardIcon, run: () => go("/keyboard", "keyboard") },
      { id: "act-settings", group: "Actions", label: "Open settings", icon: SettingsIcon, run: () => go("/settings", "settings") },
    ];
    actions.forEach((a) => { if (match(a.label)) list.push(a); });

    conversations.forEach((c) => {
      if (!match(c.name)) return;
      list.push({
        id: `chat-${c.id}`, group: "Chats", label: c.name, hint: c.lastMessage.slice(0, 40),
        icon: MessageSquare,
        run: () => { selectConversation(c.id); go("/chats", "chat"); },
      });
    });
    agents.forEach((a) => {
      if (!match(a.name)) return;
      list.push({
        id: `agent-${a.id}`, group: "Agents", label: a.name, hint: a.status,
        icon: Bot,
        run: () => { setActiveAgent(a.id); go("/agents", "agents"); },
      });
    });
    tasks.forEach((t) => {
      if (!match(t.title)) return;
      list.push({
        id: `task-${t.id}`, group: "Tasks", label: t.title, hint: t.status,
        icon: ListTodo, run: () => go("/tasks", "tasks"),
      });
    });
    memoryItems.forEach((m) => {
      if (!match(m.key) && !match(m.value)) return;
      list.push({
        id: `mem-${m.id}`, group: "Memory", label: m.key, hint: m.value.slice(0, 40),
        icon: Brain, run: () => go("/memory", "memory"),
      });
    });
    return list.slice(0, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, conversations, agents, tasks, memoryItems]);

  useEffect(() => setCursor(0), [query]);
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [commandPaletteOpen]);

  // Global Ctrl+K / Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useUIStore.getState().toggleCommandPalette();
      } else if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCommandPaletteOpen]);

  const onPaletteKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, entries.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === "Enter" && entries[cursor]) { e.preventDefault(); entries[cursor].run(); }
  };

  let lastGroup = "";
  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-slate-900/40 p-4"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto mt-[10vh] max-w-lg overflow-hidden rounded-2xl  bg-cx-surface shadow-cx-pop"
          >
            <div className="flex items-center gap-2 border-b border-white/60 px-4">
              <Search size={17} className="text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onPaletteKey}
                placeholder="Search chats, agents, tasks, memory…"
                className="h-12 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/60"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[380px] overflow-y-auto p-2">
              {entries.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-slate-400">
                  No results. Try another search.
                </p>
              )}
              {entries.map((e, i) => {
                const showGroup = e.group !== lastGroup;
                lastGroup = e.group;
                const Icon = e.icon;
                return (
                  <div key={e.id}>
                    {showGroup && (
                      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {e.group}
                      </p>
                    )}
                    <button
                      onClick={e.run}
                      onMouseEnter={() => setCursor(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                        i === cursor ? "bg-cx-purpleLight/60" : ""
                      )}
                    >
                      <span className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        i === cursor ? "bg-cx-surface text-cx-purple" : "bg-slate-100 text-slate-500"
                      )}>
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">{e.label}</span>
                        {e.hint && <span className="block truncate text-xs text-slate-400">{e.hint}</span>}
                      </span>
                      <ArrowRight size={14} className="shrink-0 text-slate-300" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 border-t border-white/60 px-4 py-2 text-[11px] text-slate-400">
              <span><kbd className="rounded bg-slate-100 px-1">↑↓</kbd> navigate</span>
              <span><kbd className="rounded bg-slate-100 px-1">↵</kbd> select</span>
              <span><kbd className="rounded bg-slate-100 px-1">esc</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
