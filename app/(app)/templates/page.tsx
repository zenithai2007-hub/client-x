"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, LayoutTemplate, Megaphone, Plus, Search, Star, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { PublishModal } from "@/components/growth/publish-modal";
import { ShareButton } from "@/components/growth/share-menu";
import { useTemplateStore, KIND_LABEL } from "@/stores/use-template-store";
import { useUIStore } from "@/stores/use-ui-store";
import type { CommunityTemplate, TemplateKind } from "@/lib/types";
import { timeAgo } from "@/components/activity/format-time";

const KIND_ICON: Record<TemplateKind, React.ReactNode> = {
  agent: <Bot size={16} />,
  style: <Wand2 size={16} />,
  outreach: <Megaphone size={16} />,
};

function formatUses(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

function TemplateCard({ tpl }: { tpl: CommunityTemplate }) {
  const router = useRouter();
  const useTemplate = useTemplateStore((s) => s.useTemplate);
  const isInFlight = useTemplateStore((s) => s.isInFlight);
  const [busy, setBusy] = useState(false);
  const applying = busy || isInFlight(`template:use:${tpl.id}`);

  const apply = async () => {
    setBusy(true);
    try {
      const { navigate } = await useTemplate(tpl.id);
      router.push(navigate);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card className="flex h-full flex-col p-4 transition-shadow hover:shadow-cx-pop">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cx-purpleLight text-cx-purple">
            {KIND_ICON[tpl.kind]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{tpl.title}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone="purple">{KIND_LABEL[tpl.kind]}</Badge>
              {tpl.mine && <Badge tone="green">Yours</Badge>}
            </div>
          </div>
          <ShareButton
            kind="template"
            title={tpl.title}
            extra={tpl.description}
            sharePath={`/share/template/${tpl.id}`}
            size="icon"
          />
        </div>
        <p className="mt-3 line-clamp-2 flex-1 text-[13px] leading-relaxed text-slate-500">
          {tpl.description}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Avatar name={tpl.author} size="sm" />
          <p className="truncate text-xs text-slate-500">{tpl.author}</p>
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-slate-600">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            {tpl.rating.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400">{formatUses(tpl.uses)} uses</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-[11px] text-slate-400">{timeAgo(tpl.createdAt)}</span>
          <Button size="sm" variant="primary-orange" onClick={apply} loading={applying}>
            Use this template
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export default function TemplatesPage() {
  const setActiveNav = useUIStore((s) => s.setActiveNav);
  const { templates, loaded, load, search } = useTemplateStore();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<TemplateKind | "all">("all");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishKind, setPublishKind] = useState<TemplateKind>("agent");

  useEffect(() => {
    setActiveNav("templates");
    load();
  }, [setActiveNav, load]);

  const tabs: TabItem[] = useMemo(
    () => [
      { key: "all", label: "All" },
      { key: "agent", label: "Agent setups" },
      { key: "style", label: "Styles" },
      { key: "outreach", label: "Outreach" },
    ],
    []
  );

  const results = useMemo(
    () => (loaded ? search(query, kind) : []),
    [loaded, search, query, kind]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Community templates</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Agent setups, styles and outreach playbooks shared by the community. One click to use.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus size={14} />}
            onClick={() => {
              setPublishKind("agent");
              setPublishOpen(true);
            }}
          >
            Publish
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates, authors…"
            className="pl-9"
          />
        </div>
        <Tabs tabs={tabs} active={kind} onChange={(k) => setKind(k as TemplateKind | "all")} />
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates found"
          description="Try a different search — or publish the first one in this category."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((tpl) => (
            <TemplateCard key={tpl.id} tpl={tpl} />
          ))}
        </div>
      )}

      <PublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        kind={publishKind}
        payload={{}}
      />
    </div>
  );
}
