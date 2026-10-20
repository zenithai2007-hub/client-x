"use client";

import { Plus } from "lucide-react";
import { useOutreachStore } from "@/stores/use-outreach-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";

export function CampaignList({ onNew }: { onNew: () => void }) {
  const campaigns = useOutreachStore((s) => s.campaigns);
  const activeCampaignId = useOutreachStore((s) => s.activeCampaignId);

  /* Store gap (reported): no setActiveCampaign action exists.
     Workaround: set the id directly — no nested mutation. */
  const select = (id: string) =>
    useOutreachStore.setState({ activeCampaignId: id });

  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-slate-900">Campaigns</h2>
        <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={onNew}>
          New
        </Button>
      </div>
      {campaigns.length === 0 ? (
        <p className="px-1 py-4 text-center text-xs text-slate-400">
          No campaigns yet — build your first one.
        </p>
      ) : (
        <div className="space-y-1.5">
          {campaigns.map((c) => {
            const isActive = c.id === activeCampaignId;
            const done = c.targets.filter((t) => t.status === "COMPLETED").length;
            return (
              <button
                key={c.id}
                onClick={() => select(c.id)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-colors",
                  isActive
                    ? "border-cx-purple/40 bg-cx-purpleLight/40"
                    : "border-white/50 hover:border-white/50 hover:bg-cx-bg shadow-cx-inset-sm"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-slate-900">{c.name}</p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {c.platform} · {done}/{c.targets.length} sent
                </p>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
