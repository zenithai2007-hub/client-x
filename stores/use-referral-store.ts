"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ReferralReward, ReferralStats } from "@/lib/types";
import { referralService } from "@/lib/services/referral";
import { useActivityStore } from "./use-activity-store";
import { useNotificationStore } from "./use-notification-store";

interface ReferralState {
  code: string;
  stats: ReferralStats;
  ledger: ReferralReward[];
  loaded: boolean;
  load: () => Promise<void>;
  inviteUrl: () => string;
  recordInviteSent: (channel: string) => Promise<void>;
  simulateFriendJoined: () => Promise<void>;
}

export const useReferralStore = create<ReferralState>()(
  persist(
    (set, get) => ({
      code: "",
      stats: { invitesSent: 0, friendsJoined: 0, creditsEarned: 0 },
      ledger: [],
      loaded: false,

      load: async () => {
        if (get().loaded) return;
        // If we have a persisted snapshot, restore the mock backend first.
        const s = get();
        if (s.code) {
          referralService.hydrate({ code: s.code, stats: s.stats, ledger: s.ledger });
        }
        const dash = await referralService.getDashboard();
        set({ code: dash.code, stats: dash.stats, ledger: dash.ledger, loaded: true });
      },

      inviteUrl: () => referralService.inviteUrl(get().code || "CLIENTX"),

      recordInviteSent: async (channel: string) => {
        const snap = await referralService.recordInviteSent(channel);
        set({ stats: snap.stats, ledger: snap.ledger });
        useActivityStore
          .getState()
          .logEvent("system", `Invite link shared via ${channel}.`);
      },

      simulateFriendJoined: async () => {
        const snap = await referralService.simulateFriendJoined();
        set({ stats: snap.stats, ledger: snap.ledger });
        useActivityStore.getState().logEvent("system", "A friend joined with your invite (demo).");
        useNotificationStore
          .getState()
          .push("Referral reward", `You earned ${referralService.inviterCredits} Pro credits.`, "success");
      },
    }),
    {
      name: "clientx-referral-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ code: s.code, stats: s.stats, ledger: s.ledger }) as ReferralState,
    }
  )
);
