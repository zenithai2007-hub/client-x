"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Attribution } from "@/components/growth/attribution";
import { useAgentStore } from "@/stores/use-agent-store";
import { useOutreachStore } from "@/stores/use-outreach-store";
import { useTemplateStore } from "@/stores/use-template-store";
import type { ShareKind } from "@/lib/types";

function ShareContent({ kind, id }: { kind: ShareKind; id: string }) {
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  const loadAgents = useAgentStore((s) => s.load);
  const loadOutreach = useOutreachStore((s) => s.load);
  const loadTemplates = useTemplateStore((s) => s.load);
  const agent = useAgentStore((s) => s.agents.find((a) => a.id === id));
  const campaign = useOutreachStore((s) => s.campaigns.find((c) => c.id === id));
  const template = useTemplateStore((s) => s.templates.find((t) => t.id === id));

  useEffect(() => {
    Promise.all([loadAgents(), loadOutreach(), loadTemplates()]).then(() => setReady(true));
  }, [loadAgents, loadOutreach, loadTemplates]);

  if (!ready) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-slate-400">Loading shared content…</p>
      </Card>
    );
  }

  let title = "Shared from Client X";
  let body: string | undefined;
  let badge: string | undefined;

  if (kind === "output") {
    title = "AI-generated output";
    body = searchParams.get("text") ?? "";
    badge = searchParams.get("label") ?? undefined;
  } else if (kind === "agent" && agent) {
    title = agent.name;
    body = agent.instructions;
    badge = agent.platform;
  } else if (kind === "campaign" && campaign) {
    title = campaign.name;
    body = `${campaign.targets.length} targets · ${campaign.platform} · ${campaign.status}`;
    badge = "Outreach campaign";
  } else if (kind === "template" && template) {
    title = template.title;
    body = template.description;
    badge = "Community template";
  }

  const missing = kind !== "output" && !body;

  return (
    <Card className="p-8">
      <div className="flex items-center gap-3">
        <img src="/logo-face.png" alt="Client X" className="h-11 w-11 rounded-xl object-cover" />
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-400">CLIENT X</p>
          {badge && (
            <Badge tone="purple" className="mt-1">
              {badge}
            </Badge>
          )}
        </div>
      </div>
      <h1 className="mt-4 text-xl font-bold text-slate-900">{missing ? "Content not available" : title}</h1>
      {missing ? (
        <p className="mt-2 text-sm text-slate-500">
          This shared item couldn't be found. It may have been removed.
        </p>
      ) : (
        <div className="mt-3 rounded-2xl  bg-cx-bg shadow-cx-inset-sm/60 p-4">
          {kind === "output" && <Quote size={16} className="mb-2 text-cx-purple" />}
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{body}</p>
        </div>
      )}
      <Link href="/">
        <Button variant="primary-orange" className="mt-6 w-full" icon={<ArrowRight size={15} />}>
          Try Client X free
        </Button>
      </Link>
      <Attribution className="mt-4 text-center" />
    </Card>
  );
}

export default function SharePage({ params }: { params: { kind: ShareKind; id: string } }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E9EDF4] p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Suspense
          fallback={
            <Card className="p-8 text-center">
              <p className="text-sm text-slate-400">Loading…</p>
            </Card>
          }
        >
          <ShareContent kind={params.kind} id={params.id} />
        </Suspense>
      </motion.div>
    </div>
  );
}
