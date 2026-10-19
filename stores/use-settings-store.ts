"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Settings } from "@/lib/types";
import { defaultSettings } from "@/lib/mock-data";

interface SettingsState extends Settings {
  /** Shallow-merges top-level sections, e.g. update({ ai: { tone: 'friendly' } }). */
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...structuredClone(defaultSettings),
      update: (patch) =>
        set((s) => ({
          appearance: { ...s.appearance, ...patch.appearance },
          notifications: { ...s.notifications, ...patch.notifications },
          ai: { ...s.ai, ...patch.ai },
          privacy: { ...s.privacy, ...patch.privacy },
          outreach: { ...s.outreach, ...patch.outreach },
        })),
      reset: () => set({ ...structuredClone(defaultSettings) }),
    }),
    {
      name: "clientx-settings-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
