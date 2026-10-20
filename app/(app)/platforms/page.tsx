"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AtSign, Briefcase, Camera, ExternalLink, Globe2, MessageCircle,
  Plug, PlugZap, Search, Settings2, Send, ThumbsUp, Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useConnectionsStore } from "@/stores/use-connections-store";
import {
  PLATFORM_REGISTRY,
  platformsByCategory,
  getPlatform,
  AVAILABILITY_LABEL,
  AVAILABILITY_DESCRIPTION,
} from "@/lib/platforms";
import type { PlatformAvailability, PlatformEntry } from "@/lib/platforms/types";
import { cn } from "@/lib/cn";

const AVAILABILITY_TONE: Record<PlatformAvailability, "purple" | "blue" | "amber" | "slate" | "red"> = {
  supported: "purple",
  "oauth-available": "purple",
  "api-available": "blue",
  "requires-configuration": "amber",
  "coming-soon": "slate",
  unavailable: "red",
};

const ICONS: Record<string, typeof MessageCircle> = {
  linkedin: Briefcase,
  x: AtSign,
  facebook: ThumbsUp,
  instagram: Camera,
  threads: AtSign,
  whatsapp: MessageCircle,
  upwork: Briefcase,
  reddit: MessageCircle,
  discord: MessageCircle,
  telegram: Send,
  slack: Users,
  "slack-communities": Users,
  "google-business": Globe2,
  "google-maps": Globe2,
  yelp: Globe2,
};

function PlatformIcon({ p }: { p: PlatformEntry }) {
  const Icon = ICONS[p.id] ?? PlugZap;
  return (
    <span
      className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm"
      style={{ backgroundColor: p.color }}
      aria-hidden
    >
      <Icon size={20} />
    </span>
  );
}

export default function PlatformsPage() {
  const { loaded, load, requestConnect, statusOf } = useConnectionsStore();
  const [query, setQuery] = useState("");
  const [connectPlatform, setConnectPlatform] = useState<PlatformEntry | null>(null);
  const [connectState, setConnectState] = useState<"idle" | "working" | "failed">("idle");
  const [connectError, setConnectError] = useState<string>("");
  const [settingsPlatform, setSettingsPlatform] = useState<PlatformEntry | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return platformsByCategory();
    return platformsByCategory()
      .map((g) => ({
        category: g.category,
        platforms: g.platforms.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.platforms.length > 0);
  }, [query]);

  const totalCount = groups.reduce((n, g) => n + g.platforms.length, 0);

  const openConnect = (p: PlatformEntry) => {
    setConnectPlatform(p);
    setConnectState("idle");
    setConnectError("");
  };

  const tryConnect = async () => {
    if (!connectPlatform) return;
    setConnectState("working");
    const result = await requestConnect(connectPlatform.id);
    // result.ok is never true — no real integrations are configured.
    if (result.ok) {
      setConnectState("idle");
    } else {
      setConnectError(result.error ?? "Connection unavailable.");
      setConnectState("failed");
    }
  };

  const openWebsite = (p: PlatformEntry) => {
    window.open(`https://${p.website}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <Plug size={20} className="text-cx-purple" />
            Platforms
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            The platform ecosystem Client X can work with. No integrations are
            configured on this workspace yet — everything is listed for discovery.
          </p>
        </div>
        <Badge tone="purple">{PLATFORM_REGISTRY.length} platforms</Badge>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search platforms…"
          className="pl-10"
        />
      </div>

      {!loaded ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <EmptyState
          icon={Plug}
          title="No platforms match your search"
          description="Try a different name or browse the categories below."
          action={
            <Button variant="secondary" size="md" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.category} aria-label={group.category}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {group.category}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {group.platforms.map((p) => {
                  const conn = statusOf(p.id);
                  const notConnected = conn.status !== "connected"; // always true today
                  return (
                    <Card key={p.id} className="flex flex-col p-5">
                      <div className="flex items-start justify-between gap-2">
                        <PlatformIcon p={p} />
                        <div className="flex flex-col items-end gap-1.5">
                          <Badge tone={AVAILABILITY_TONE[p.availability]}>
                            {AVAILABILITY_LABEL[p.availability]}
                          </Badge>
                          <Badge tone="slate">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            {notConnected ? "Not connected" : "Not connected"}
                          </Badge>
                        </div>
                      </div>

                      <h3 className="mt-3 text-[15px] font-semibold text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-400">{p.category}</p>
                      <p className="mt-1 text-[13px] text-slate-500">{p.description}</p>

                      <div className="mt-4 flex-1" />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="primary-orange"
                          size="sm"
                          className="flex-1"
                          icon={<Plug size={14} />}
                          onClick={() => openConnect(p)}
                        >
                          Connect
                        </Button>
                        {p.canOpen && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<ExternalLink size={14} />}
                            onClick={() => openWebsite(p)}
                          >
                            Open
                          </Button>
                        )}
                        {p.requiredConfig?.length ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Settings2 size={14} />}
                            onClick={() => setSettingsPlatform(p)}
                            aria-label={`${p.name} settings`}
                          >
                            Settings
                          </Button>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ---- Honest connection dialog ---- */}
      <Modal
        open={!!connectPlatform}
        onClose={() => setConnectPlatform(null)}
        title={connectPlatform ? `Connect ${connectPlatform.name}` : undefined}
        className="max-w-sm"
      >
        {connectPlatform && (
          <div>
            <div className="flex items-center gap-3">
              <PlatformIcon p={connectPlatform} />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-900">{connectPlatform.name}</p>
                <p className="text-xs text-slate-500">
                  <Badge tone={AVAILABILITY_TONE[connectPlatform.availability]}>
                    {AVAILABILITY_LABEL[connectPlatform.availability]}
                  </Badge>
                </p>
              </div>
            </div>

            <p className="mt-4 text-[13px] leading-relaxed text-slate-600">
              {AVAILABILITY_DESCRIPTION[connectPlatform.availability]}
            </p>

            {connectState === "working" && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-cx-bg px-3.5 py-3 shadow-cx-inset-sm text-[13px] text-slate-600">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-cx-purple" />
                Checking integration status…
              </div>
            )}

            {connectState === "failed" && (
              <div className="mt-4 rounded-2xl bg-red-50 px-3.5 py-3 text-[13px] text-red-700">
                <p className="font-semibold">Connection unavailable</p>
                <p className="mt-0.5">{connectError}</p>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              {connectState === "failed" ? (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    onClick={() => {
                      setConnectState("idle");
                      setConnectError("");
                      void tryConnect();
                    }}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    className="flex-1"
                    onClick={() => setConnectPlatform(null)}
                  >
                    Back
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="primary-orange"
                    size="md"
                    className="flex-1"
                    loading={connectState === "working"}
                    onClick={() => void tryConnect()}
                  >
                    Try to connect
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    className={cn("flex-1")}
                    onClick={() => setConnectPlatform(null)}
                  >
                    Back
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ---- Settings explainer ---- */}
      <Modal
        open={!!settingsPlatform}
        onClose={() => setSettingsPlatform(null)}
        title={settingsPlatform ? `${settingsPlatform.name} — configuration` : undefined}
        className="max-w-sm"
      >
        {settingsPlatform && (
          <div>
            <p className="text-[13px] leading-relaxed text-slate-600">
              An official integration for {settingsPlatform.name} would need a
              workspace admin to configure these settings first:
            </p>
            <div className="mt-3 rounded-2xl bg-cx-bg px-3.5 py-3 shadow-cx-inset-sm">
              <ul className="space-y-1.5 font-mono text-[12px] text-slate-700">
                {(settingsPlatform.requiredConfig ?? []).map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <p className="mt-2 font-sans text-[11px] text-slate-400">
                Setting names only — no values are stored or shown here. A
                workspace admin must configure them before connecting.
              </p>
            </div>
            <p className="mt-3 text-[13px] text-slate-500">
              Connection status: <span className="font-semibold text-slate-700">Not connected</span> —
              no real integrations are configured yet.
            </p>
            <div className="mt-5">
              <Button variant="secondary" size="md" className="w-full" onClick={() => setSettingsPlatform(null)}>
                Got it
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
