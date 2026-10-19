import type { Campaign, ExecutionStatus, Target, TargetState } from "../types";
import { delay, jitter, nowISO, uid } from "./base";
import { seedCampaigns } from "../mock-data";

export interface NewCampaignData {
  name: string;
  platform: string;
  goal: string;
  tone: string;
  messageStyle: string;
  targetNames: string[];
}

export interface IOutreachService {
  fetchCampaigns(): Promise<Campaign[]>;
  createCampaign(data: NewCampaignData): Promise<Campaign>;
  setStatus(campaignId: string, status: ExecutionStatus): Promise<void>;
  /** Simulates research time before a profile is found. */
  researchTarget(targetId: string): Promise<void>;
  /** Generates a personalized outreach message for a target. */
  draftMessage(targetName: string, goal: string, tone: string): Promise<string>;
  /** Sends the message; occasionally fails to demo the retry flow. */
  sendMessage(target: Target): Promise<void>;
  /** User-verification step (e.g. CAPTCHA) — resolves when the user completes it. */
  waitForVerification(targetId: string): Promise<void>;
  retryTarget(targetId: string): Promise<void>;
}

const FIRST_NAMES = [
  "Ava", "Liam", "Mia", "Noah", "Olivia", "Ethan", "Sophia", "Lucas", "Amelia",
  "James", "Isabella", "Benjamin", "Ella", "Henry", "Chloe", "Alexander",
];
const LAST_INITIALS = ["K.", "R.", "D.", "W.", "M.", "S.", "T.", "H.", "P.", "B.", "N.", "F."];

export class MockOutreachService implements IOutreachService {
  async fetchCampaigns(): Promise<Campaign[]> {
    await jitter(150, 350);
    return structuredClone(seedCampaigns);
  }

  async createCampaign(data: NewCampaignData): Promise<Campaign> {
    await jitter(250, 500);
    const targets: Target[] = data.targetNames.map((name, i) => ({
      id: uid("tgt"),
      name,
      state: "waiting" as TargetState,
      status: "READY" as ExecutionStatus,
      note: i === 2 ? "Demo target — will pause for user verification" : undefined,
    }));
    return {
      id: uid("camp"),
      name: data.name,
      platform: data.platform,
      targets,
      goal: data.goal,
      tone: data.tone,
      messageStyle: data.messageStyle,
      status: "READY",
      createdAt: nowISO(),
    };
  }

  async setStatus(campaignId: string, status: ExecutionStatus): Promise<void> {
    await jitter(100, 200);
  }

  async researchTarget(targetId: string): Promise<void> {
    await delay(600 + Math.random() * 900);
  }

  async draftMessage(targetName: string, goal: string, tone: string): Promise<string> {
    await delay(500 + Math.random() * 700);
    return `Hi ${targetName} — I noticed your work and wanted to reach out. ${goal} Would you be open to a quick chat this week?`;
  }

  async sendMessage(target: Target): Promise<void> {
    await delay(400 + Math.random() * 600);
    // Simulate an occasional failure so the retry path is reachable.
    if (Math.random() < 0.08) {
      throw new Error("Delivery failed — network timeout");
    }
  }

  async waitForVerification(targetId: string): Promise<void> {
    await delay(300);
  }

  async retryTarget(targetId: string): Promise<void> {
    await delay(500);
  }
}

export const outreachService: IOutreachService = new MockOutreachService();

/** Picks a plausible human name for quick campaign seeding. */
export function randomTargetName(used: Set<string>): string {
  for (let i = 0; i < 20; i++) {
    const name = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_INITIALS[Math.floor(Math.random() * LAST_INITIALS.length)]}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  return `Lead ${used.size + 1}`;
}
