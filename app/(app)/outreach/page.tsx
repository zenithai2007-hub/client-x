"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useOutreachStore } from "@/stores/use-outreach-store";
import { Button } from "@/components/ui/button";
import { CampaignBuilder } from "@/components/outreach/campaign-builder";
import { CampaignList } from "@/components/outreach/campaign-list";
import { LiveCampaign } from "@/components/outreach/live-campaign";

export default function OutreachPage() {
  const activeCampaign = useOutreachStore((s) =>
    s.campaigns.find((c) => c.id === s.activeCampaignId) ?? null
  );
  const [mode, setMode] = useState<"live" | "builder">("live");

  const showBuilder = mode === "builder" || !activeCampaign;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Outreach</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Campaigns run target-by-target with approval gates and human verification.
          </p>
        </div>
        {showBuilder && activeCampaign && (
          <Button
            size="sm"
            variant="secondary"
            icon={<ArrowLeft size={14} />}
            onClick={() => setMode("live")}
          >
            Back to live campaign
          </Button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div>
          <CampaignList onNew={() => setMode("builder")} />
        </div>
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {showBuilder ? (
              <motion.div
                key="builder"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <CampaignBuilder onLaunched={() => setMode("live")} />
              </motion.div>
            ) : (
              <motion.div
                key={`live-${activeCampaign!.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <LiveCampaign campaign={activeCampaign!} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
