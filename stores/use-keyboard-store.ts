"use client";

import { create } from "zustand";
import type { InFlightMap } from "@/lib/types";
import { uid } from "@/lib/services/base";
import { useActivityStore } from "./use-activity-store";
import { beginAction, endAction, isInFlightKey } from "./_helpers";

export type KeyboardTone = "professional" | "friendly" | "concise" | "persuasive";
export type KeyboardLang = "en" | "ur";

export interface ClipboardItem {
  id: string;
  text: string;
  time: string;
}

export interface QuickAction {
  id: string;
  label: string;
  kind: "rewrite" | "reply" | "translate" | "shorten";
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "qa-rewrite", label: "Rewrite", kind: "rewrite" },
  { id: "qa-reply", label: "Generate reply", kind: "reply" },
  { id: "qa-translate", label: "Translate (Urdu)", kind: "translate" },
  { id: "qa-shorten", label: "Shorten", kind: "shorten" },
];

const TONE_OPENERS: Record<KeyboardTone, string> = {
  professional: "Dear recipient,",
  friendly: "Hey there!",
  concise: "",
  persuasive: "Quick thought —",
};

interface KeyboardState {
  kbInput: string;
  kbOutput: string;
  tone: KeyboardTone;
  language: KeyboardLang;
  clipboardItems: ClipboardItem[];
  generating: boolean;
  inFlight: InFlightMap;
  isInFlight: (key: string) => boolean;

  setKbInput: (v: string) => void;
  setTone: (t: KeyboardTone) => void;
  setLanguage: (l: KeyboardLang) => void;
  /** Mock tone generation with a realistic delay. */
  generateTone: (kind?: KeyboardTone) => Promise<void>;
  runQuickAction: (id: string) => Promise<void>;
  /** Copies to clipboard AND keeps a local history list. */
  insertToClipboard: (text: string) => Promise<void>;
  clearOutput: () => void;
}

function mockGenerate(input: string, tone: KeyboardTone, lang: KeyboardLang): string {
  const opener = TONE_OPENERS[tone];
  const body =
    tone === "concise"
      ? input.split(/[.!?]\s/).filter(Boolean)[0] ?? input
      : tone === "persuasive"
        ? `${input.trim()} This is a limited-time opportunity — let me know if you'd like the details.`
        : input.trim();
  const prefix = opener ? `${opener} ` : "";
  const langTag = lang === "ur" ? "[Urdu] " : "";
  return `${langTag}${prefix}${body}`.trim();
}

export const useKeyboardStore = create<KeyboardState>()((set, get) => ({
  kbInput: "",
  kbOutput: "",
  tone: "professional",
  language: "en",
  clipboardItems: [],
  generating: false,
  inFlight: {},
  isInFlight: (key) => isInFlightKey(get().inFlight, key),

  setKbInput: (v) => set({ kbInput: v }),
  setTone: (t) => set({ tone: t }),
  setLanguage: (l) => set({ language: l }),

  generateTone: async (kind) => {
    const key = "keyboard:generate";
    const started = beginAction(get().inFlight, key);
    if (!started) return;
    set({ inFlight: started.map, generating: true });
    try {
      const { kbInput, tone, language } = get();
      const useTone = kind ?? tone;
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 500));
      const output = kbInput.trim()
        ? mockGenerate(kbInput, useTone, language)
        : "Type something first — then I'll shape it in the selected tone.";
      set({ kbOutput: output });
      useActivityStore.getState().logEvent("keyboard", `Generated ${useTone} text.`);
    } finally {
      set((s) => ({ inFlight: endAction(s.inFlight, key), generating: false }));
    }
  },

  runQuickAction: async (id) => {
    const action = QUICK_ACTIONS.find((a) => a.id === id);
    if (!action) return;
    const { kbInput } = get();
    if (!kbInput.trim()) {
      set({ kbOutput: "Type something first — then pick a quick action." });
      return;
    }
    const toneMap: Record<QuickAction["kind"], KeyboardTone> = {
      rewrite: get().tone,
      reply: "friendly",
      translate: get().tone,
      shorten: "concise",
    };
    if (action.kind === "translate") {
      const prev = get().language;
      set({ language: "ur" });
      await get().generateTone(toneMap[action.kind]);
      set({ language: prev });
    } else if (action.kind === "reply") {
      set({
        kbOutput: `Thanks for your message! Regarding "${kbInput.slice(0, 60)}${kbInput.length > 60 ? "…" : ""}" — I'll confirm the details and get back to you shortly.`,
      });
      useActivityStore.getState().logEvent("keyboard", "Generated a reply draft.");
    } else {
      await get().generateTone(toneMap[action.kind]);
    }
  },

  insertToClipboard: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await navigator.clipboard.writeText(trimmed);
    } catch {
      /* clipboard API unavailable — history still recorded */
    }
    const item: ClipboardItem = { id: uid("clip"), text: trimmed, time: new Date().toISOString() };
    set((s) => ({ clipboardItems: [item, ...s.clipboardItems].slice(0, 20) }));
    useActivityStore.getState().logEvent("keyboard", "Copied text to clipboard.");
  },

  clearOutput: () => set({ kbOutput: "" }),
}));
