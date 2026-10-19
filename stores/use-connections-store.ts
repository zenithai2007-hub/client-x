"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PlatformConnection } from "@/lib/types";
import { connectionService } from "@/lib/services/connection-service";
import { useActivityStore } from "./use-activity-store";
import { useNotificationStore } from "./use-notification-store";

interface ConnectionsState {
  connections: PlatformConnection[];
  loaded: boolean;
  load: () => Promise<void>;
  statusOf: (platformId: string) => PlatformConnection;
  pairWhatsApp: (phone: string) => Promise<void>;
  authorizeOAuth: (platformId: string) => Promise<void>;
  disconnect: (platformId: string) => Promise<void>;
}

export const useConnectionsStore = create<ConnectionsState>()(
  persist(
    (set, get) => ({
      connections: [],
      loaded: false,

      load: async () => {
        if (get().loaded) return;
        const saved = get().connections;
        if (saved.length) connectionService.hydrate(saved);
        const snap = await connectionService.getSnapshot();
        set({ connections: snap.connections, loaded: true });
      },

      statusOf: (platformId: string) =>
        get().connections.find((c) => c.platformId === platformId) ?? {
          platformId,
          status: "disconnected",
        },

      pairWhatsApp: async (phone: string) => {
        const c = await connectionService.completeWhatsAppPairing(phone);
        set({
          connections: get().connections.map((x) =>
            x.platformId === c.platformId ? c : x
          ),
        });
        useActivityStore
          .getState()
          .logEvent("system", `WhatsApp connected (${phone}).`);
        useNotificationStore
          .getState()
          .push("WhatsApp connected", "Your WhatsApp account is now linked.", "success");
      },

      authorizeOAuth: async (platformId: string) => {
        const c = await connectionService.completeOAuth(platformId);
        set({
          connections: get().connections.map((x) =>
            x.platformId === c.platformId ? c : x
          ),
        });
        const name =
          { instagram: "Instagram", linkedin: "LinkedIn", x: "X", telegram: "Telegram", facebook: "Facebook" }[
            platformId
          ] ?? platformId;
        useActivityStore
          .getState()
          .logEvent("system", `${name} connected (${c.handle}).`);
        useNotificationStore
          .getState()
          .push(`${name} connected`, `Signed in as ${c.handle}.`, "success");
      },

      disconnect: async (platformId: string) => {
        const c = await connectionService.disconnect(platformId);
        set({
          connections: get().connections.map((x) =>
            x.platformId === c.platformId ? c : x
          ),
        });
        useActivityStore
          .getState()
          .logEvent("system", `Disconnected ${platformId}.`);
      },
    }),
    {
      name: "clientx-connections-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ connections: s.connections }),
    }
  )
);
