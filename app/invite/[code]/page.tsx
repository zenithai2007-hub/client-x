"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Gift, MessageSquare, Sparkles, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { referralService } from "@/lib/services/referral";

export default function InvitePage({ params }: { params: { code: string } }) {
  const [claimed, setClaimed] = useState(false);
  const code = params.code?.toUpperCase() ?? "CLIENTX";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E9EDF4] p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 text-center">
          <img
            src="/logo-face.png"
            alt="Client X"
            className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-cx-card"
          />
          <p className="mt-4 text-[13px] font-bold tracking-widest text-slate-400">CLIENT X</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {claimed ? "Welcome aboard!" : "You've been invited"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {claimed
              ? `Invite code ${code} accepted — ${referralService.inviteeCredits} Pro credits were added to your new workspace.`
              : `A friend invited you to Client X — the AI agent that handles your chats, outreach and writing. Join now and get ${referralService.inviteeCredits} Pro credits free.`}
          </p>

          {!claimed ? (
            <>
              <div className="mt-6 space-y-2.5 text-left">
                {[
                  { icon: <MessageSquare size={15} />, text: "AI replies in your style, on every platform" },
                  { icon: <Zap size={15} />, text: "Outreach campaigns with approval gates" },
                  { icon: <Sparkles size={15} />, text: "One-click templates from the community" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cx-purpleLight text-cx-purple">
                      {f.icon}
                    </span>
                    {f.text}
                  </div>
                ))}
              </div>
              <Button
                variant="primary-orange"
                size="lg"
                className="mt-6 w-full"
                icon={<Gift size={16} />}
                onClick={() => setClaimed(true)}
              >
                Claim invite · +{referralService.inviteeCredits} credits
              </Button>
              <p className="mt-3 text-[11px] text-slate-400">
                Invite code <span className="font-mono font-semibold text-slate-500">{code}</span>
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check size={26} />
              </div>
              <Link href="/">
                <Button variant="primary-orange" size="lg" className="mt-6 w-full">
                  Open Client X
                </Button>
              </Link>
            </>
          )}
        </Card>
        <p className="mt-4 text-center text-[11px] text-slate-400">
          Made with <span className="font-semibold text-cx-purple">Client X</span>
        </p>
      </motion.div>
    </div>
  );
}
