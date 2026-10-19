import type { MemoryItem, MemorySection } from "../types";
import { jitter, nowISO, uid } from "./base";
import { seedMemory } from "../mock-data";

export interface IMemoryService {
  fetchItems(): Promise<MemoryItem[]>;
  addItem(section: MemorySection, key: string, value: string): Promise<MemoryItem>;
  updateItem(id: string, patch: Partial<Pick<MemoryItem, "key" | "value">>): Promise<void>;
  deleteItem(id: string): Promise<void>;
}

export class MockMemoryService implements IMemoryService {
  async fetchItems(): Promise<MemoryItem[]> {
    await jitter(120, 280);
    return structuredClone(seedMemory);
  }

  async addItem(section: MemorySection, key: string, value: string): Promise<MemoryItem> {
    await jitter(150, 300);
    return { id: uid("mem"), section, key, value, updatedAt: nowISO() };
  }

  async updateItem(id: string, patch: Partial<Pick<MemoryItem, "key" | "value">>): Promise<void> {
    await jitter(120, 260);
  }

  async deleteItem(id: string): Promise<void> {
    await jitter(100, 200);
  }
}

export const memoryService: IMemoryService = new MockMemoryService();
