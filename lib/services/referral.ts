/**
 * referral.ts — referral program backend boundary (mock implementation).
 * Holds module-level mock "server" state; the Zustand store mirrors it for
 * reactivity and persists snapshots. Swap for real API calls later.
 */
import type { ReferralReward, ReferralStats } from "@/lib/types";
import { uid, nowISO, delay } from "./base";

export interface ReferralDashboard {
  code: string;
  stats: ReferralStats;
  ledger: ReferralReward[];
}

interface Snapshot {
  code: string;
  stats: ReferralStats;
  ledger: ReferralReward[];
}

const INVITER_CREDITS = 50;
const INVITEE_CREDITS = 25;

function randomCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// Seed: a small realistic history so the dashboard isn't empty.
const db: Snapshot = {
  code: randomCode(),
  stats: { invitesSent: 3, friendsJoined: 1, creditsEarned: 75 },
  ledger: [
    {
      id: uid(),
      text: "Ayesha joined with your invite",
      credits: INVITER_CREDITS,
      time: nowISO(),
    },
    {
      id: uid(),
      text: "Welcome bonus",
      credits: INVITEE_CREDITS,
      time: nowISO(),
    },
  ],
};

function clone(): Snapshot {
  return structuredClone(db);
}

export const referralService = {
  async getDashboard(): Promise<ReferralDashboard> {
    await delay(250);
    return clone();
  },

  /** Restore server state from a persisted client snapshot (post-refresh). */
  hydrate(snapshot: Snapshot): void {
    db.code = snapshot.code;
    db.stats = { ...snapshot.stats };
    db.ledger = [...snapshot.ledger];
  },

  inviteUrl(code: string): string {
    if (typeof window !== "undefined") return `${window.location.origin}/invite/${code}`;
    return `/invite/${code}`;
  },

  async recordInviteSent(channel: string): Promise<Snapshot> {
    await delay(200);
    db.stats.invitesSent += 1;
    db.ledger.unshift({
      id: uid(),
      text: `Invite shared via ${channel}`,
      credits: 0,
      time: nowISO(),
    });
    return clone();
  },

  /** Demo helper — simulates a friend signing up with the invite link. */
  async simulateFriendJoined(name = "New friend"): Promise<Snapshot> {
    await delay(600);
    db.stats.friendsJoined += 1;
    db.stats.creditsEarned += INVITER_CREDITS;
    db.ledger.unshift({
      id: uid(),
      text: `${name} joined with your invite (+${INVITER_CREDITS} credits for you)`,
      credits: INVITER_CREDITS,
      time: nowISO(),
    });
    return clone();
  },

  inviterCredits: INVITER_CREDITS,
  inviteeCredits: INVITEE_CREDITS,
};
