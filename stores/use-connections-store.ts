"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PlatformConnection } from "@/lib/types";
import { connectionService } from "@/lib/services/connection-service";
import { PLATFORM_REGISTRY, getPlatform } from "@/lib/platforms";
import { useActivityStore } from "./use-activity-store";

interface ConnectionsState {
  connections: PlatformConnection[];
  loaded: boolean;
  load: () => Promise<void>;
  statusOf: (platformId: string) => PlatformConnection;
  requestConnect: (platformId: string) => Promise<{ ok: boolean; error?: string }>;
  disconnect: (platformId: string) => Promise<void>;
}

export const useConnectionsStore = create<ConnectionsState>()(
  persist(
    (set, get) => ({
      connections: [],
      loaded: false,

      load: async () => {
        if (get().loaded) return;
        // Honest: always start from a clean disconnected snapshot.
        const snap = await connectionService.getSnapshot();
        set({ connections: snap.connections, loaded: true });
      },

      statusOf: (platformId: string) =>
        get().connections.find((c) => c.platformId === platformId) ?? {
          platformId,
          status: "disconnected",
        },

      requestConnect: async (platformId: string) => {
        const result = await connectionService.connect(platformId);
        const name = getPlatform(platformId)?.name ?? platformId;
        await useActivityStore
          .getState()
          .logEvent("platforms", `Connect requested for ${name} — requires configuration.`);
        // Never mark anything connected: the service only ever returns failure.
        return { ok: false as const, error: result.error };
      },

      disconnect: async (platformId: string) => {
        const c = await connectionService.disconnect(platformId);
        set({
          connections: get().connections.map((x) =>
            x.platformId === c.platformId ? c : x
          ),
        });
        const name = getPlatform(platformId)?.name ?? platformId;
        await useActivityStore
          .getState()
          .logEvent("system", `Disconnected ${name}.`);
      },
    }),
    {
      name: "clientx-connections-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ connections: s.connections }),
    }
  )
);

/** Registry-backed platform list for any UI that needs it. */
export { PLATFORM_REGISTRY };
