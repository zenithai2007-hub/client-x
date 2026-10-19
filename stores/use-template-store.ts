"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CommunityTemplate, TemplateKind } from "@/lib/types";
import { uid, nowISO, delay } from "@/lib/services/base";
import { useAgentStore } from "./use-agent-store";
import { useSettingsStore } from "./use-settings-store";
import { useMemoryStore } from "./use-memory-store";
import { useActivityStore } from "./use-activity-store";
import { useNotificationStore } from "./use-notification-store";
import { beginAction, endAction } from "./_helpers";

const seedTemplates = (): CommunityTemplate[] => [
  {
    id: "tpl-linkedin-pro",
    kind: "outreach",
    title: "LinkedIn Outreach Pro",
    description: "Personalized first-touch sequence for B2B prospects. Approval-gated, no spam.",
    author: "Sarah K.",
    uses: 1240,
    rating: 4.8,
    createdAt: nowISO(),
    payload: {
      platform: "linkedin",
      goal: "Introduce our product with a personalized first message",
      tone: "Professional",
      messageStyle: "Personalized",
      targets: ["Faisal", "Ahmad", "Hamza"],
    },
  },
  {
    id: "tpl-wa-closer",
    kind: "agent",
    title: "Friendly WhatsApp Closer",
    description: "WhatsApp agent that follows up warmly and asks for the sale once.",
    author: "Alex R.",
    uses: 856,
    rating: 4.9,
    createdAt: nowISO(),
    payload: {
      platform: "whatsapp",
      instructions:
        "You are a friendly sales assistant on WhatsApp. Keep replies short and warm in the user's language. Follow up once if there is no reply after a day. Never send more than two messages without a response.",
      permissions: { sendMessages: false, readProfile: true, manageConnections: false, autoApprove: false },
    },
  },
  {
    id: "tpl-roman-style",
    kind: "style",
    title: "Roman Urdu Reply Style",
    description: "Short, friendly Roman Urdu replies for everyday chats.",
    author: "Hamza",
    uses: 2103,
    rating: 4.7,
    createdAt: nowISO(),
    payload: { tone: "friendly" },
  },
  {
    id: "tpl-cold-email",
    kind: "outreach",
    title: "Cold Email Personalizer",
    description: "Website outreach with per-lead personalization and strict approval gates.",
    author: "Emily W.",
    uses: 643,
    rating: 4.6,
    createdAt: nowISO(),
    payload: {
      platform: "website",
      goal: "Personalized cold outreach referencing the lead's website",
      tone: "Professional",
      messageStyle: "Personalized",
      targets: ["Acme Corp", "Brightline", "Northwind"],
    },
  },
  {
    id: "tpl-support-agent",
    kind: "agent",
    title: "Support Agent Starter",
    description: "Patient support agent: acknowledge, clarify, resolve, escalate when stuck.",
    author: "Tech Team",
    uses: 432,
    rating: 4.5,
    createdAt: nowISO(),
    payload: {
      platform: "browser",
      instructions:
        "You are a patient customer-support agent. Acknowledge the issue, ask one clarifying question if needed, propose a solution, and escalate to a human when you cannot resolve it.",
      permissions: { sendMessages: false, readProfile: true, manageConnections: false, autoApprove: false },
    },
  },
  {
    id: "tpl-pitch-style",
    kind: "style",
    title: "Persuasive Pitch Style",
    description: "Confident, benefit-led tone for pitches and proposals.",
    author: "John D.",
    uses: 918,
    rating: 4.8,
    createdAt: nowISO(),
    payload: { tone: "professional" },
  },
  {
    id: "tpl-followup-seq",
    kind: "outreach",
    title: "Follow-up Sequence",
    description: "Two polite follow-ups for warm leads that went quiet.",
    author: "Marketing Team",
    uses: 1504,
    rating: 4.7,
    createdAt: nowISO(),
    payload: {
      platform: "linkedin",
      goal: "Polite follow-up sequence for warm leads",
      tone: "Friendly",
      messageStyle: "Personalized",
      targets: [],
    },
  },
  {
    id: "tpl-meeting-agent",
    kind: "agent",
    title: "Meeting Scheduler",
    description: "Books meetings: proposes slots, confirms, sends reminders.",
    author: "Sarah K.",
    uses: 377,
    rating: 4.4,
    createdAt: nowISO(),
    payload: {
      platform: "website",
      instructions:
        "You schedule meetings. Propose two time slots, confirm the chosen one, and send a reminder one hour before. Keep everything concise.",
      permissions: { sendMessages: false, readProfile: true, manageConnections: false, autoApprove: false },
    },
  },
];

interface TemplateState {
  templates: CommunityTemplate[];
  loaded: boolean;
  inFlight: Record<string, string>;
  isInFlight: (key: string) => boolean;
  load: () => Promise<void>;
  search: (q: string, kind: TemplateKind | "all") => CommunityTemplate[];
  publish: (data: {
    kind: TemplateKind;
    title: string;
    description: string;
    payload: CommunityTemplate["payload"];
  }) => Promise<CommunityTemplate>;
  /** Clones a template into the user's workspace. Returns where to navigate. */
  useTemplate: (id: string) => Promise<{ navigate: string }>;
}

const KIND_LABEL: Record<TemplateKind, string> = {
  agent: "Agent setup",
  style: "Style",
  outreach: "Outreach",
};

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: [],
      loaded: false,
      inFlight: {},
      isInFlight: (key) => key in get().inFlight,

      load: async () => {
        if (get().loaded) return;
        await delay(200);
        // Merge seeds with user-published templates (persisted ones win on id clash).
        const existing = get().templates;
        const mine = existing.filter((t) => t.mine);
        set({ templates: [...mine, ...seedTemplates()], loaded: true });
      },

      search: (q, kind) => {
        const query = q.trim().toLowerCase();
        return get().templates.filter((t) => {
          if (kind !== "all" && t.kind !== kind) return false;
          if (!query) return true;
          return (
            t.title.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            t.author.toLowerCase().includes(query)
          );
        });
      },

      publish: async (data) => {
        const key = `template:publish:${data.title}`;
        const started = beginAction(get().inFlight, key);
        if (!started) throw new Error("Publish already in progress.");
        set({ inFlight: started.map });
        try {
          await delay(500);
          const tpl: CommunityTemplate = {
            id: `tpl-${uid()}`,
            kind: data.kind,
            title: data.title,
            description: data.description,
            author: "You",
            uses: 0,
            rating: 5,
            createdAt: nowISO(),
            mine: true,
            payload: data.payload,
          };
          set((s) => ({ templates: [tpl, ...s.templates] }));
          useActivityStore
            .getState()
            .logEvent("system", `Published "${tpl.title}" to the template gallery.`);
          useNotificationStore
            .getState()
            .push("Template published", `"${tpl.title}" is live in the gallery.`, "success");
          return tpl;
        } finally {
          set((s) => ({ inFlight: endAction(s.inFlight, key) }));
        }
      },

      useTemplate: async (id) => {
        const tpl = get().templates.find((t) => t.id === id);
        if (!tpl) throw new Error("Template not found.");
        const key = `template:use:${id}`;
        const started = beginAction(get().inFlight, key);
        if (!started) throw new Error("Already applying this template.");
        set({ inFlight: started.map });
        try {
          // Count the use (mock) — never fails the clone if this errors.
          set((s) => ({
            templates: s.templates.map((t) => (t.id === id ? { ...t, uses: t.uses + 1 } : t)),
          }));

          if (tpl.kind === "agent") {
            const agent = await useAgentStore.getState().createAgent({
              name: tpl.title,
              platform: tpl.payload.platform ?? "website",
              instructions: tpl.payload.instructions ?? "",
              permissions: tpl.payload.permissions,
            });
            return { navigate: `/agents/${agent.id}` };
          }
          if (tpl.kind === "style") {
            const tone = (tpl.payload.tone ?? "professional").toLowerCase();
            const mapped = tone.includes("friendly")
              ? ("friendly" as const)
              : tone.includes("concise")
                ? ("concise" as const)
                : ("professional" as const);
            const settingsState = useSettingsStore.getState();
            settingsState.update({ ai: { ...settingsState.ai, tone: mapped } });
            await useMemoryStore.getState().addItem(
              "global",
              `Style: ${tpl.title}`,
              tpl.description
            );
            useNotificationStore
              .getState()
              .push("Style applied", `"${tpl.title}" is now your preferred style.`, "success");
            useActivityStore
              .getState()
              .logEvent("system", `Applied style template "${tpl.title}".`);
            return { navigate: "/chats" };
          }
          // outreach → prefill the campaign builder via URL param
          return { navigate: `/outreach?template=${tpl.id}` };
        } finally {
          set((s) => ({ inFlight: endAction(s.inFlight, key) }));
        }
      },
    }),
    {
      name: "clientx-template-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ templates: s.templates.filter((t) => t.mine) }) as TemplateState,
    }
  )
);

export { KIND_LABEL };
