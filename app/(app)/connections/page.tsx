"use client";

import { useEffect, useState } from "react";
import {
  AtSign, Briefcase, Camera, CheckCircle2, Link2, MessageCircle,
  Plug, Send, ThumbsUp, Unplug,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useConnectionsStore } from "@/stores/use-connections-store";
import { PLATFORMS } from "@/lib/services/connection-service";
import { WhatsAppQRModal } from "@/components/connections/whatsapp-qr-modal";
import { OAuthModal } from "@/components/connections/oauth-modal";
import type { ConnectionPlatform } from "@/lib/types";
import { cn } from "@/lib/cn";

const ICONS: Record<string, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  instagram: Camera,
  linkedin: Briefcase,
  x: AtSign,
  telegram: Send,
  facebook: ThumbsUp,
};

export default function ConnectionsPage() {
  const { connections, loaded, load, statusOf, pairWhatsApp, authorizeOAuth, disconnect } =
    useConnectionsStore();
  const [qrOpen, setQrOpen] = useState(false);
  const [oauthPlatform, setOauthPlatform] = useState<ConnectionPlatform | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const connectedCount = connections.filter((c) => c.status === "connected").length;

  const openConnect = (p: ConnectionPlatform) => {
    if (p.kind === "whatsapp") setQrOpen(true);
    else setOauthPlatform(p);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <Plug size={20} className="text-cx-purple" />
            Connections
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Link the platforms your agents work with. Connect once — Client X handles the rest.
          </p>
        </div>
        <Badge tone={connectedCount > 0 ? "green" : "slate"}>
          {connectedCount} of {PLATFORMS.length} connected
        </Badge>
      </div>

      {!loaded ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {PLATFORMS.map((p) => {
            const conn = statusOf(p.id);
            const connected = conn.status === "connected";
            const Icon = ICONS[p.id] ?? Link2;
            return (
              <Card key={p.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm"
                    style={{ backgroundColor: p.color }}
                  >
                    <Icon size={22} />
                  </span>
                  <Badge tone={connected ? "green" : "slate"}>
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        connected ? "bg-emerald-500" : "bg-slate-400"
                      )}
                    />
                    {connected ? "Connected" : "Not connected"}
                  </Badge>
                </div>

                <h2 className="mt-3 text-[15px] font-semibold text-slate-900">{p.name}</h2>
                <p className="mt-0.5 text-[13px] text-slate-500">{p.tagline}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.capabilities.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                {connected && conn.handle && (
                  <div className="mt-3 space-y-1.5 rounded-xl bg-emerald-50/70 px-3 py-2 text-[13px]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                      <span className="text-slate-500">{p.mockLabel}:</span>
                      <span className="font-semibold text-slate-800">{conn.handle}</span>
                    </div>
                    <p className="pl-[23px] text-[11px] text-slate-400">
                      Last synced{" "}
                      {conn.lastSyncedAt
                        ? new Date(conn.lastSyncedAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "just now"}{" "}
                      · {conn.messageCount ?? 0} messages
                    </p>
                  </div>
                )}

                <div className="mt-4 flex-1" />
                {connected ? (
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full"
                    icon={<Unplug size={15} />}
                    onClick={() => void disconnect(p.id)}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="primary-orange"
                    size="md"
                    className="w-full"
                    icon={<Plug size={15} />}
                    onClick={() => openConnect(p)}
                  >
                    Connect {p.name}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {connectedCount === 0 && loaded && (
        <div className="mt-6">
          <EmptyState
            icon={Plug}
            title="No platforms connected yet"
            description="Connect WhatsApp to let your agents send and receive real-style messages, or link a social account for outreach."
            action={
              <Button variant="primary-orange" size="md" onClick={() => setQrOpen(true)}>
                Connect WhatsApp
              </Button>
            }
          />
        </div>
      )}

      <WhatsAppQRModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        onPaired={(phone) => pairWhatsApp(phone)}
      />
      <OAuthModal
        platform={oauthPlatform}
        open={!!oauthPlatform}
        onClose={() => setOauthPlatform(null)}
        onAuthorized={(id) => authorizeOAuth(id)}
      />
    </div>
  );
}
