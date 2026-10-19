"use client";

import { useEffect } from "react";
import { useChatStore } from "@/stores/use-chat-store";
import { useAgentStore } from "@/stores/use-agent-store";
import { useOutreachStore } from "@/stores/use-outreach-store";
import { useTaskStore } from "@/stores/use-task-store";
import { useMemoryStore } from "@/stores/use-memory-store";
import { useActivityStore } from "@/stores/use-activity-store";
import { useNotificationStore } from "@/stores/use-notification-store";
import { useConnectionsStore } from "@/stores/use-connections-store";

/** Loads all store seed data once when the app shell mounts. */
export function StoreInitializer() {
  useEffect(() => {
    void useChatStore.getState().load();
    void useAgentStore.getState().load();
    void useOutreachStore.getState().load();
    void useTaskStore.getState().load();
    void useMemoryStore.getState().load();
    void useActivityStore.getState().load();
    void useNotificationStore.getState().load();
    void useConnectionsStore.getState().load();
  }, []);
  return null;
}
