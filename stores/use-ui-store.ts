"use client";

import { create } from "zustand";
import type { NavKey } from "@/lib/types";

interface UIState {
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  commandPaletteOpen: boolean;
  mobileNavOpen: boolean;
  activeNav: NavKey;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setActiveNav: (nav: NavKey) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarCollapsed: false,
  rightPanelOpen: true,
  commandPaletteOpen: false,
  mobileNavOpen: false,
  activeNav: "home",
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setActiveNav: (nav) => set({ activeNav: nav }),
}));
