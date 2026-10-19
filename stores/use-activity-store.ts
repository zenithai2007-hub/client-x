"use client";

import { create } from "zustand";
import type { ActivityCategory, ActivityEvent } from "@/lib/types";
import { activityService } from "@/lib/services/activity-service";

interface ActivityState {
  events: ActivityEvent[];
  loaded: boolean;
  load: () => Promise<void>;
  /** Prepends the event and caps the list at 100. */
  logEvent: (category: ActivityCategory, text: string) => Promise<ActivityEvent>;
  clear: () => void;
}

export const useActivityStore = create<ActivityState>()((set, get) => ({
  events: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const events = await activityService.fetchEvents();
    set({ events, loaded: true });
  },

  logEvent: async (category, text) => {
    const event = await activityService.log(category, text);
    set((s) => ({ events: [event, ...s.events].slice(0, 100) }));
    return event;
  },

  clear: () => set({ events: [] }),
}));
