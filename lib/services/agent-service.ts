import type { Agent, AgentStatus, Approval } from "../types";
import { jitter, nowISO, uid } from "./base";
import { seedAgents } from "../mock-data";

export interface IAgentService {
  fetchAgents(): Promise<Agent[]>;
  setStatus(agentId: string, status: AgentStatus): Promise<void>;
  updateInstructions(agentId: string, text: string): Promise<void>;
  togglePermission(agentId: string, key: string): Promise<boolean>;
  requestApproval(data: {
    agentId: string;
    target: string;
    targetId?: string;
    campaignId?: string;
    action: string;
    message: string;
  }): Promise<Approval>;
  resolveApproval(
    approvalId: string,
    decision: "approved" | "cancelled" | "edited",
    editedText?: string
  ): Promise<void>;
  logActivity(agentId: string, text: string): Promise<void>;
}

export class MockAgentService implements IAgentService {
  async fetchAgents(): Promise<Agent[]> {
    await jitter(150, 350);
    return structuredClone(seedAgents);
  }

  async setStatus(agentId: string, status: AgentStatus): Promise<void> {
    await jitter(100, 250);
  }

  async updateInstructions(agentId: string, text: string): Promise<void> {
    await jitter(200, 400);
  }

  async togglePermission(agentId: string, key: string): Promise<boolean> {
    await jitter(100, 200);
    return true;
  }

  async requestApproval(data: {
    agentId: string;
    target: string;
    targetId?: string;
    campaignId?: string;
    action: string;
    message: string;
  }): Promise<Approval> {
    await jitter(150, 300);
    return {
      id: uid("appr"),
      agentId: data.agentId,
      target: data.target,
      targetId: data.targetId,
      campaignId: data.campaignId,
      action: data.action,
      message: data.message,
      status: "pending",
      createdAt: nowISO(),
    };
  }

  async resolveApproval(
    approvalId: string,
    decision: "approved" | "cancelled" | "edited",
    editedText?: string
  ): Promise<void> {
    await jitter(120, 260);
  }

  async logActivity(agentId: string, text: string): Promise<void> {
    await jitter(60, 150);
  }
}

export const agentService: IAgentService = new MockAgentService();
