"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTaskStore } from "@/stores/use-task-store";
import { useAgentStore } from "@/stores/use-agent-store";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea, FieldLabel } from "@/components/ui/input";

export function NewTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createTask = useTaskStore((s) => s.createTask);
  const isInFlight = useTaskStore((s) => s.isInFlight);
  const agents = useAgentStore((s) => s.agents);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);

  const [title, setTitle] = useState("");
  const [agentId, setAgentId] = useState(activeAgentId);
  const [detail, setDetail] = useState("");

  const creating = isInFlight("task:create");
  const valid = title.trim().length > 0;

  const handleCreate = async () => {
    if (!valid) return;
    await createTask(title.trim(), agentId, detail.trim() || undefined);
    setTitle("");
    setDetail("");
    setAgentId(activeAgentId);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New task">
      <div className="space-y-3">
        <div>
          <FieldLabel>Title</FieldLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Follow up with Liam R."
          />
        </div>
        <div>
          <FieldLabel>Agent</FieldLabel>
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full rounded-xl border border-slate-200/70 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-cx-purple focus:outline-none focus:ring-2 focus:ring-cx-purple/15"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Description (optional)</FieldLabel>
          <Textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="What should the agent do?"
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary-orange"
            loading={creating}
            disabled={!valid}
            icon={<Plus size={16} />}
            onClick={handleCreate}
          >
            Create task
          </Button>
        </div>
      </div>
    </Modal>
  );
}
