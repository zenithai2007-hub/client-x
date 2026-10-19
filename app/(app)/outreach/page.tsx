"use client";

import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useOutreachStore } from "@/stores/use-outreach-store";
import { useTemplateStore } from "@/stores/use-template-store";
import { Button } from "@/components/ui/button";
import { CampaignBuilder, type BuilderInitial } from "@/components/outreach/campaign-builder";
import { CampaignList } from "@/components/outreach/campaign-list";
import { LiveCampaign } from "@/components/outreach/live-campaign";

function platformLabel(p?: string): string {
  const v = (p ?? "website").toLowerCase();
  if (v === "linkedin") return "LinkedIn";
  if (v === "website") return "Website";
  return "Other";
}

function OutreachInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeCampaign = useOutreachStore((s) =>
    s.campaigns.find((c) => c.id === s.activeCampaignId) ?? null
  );
  const loadTemplates = useTemplateStore((s) => s.load);
  const [mode, setMode] = useState<"live" | "builder">("live");
  const [initial, setInitial] = useState<BuilderInitial | undefined>(undefined);

  const templateId = searchParams.get("template");

  useEffect(() => {
    if (!templateId) return;
    let cancelled = false;
    (async () => {
      await loadTemplates();
      if (cancelled) return;
      const tpl = useTemplateStore.getState().templates.find((t) => t.id === templateId);
      if (tpl && tpl.kind === "outreach") {
        setInitial({
          name: tpl.title,
          platform: platformLabel(tpl.payload.platform),
          targets: tpl.payload.targets?.length ? tpl.payload.targets : undefined,
          goal: tpl.payload.goal,
          tone: tpl.payload.tone,
          messageStyle: tpl.payload.messageStyle,
        });
        setMode("builder");
      }
      // Consume the param so refresh doesn't re-apply the template.
      router.replace(pathname);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

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
                <CampaignBuilder initial={initial} onLaunched={() => setMode("live")} />
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

export default function OutreachPage() {
  return (
    <Suspense>
      <OutreachInner />
    </Suspense>
  );
}
