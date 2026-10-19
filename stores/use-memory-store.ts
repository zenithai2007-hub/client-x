"use client";

import { create } from "zustand";
import type { InFlightMap, MemoryItem, MemorySection } from "@/lib/types";
import { memoryService } from "@/lib/services/memory-service";
import { beginAction, endAction, isInFlightKey } from "./_helpers";

interface MemoryState {
  items: MemoryItem[];
  loaded: boolean;
  inFlight: InFlightMap;
  isInFlight: (key: string) => boolean;

  load: () => Promise<void>;
  addItem: (section: MemorySection, key: string, value: string) => Promise<MemoryItem>;
  updateItem: (id: string, patch: Partial<Pick<MemoryItem, "key" | "value">>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  itemsBySection: (section: MemorySection) => MemoryItem[];
}

export const useMemoryStore = create<MemoryState>()((set, get) => ({
  items: [],
  loaded: false,
  inFlight: {},
  isInFlight: (key) => isInFlightKey(get().inFlight, key),

  load: async () => {
    if (get().loaded) return;
    const items = await memoryService.fetchItems();
    set({ items, loaded: true });
  },

  addItem: async (section, key, value) => {
    const item = await memoryService.addItem(section, key, value);
    set((s) => ({ items: [item, ...s.items] }));
    return item;
  },

  updateItem: async (id, patch) => {
    const actionKey = `memory:${id}:update`;
    const started = beginAction(get().inFlight, actionKey);
    if (!started) return;
    set({ inFlight: started.map });
    try {
      await memoryService.updateItem(id, patch);
      set((s) => ({
        items: s.items.map((i) =>
          i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i
        ),
      }));
    } finally {
      set((s) => ({ inFlight: endAction(s.inFlight, actionKey) }));
    }
  },

  deleteItem: async (id) => {
    await memoryService.deleteItem(id);
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  itemsBySection: (section) => get().items.filter((i) => i.section === section),
}));
