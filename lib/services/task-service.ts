import type { ClientTask, ExecutionStatus } from "../types";
import { jitter, nowISO, uid } from "./base";
import { seedTasks } from "../mock-data";

export interface ITaskService {
  fetchTasks(): Promise<ClientTask[]>;
  createTask(data: { title: string; agentId: string; total?: number; detail?: string }): Promise<ClientTask>;
  setStatus(taskId: string, status: ExecutionStatus): Promise<void>;
  updateProgress(taskId: string, progress: number): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
}

export class MockTaskService implements ITaskService {
  async fetchTasks(): Promise<ClientTask[]> {
    await jitter(150, 300);
    return structuredClone(seedTasks);
  }

  async createTask(data: {
    title: string;
    agentId: string;
    total?: number;
    detail?: string;
  }): Promise<ClientTask> {
    await jitter(200, 400);
    return {
      id: uid("task"),
      title: data.title,
      agentId: data.agentId,
      status: "READY",
      progress: 0,
      total: data.total ?? 100,
      createdAt: nowISO(),
      detail: data.detail,
    };
  }

  async setStatus(taskId: string, status: ExecutionStatus): Promise<void> {
    await jitter(100, 200);
  }

  async updateProgress(taskId: string, progress: number): Promise<void> {
    await jitter(60, 140);
  }

  async deleteTask(taskId: string): Promise<void> {
    await jitter(100, 200);
  }
}

export const taskService: ITaskService = new MockTaskService();
