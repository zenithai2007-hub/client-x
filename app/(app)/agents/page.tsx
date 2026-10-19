"use client";

import { Bot } from "lucide-react";
import { useAgentStore } from "@/stores/use-agent-store";
import { EmptyState } from "@/components/ui/empty-state";
import { AgentCard } from "@/components/agents/agent-card";

export default function AgentsPage() {
  const agents = useAgentStore((s) => s.agents);

  const active = agents.filter((a) => a.status === "active").length;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Agents</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {agents.length} agents · {active} active
          </p>
        </div>
      </div>

      {agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No agents yet"
          description="Your platform agents will appear here once they are set up."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent, i) => (
            <AgentCard key={agent.id} agent={agent} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
