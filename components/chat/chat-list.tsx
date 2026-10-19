"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AtSign, CheckCheck, MessageSquarePlus, Plus, Search } from "lucide-react";
import type { ChatTab } from "@/stores/use-chat-store";
import { useChatStore } from "@/stores/use-chat-store";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "./time-utils";

export function ChatList({ onOpenThread }: { onOpenThread: () => void }) {
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const tab = useChatStore((s) => s.tab);
  const searchQuery = useChatStore((s) => s.searchQuery);
  const setTab = useChatStore((s) => s.setTab);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const markAllRead = useChatStore((s) => s.markAllRead);
  const newChat = useChatStore((s) => s.newChat);
  const filteredConversations = useChatStore((s) => s.filteredConversations);

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");

  const unreadCount = conversations.filter((c) => c.unread > 0).length;
  const mentionCount = conversations.filter((c) => (c.mentions ?? 0) > 0).length;
  const list = filteredConversations();

  const openConversation = (id: string) => {
    selectConversation(id);
    onOpenThread();
  };

  const createChat = () => {
    const name = newChatName.trim();
    if (!name) return;
    newChat(name);
    setNewChatName("");
    setNewChatOpen(false);
    onOpenThread();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-cx-card">
      <div className="border-b border-slate-100 px-3 pb-3 pt-3">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-slate-900">Chats</h2>
          <Tooltip tip="Mark all as read">
            <button
              onClick={() => void markAllRead()}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Mark all as read"
            >
              <CheckCheck size={16} />
            </button>
          </Tooltip>
        </div>
        <Tabs
          tabs={[
            { key: "all", label: "All", count: conversations.length },
            { key: "unread", label: "Unread", count: unreadCount },
            { key: "mentions", label: "Mentions", count: mentionCount },
          ]}
          active={tab}
          onChange={(k) => setTab(k as ChatTab)}
        />
        <div className="relative mt-2.5">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats…"
            className="h-9 pl-9"
            aria-label="Search chats"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {list.length === 0 ? (
          <div className="px-1 pt-4">
            <EmptyState
              icon={tab === "mentions" ? AtSign : MessageSquarePlus}
              title={
                tab === "unread"
                  ? "You're all caught up"
                  : tab === "mentions"
                    ? "No mentions yet"
                    : searchQuery
                      ? "No chats found"
                      : "No chats yet"
              }
              description={
                tab === "mentions"
                  ? "Conversations that mention @you will appear here."
                  : searchQuery
                    ? "Try a different name or message."
                    : "Start a new chat to begin messaging."
              }
              action={
                tab === "all" && !searchQuery ? (
                  <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => setNewChatOpen(true)}>
                    New chat
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <ul className="space-y-0.5">
            {list.map((c) => {
              const active = c.id === activeId;
              return (
                <li key={c.id}>
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    onClick={() => openConversation(c.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                      active
                        ? "bg-white shadow-cx-card ring-1 ring-slate-200/70"
                        : "hover:bg-slate-50"
                    )}
                  >
                    <Avatar name={c.name} color={c.avatarColor} online={c.online} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{c.name}</span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatRelativeTime(c.lastTime)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-slate-500">{c.lastMessage}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          {(c.mentions ?? 0) > 0 && (
                            <Badge tone="orange" className="px-1.5 text-[10px]">
                              @{c.mentions}
                            </Badge>
                          )}
                          {c.unread > 0 && (
                            <Badge tone="purple" className="min-w-[20px] justify-center px-1.5 text-[11px]">
                              {c.unread}
                            </Badge>
                          )}
                        </span>
                      </span>
                    </span>
                  </motion.button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <Button
          variant="secondary"
          size="md"
          icon={<Plus size={15} />}
          className="w-full"
          onClick={() => setNewChatOpen(true)}
        >
          New Chat
        </Button>
      </div>

      <Modal open={newChatOpen} onClose={() => setNewChatOpen(false)} title="New chat">
        <Input
          value={newChatName}
          onChange={(e) => setNewChatName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createChat()}
          placeholder="Contact or group name…"
          autoFocus
          aria-label="Chat name"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setNewChatOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary-orange" onClick={createChat} disabled={!newChatName.trim()}>
            Start chat
          </Button>
        </div>
      </Modal>
    </div>
  );
}
