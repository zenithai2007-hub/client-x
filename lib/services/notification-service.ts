import type { AppNotification, NotificationKind } from "../types";
import { jitter, nowISO, uid } from "./base";
import { seedNotifications } from "../mock-data";

export interface INotificationService {
  fetchNotifications(): Promise<AppNotification[]>;
  push(title: string, body: string, kind: NotificationKind, href?: string): Promise<AppNotification>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

export class MockNotificationService implements INotificationService {
  async fetchNotifications(): Promise<AppNotification[]> {
    await jitter(120, 280);
    return structuredClone(seedNotifications);
  }

  async push(title: string, body: string, kind: NotificationKind, href?: string): Promise<AppNotification> {
    await jitter(80, 180);
    return { id: uid("notif"), title, body, time: nowISO(), read: false, kind, href };
  }

  async markRead(id: string): Promise<void> {
    await jitter(60, 140);
  }

  async markAllRead(): Promise<void> {
    await jitter(80, 160);
  }
}

export const notificationService: INotificationService = new MockNotificationService();
