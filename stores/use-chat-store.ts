"use client";

import { create } from "zustand";
import type { AITransformKind, Conversation, InFlightMap, Message } from "@/lib/types";
import { chatService } from "@/lib/services/chat-service";
import { uid, nowISO } from "@/lib/services/base";
import { useActivityStore } from "./use-activity-store";
import { useNotificationStore } from "./use-notification-store";
import { beginAction, endAction, isInFlightKey } from "./_helpers";

export type ChatTab = "all" | "unread" | "mentions";

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  messagesByConvo: Record<string, Message[]>;
  tab: ChatTab;
  searchQuery: string;
  typingIn: Record<string, boolean>;
  loaded: boolean;
  inFlight: InFlightMap;
  isInFlight: (key: string) => boolean;

  load: () => Promise<void>;
  selectConversation: (id: string) => void;
  setTab: (tab: ChatTab) => void;
  setSearchQuery: (q: string) => void;
  /** Sends a message: optimistic add → delivered → typing → contextual reply → read. */
  sendMessage: (text: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  newChat: (name: string) => void;
  aiTransform: (text: string, kind: AITransformKind) => Promise<string>;
  filteredConversations: () => Conversation[];
  activeMessages: () => Message[];
}

export const useChatStore = create<ChatState>()((set, get) => {
  const appendMessage = (convoId: string, msg: Message) =>
    set((s) => ({
      messagesByConvo: {
        ...s.messagesByConvo,
        [convoId]: [...(s.messagesByConvo[convoId] ?? []), msg],
      },
    }));

  const patchMessage = (convoId: string, msgId: string, patch: Partial<Message>) =>
    set((s) => ({
      messagesByConvo: {
        ...s.messagesByConvo,
        [convoId]: (s.messagesByConvo[convoId] ?? []).map((m) =>
          m.id === msgId ? { ...m, ...patch } : m
        ),
      },
    }));

  const touchConvo = (convoId: string, lastMessage: string) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convoId ? { ...c, lastMessage, lastTime: nowISO() } : c
      ),
    }));

  return {
    conversations: [],
    activeId: null,
    messagesByConvo: {},
    tab: "all",
    searchQuery: "",
    typingIn: {},
    loaded: false,
    inFlight: {},
    isInFlight: (key) => isInFlightKey(get().inFlight, key),

    load: async () => {
      if (get().loaded) return;
      const conversations = await chatService.fetchConversations();
      set({ conversations, loaded: true, activeId: conversations[0]?.id ?? null });
      // lazy-load messages for the active conversation
      const activeId = get().activeId;
      if (activeId) {
        const messages = await chatService.fetchMessages(activeId);
        set((s) => ({ messagesByConvo: { ...s.messagesByConvo, [activeId]: messages } }));
      }
    },

    selectConversation: (id) => {
      set({ activeId: id });
      // mark read on open + lazy-load history
      set((s) => ({
        conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
      }));
      chatService.markRead(id);
      if (!get().messagesByConvo[id]) {
        chatService.fetchMessages(id).then((messages) =>
          set((s) => ({ messagesByConvo: { ...s.messagesByConvo, [id]: messages } }))
        );
      }
    },

    setTab: (tab) => set({ tab }),
    setSearchQuery: (q) => set({ searchQuery: q }),

    sendMessage: async (text) => {
      const convoId = get().activeId;
      const trimmed = text.trim();
      if (!convoId || !trimmed) return;
      const actionKey = `send:${convoId}`;
      const started = beginAction(get().inFlight, actionKey);
      if (!started) return; // duplicate send guard
      set({ inFlight: started.map });

      try {
        // 1. optimistic add as "sent"
        const outgoing: Message = await chatService.sendMessage(convoId, trimmed);
        appendMessage(convoId, outgoing);
        touchConvo(convoId, trimmed);

        // 2. delivered after ~900ms
        await new Promise((res) => setTimeout(res, 900));
        patchMessage(convoId, outgoing.id, { status: "delivered" });

        // 3. typing indicator
        set((s) => ({ typingIn: { ...s.typingIn, [convoId]: true } }));
        const replyText = await chatService.generateReply(trimmed);
        set((s) => ({ typingIn: { ...s.typingIn, [convoId]: false } }));

        // 4. reply arrives; own message marked read
        const reply: Message = {
          id: uid("msg"),
          sender: "them",
          text: replyText,
          time: nowISO(),
          status: "read",
        };
        appendMessage(convoId, reply);
        patchMessage(convoId, outgoing.id, { status: "read" });
        touchConvo(convoId, replyText);

        const convo = get().conversations.find((c) => c.id === convoId);
        useActivityStore.getState().logEvent("agents", `Replied to ${convo?.name ?? "chat"}.`);
        // occasionally surface a notification for the incoming reply
        if (Math.random() < 0.25 && convo) {
          useNotificationStore
            .getState()
            .push(`New reply from ${convo.name}`, replyText.slice(0, 80), "info");
        }
      } finally {
        set((s) => ({ inFlight: endAction(s.inFlight, actionKey) }));
      }
    },

    markAllRead: async () => {
      set((s) => ({
        conversations: s.conversations.map((c) => ({ ...c, unread: 0 })),
      }));
    },

    newChat: (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const convo: Conversation = {
        id: uid("c"),
        name: trimmed,
        avatarColor: "#7C3AED",
        lastMessage: "New conversation started.",
        lastTime: nowISO(),
        unread: 0,
        online: true,
      };
      set((s) => ({
        conversations: [convo, ...s.conversations],
        activeId: convo.id,
        messagesByConvo: { ...s.messagesByConvo, [convo.id]: [] },
      }));
      useActivityStore.getState().logEvent("agents", `Started a new chat with ${trimmed}.`);
    },

    aiTransform: (text, kind) => chatService.aiTransform(text, kind),

    filteredConversations: () => {
      const { conversations, tab, searchQuery } = get();
      const q = searchQuery.trim().toLowerCase();
      return conversations.filter((c) => {
        if (tab === "unread" && c.unread === 0) return false;
        if (tab === "mentions" && !(c.mentions && c.mentions > 0)) return false;
        if (q && !c.name.toLowerCase().includes(q) && !c.lastMessage.toLowerCase().includes(q))
          return false;
        return true;
      });
    },

    activeMessages: () => {
      const { activeId, messagesByConvo } = get();
      return activeId ? messagesByConvo[activeId] ?? [] : [];
    },
  };
});
