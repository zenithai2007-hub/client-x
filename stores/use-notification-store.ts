"use client";

import { create } from "zustand";
import type { AppNotification, NotificationKind } from "@/lib/types";
import { notificationService } from "@/lib/services/notification-service";

interface NotificationState {
  notifications: AppNotification[];
  loaded: boolean;
  load: () => Promise<void>;
  push: (title: string, body: string, kind?: NotificationKind) => Promise<AppNotification>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const notifications = await notificationService.fetchNotifications();
    set({ notifications, loaded: true });
  },

  push: async (title, body, kind = "info") => {
    const n = await notificationService.push(title, body, kind);
    set((s) => ({ notifications: [n, ...s.notifications] }));
    return n;
  },

  markRead: async (id) => {
    await notificationService.markRead(id);
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAllRead: async () => {
    await notificationService.markAllRead();
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  },

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
