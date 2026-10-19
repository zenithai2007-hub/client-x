import type { ActivityEvent, ActivityCategory } from "../types";
import { jitter, nowISO, uid } from "./base";
import { seedActivity } from "../mock-data";

export interface IActivityService {
  fetchEvents(): Promise<ActivityEvent[]>;
  log(category: ActivityCategory, text: string): Promise<ActivityEvent>;
}

export class MockActivityService implements IActivityService {
  async fetchEvents(): Promise<ActivityEvent[]> {
    await jitter(120, 280);
    return structuredClone(seedActivity);
  }

  async log(category: ActivityCategory, text: string): Promise<ActivityEvent> {
    await jitter(60, 140);
    return { id: uid("evt"), time: nowISO(), category, text };
  }
}

export const activityService: IActivityService = new MockActivityService();
