"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Gift, Mail, MessageCircle, Send, Share2, Sparkles, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useReferralStore } from "@/stores/use-referral-store";
import { useUIStore } from "@/stores/use-ui-store";
import { referralService } from "@/lib/services/referral";
import { openShare, canSystemShare, copyText, systemShare, type ShareChannel } from "@/lib/services/sharing";
import { timeAgo } from "@/components/activity/format-time";

const CHANNELS: { key: ShareChannel; label: string; icon: React.ReactNode }[] = [
  { key: "whatsapp", label: "WhatsApp", icon: <MessageCircle size={16} /> },
  { key: "x", label: "X", icon: <Share2 size={16} /> },
  { key: "linkedin", label: "LinkedIn", icon: <Share2 size={16} /> },
  { key: "telegram", label: "Telegram", icon: <Send size={16} /> },
  { key: "email", label: "Email", icon: <Mail size={16} /> },
];

export default function ReferralsPage() {
  const { code, stats, ledger, loaded, load, inviteUrl, recordInviteSent, simulateFriendJoined } =
    useReferralStore();
  const setActiveNav = useUIStore((s) => s.setActiveNav);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveNav("referrals");
    load();
  }, [setActiveNav, load]);

  const link = inviteUrl();
  const shareText = `I'm using Client X — an AI agent that handles my chats, outreach and writing for me. Join with my invite and we both earn Pro credits.\n\nMade with Client X`;

  const copyLink = async () => {
    const ok = await copyText(link);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const shareVia = async (channel: ShareChannel) => {
    openShare(channel, { title: "Join me on Client X", text: shareText, url: link });
    await recordInviteSent(channel === "x" ? "X" : channel[0].toUpperCase() + channel.slice(1));
  };

  const systemShareLink = async () => {
    const res = await systemShare({ title: "Join me on Client X", text: shareText, url: link });
    if (res !== "unavailable") await recordInviteSent("System share");
  };

  const stats3 = [
    { label: "Invites sent", value: stats.invitesSent, icon: <Send size={18} /> },
    { label: "Friends joined", value: stats.friendsJoined, icon: <Users size={18} /> },
    { label: "Credits earned", value: stats.creditsEarned, icon: <Sparkles size={18} /> },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Referrals</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Invite friends to Client X — you both earn Pro credits when they join.
        </p>
      </div>

      {/* Invite link card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-cx-purple/25 bg-gradient-to-b from-cx-purpleLight/50 to-white p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cx-purple text-white">
              <Gift size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">Your invite link</p>
              <p className="text-xs text-slate-500">
                Friends get {referralService.inviteeCredits} credits · you get{" "}
                {referralService.inviterCredits} per join
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5">
              <code className="flex-1 truncate text-sm font-medium text-slate-700">{link}</code>
              <Badge tone="purple">/{code || "······"}</Badge>
            </div>
            <Button
              variant="primary-orange"
              icon={copied ? <Check size={15} /> : <Copy size={15} />}
              onClick={copyLink}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <Button key={c.key} size="sm" variant="secondary" icon={c.icon} onClick={() => shareVia(c.key)}>
                {c.label}
              </Button>
            ))}
            {canSystemShare() && (
              <Button size="sm" variant="ghost" icon={<Share2 size={14} />} onClick={systemShareLink}>
                More…
              </Button>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats3.map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-cx-purpleLight text-cx-purple">
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Rewards ledger */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Rewards</h2>
          <button
            onClick={simulateFriendJoined}
            className="text-xs font-medium text-slate-400 hover:text-cx-purple hover:underline"
            title="Demo helper"
          >
            Demo: simulate a friend joining
          </button>
        </div>
        {ledger.length === 0 ? (
          <EmptyState
            title="No rewards yet"
            description="Share your invite link — you'll earn credits for every friend who joins."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {ledger.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Gift size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{r.text}</p>
                  <p className="text-[11px] text-slate-400">{timeAgo(r.time)}</p>
                </div>
                {r.credits > 0 && (
                  <Badge tone="green">+{r.credits} credits</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* How it works */}
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-bold text-slate-900">How it works</h2>
        <ol className="space-y-2.5">
          {[
            "Share your invite link with a friend.",
            `They join Client X and instantly get ${referralService.inviteeCredits} Pro credits.`,
            `You earn ${referralService.inviterCredits} Pro credits for every friend who joins.`,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cx-purpleLight text-xs font-bold text-cx-purple">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
