"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Square,
  X,
} from "lucide-react";
import type { Campaign, Target, TargetState } from "@/lib/types";
import { PIPELINE_ORDER } from "@/lib/execution";
import { useOutreachStore } from "@/stores/use-outreach-store";
import { useAgentStore } from "@/stores/use-agent-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/input";
import { VerificationCard } from "@/components/ui/verification-card";
import { ShareButton } from "@/components/growth/share-menu";
import { PublishModal } from "@/components/growth/publish-modal";
import { ShareNudge } from "@/components/growth/attribution";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Pipeline step checklist                                             */
/* ------------------------------------------------------------------ */

const STEPS: { key: TargetState; label: string }[] = [
  { key: "searching", label: "Searching" },
  { key: "profile_found", label: "Profile found" },
  { key: "reviewing", label: "Reviewing" },
  { key: "generating", label: "Generating" },
  { key: "waiting_approval", label: "Waiting for approval" },
  { key: "executing", label: "Executing" },
  { key: "completed", label: "Completed" },
];

/** Where the target is in the linear pipeline (best-effort for off-path states). */
function stepIndex(t: Target): { index: number; failed: boolean } {
  const idx = PIPELINE_ORDER.indexOf(t.state);
  if (idx >= 0) return { index: idx, failed: false };
  if (t.state === "failed") {
    return { index: Math.max(0, PIPELINE_ORDER.indexOf(t.retryFrom ?? "executing")), failed: true };
  }
  if (t.state === "waiting_for_user") {
    return { index: Math.max(0, PIPELINE_ORDER.indexOf(t.resumeFrom ?? "executing")), failed: false };
  }
  return { index: 0, failed: false };
}

function StepChecklist({ target }: { target: Target }) {
  const { index, failed } = stepIndex(target);
  const terminal = target.status === "COMPLETED" || target.status === "FAILED";

  return (
    <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {STEPS.map((step, i) => {
        const done = i < index || (terminal && target.status === "COMPLETED");
        const current = i === index && !terminal;
        const failedHere = failed && i === index && terminal;
        return (
          <li key={step.key} className="flex items-center gap-2">
            {i > 0 && <span className="h-px w-3 bg-slate-200" aria-hidden />}
            <motion.span
              layout
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                done && "bg-emerald-50 text-emerald-700",
                current && "bg-cx-purpleLight text-cx-purpleDark",
                failedHere && "bg-red-50 text-red-700",
                !done && !current && !failedHere && "bg-slate-100 text-slate-400"
              )}
            >
              {done ? (
                <Check size={11} />
              ) : (
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    current && "animate-pulse bg-cx-purple",
                    failedHere && "bg-red-500",
                    !current && !failedHere && "bg-slate-300"
                  )}
                />
              )}
              {step.label}
            </motion.span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Approval card — Edit / Approve / Cancel via the agent store          */
/* ------------------------------------------------------------------ */

function ApprovalCard({ campaignId, target }: { campaignId: string; target: Target }) {
  const approvals = useAgentStore((s) => s.approvals);
  const resolveApproval = useAgentStore((s) => s.resolveApproval);
  const isInFlight = useAgentStore((s) => s.isInFlight);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const approval = target.approvalId
    ? approvals.find((a) => a.id === target.approvalId && a.status === "pending")
    : undefined;

  if (!approval) return null;
  const busy = isInFlight(`approval:${approval.id}:resolve`);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 rounded-xl border border-cx-purple/25 bg-cx-purpleLight/30 p-3"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-cx-purpleDark">
          Approval needed
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          {approval.editedText ?? approval.message}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="primary-orange"
            loading={busy}
            icon={<Check size={14} />}
            onClick={() => resolveApproval(approval.id, "approved")}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Pencil size={14} />}
            onClick={() => {
              setDraft(approval.editedText ?? approval.message);
              setEditing(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:bg-red-50"
            icon={<X size={14} />}
            onClick={() => resolveApproval(approval.id, "cancelled")}
          >
            Cancel
          </Button>
        </div>
      </motion.div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit message">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          placeholder="Message to send…"
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button
            variant="primary-orange"
            loading={busy}
            icon={<Check size={14} />}
            onClick={async () => {
              await resolveApproval(approval.id, "edited", draft.trim() || approval.message);
              setEditing(false);
            }}
          >
            Save & approve
          </Button>
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Single target row                                                   */
/* ------------------------------------------------------------------ */

const PLATFORM_URLS: Record<string, string> = {
  LinkedIn: "https://www.linkedin.com",
  Website: "https://www.google.com",
  Other: "https://www.google.com",
};

function TargetRow({ campaign, target }: { campaign: Campaign; target: Target }) {
  const retryTarget = useOutreachStore((s) => s.retryTarget);
  const flagTargetVerification = useOutreachStore((s) => s.flagTargetVerification);
  const confirmTargetVerification = useOutreachStore((s) => s.confirmTargetVerification);
  const resumeTargetAfterVerification = useOutreachStore((s) => s.resumeTargetAfterVerification);
  const pauseCampaign = useOutreachStore((s) => s.pauseCampaign);
  const resumeCampaign = useOutreachStore((s) => s.resumeCampaign);
  const stopCampaign = useOutreachStore((s) => s.stopCampaign);
  const isInFlight = useOutreachStore((s) => s.isInFlight);

  const waitingForUser = target.status === "WAITING_FOR_USER";
  const failed = target.status === "FAILED";

  const handleResume = async () => {
    await resumeTargetAfterVerification(campaign.id, target.id);
    const fresh = useOutreachStore.getState().campaigns.find((c) => c.id === campaign.id);
    if (fresh?.status === "PAUSED") {
      await resumeCampaign(campaign.id);
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{target.name}</p>
            {target.note && <p className="mt-0.5 text-[11px] text-slate-400">{target.note}</p>}
          </div>
          <StatusBadge status={target.status} attempt={target.attempt} />
        </div>

        <StepChecklist target={target} />

        {target.message && target.state !== "waiting" && target.state !== "searching" && (
          <p className="mt-3 line-clamp-2 rounded-xl bg-slate-50 p-2.5 text-xs italic text-slate-500">
            “{target.message}”
          </p>
        )}

        {target.state === "waiting_approval" && target.awaitingApproval && (
          <ApprovalCard campaignId={campaign.id} target={target} />
        )}

        {failed && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-red-50/60 p-3">
            <p className="flex-1 text-xs text-red-700">{target.error ?? "Send failed."}</p>
            <Button
              size="sm"
              variant="secondary"
              loading={isInFlight(`target:${target.id}:retry`)}
              icon={<RotateCcw size={14} />}
              onClick={() => retryTarget(campaign.id, target.id)}
            >
              Retry{target.attempt ? ` (attempt ${target.attempt}/3)` : ""}
            </Button>
          </div>
        )}

        {waitingForUser && (
          <div className="mt-3">
            <VerificationCard
              phase={target.verificationConfirmed ? "confirmed" : "pending"}
              contextTitle={`${target.name} — ${campaign.name}`}
              platformUrl={PLATFORM_URLS[campaign.platform] ?? PLATFORM_URLS.Other}
              onOpenPlatform={() =>
                window.open(PLATFORM_URLS[campaign.platform] ?? PLATFORM_URLS.Other, "_blank", "noopener")
              }
              onConfirm={() => confirmTargetVerification(campaign.id, target.id)}
              onPause={() => pauseCampaign(campaign.id)}
              onCancel={() => stopCampaign(campaign.id)}
              onResume={handleResume}
            />
          </div>
        )}

        {/* Demo helper: force the verification flow on any live target */}
        {!waitingForUser && !failed && target.status === "RUNNING" && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => flagTargetVerification(campaign.id, target.id)}
              className="text-[11px] text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
            >
              Simulate platform verification challenge
            </button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Live campaign view                                                  */
/* ------------------------------------------------------------------ */

export function LiveCampaign({ campaign }: { campaign: Campaign }) {
  const pauseCampaign = useOutreachStore((s) => s.pauseCampaign);
  const resumeCampaign = useOutreachStore((s) => s.resumeCampaign);
  const stopCampaign = useOutreachStore((s) => s.stopCampaign);
  const isInFlight = useOutreachStore((s) => s.isInFlight);
  const [publishOpen, setPublishOpen] = useState(false);

  const total = campaign.targets.length;
  const done = campaign.targets.filter((t) => t.status === "COMPLETED").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const running = campaign.status === "RUNNING";
  const paused = campaign.status === "PAUSED";
  const terminal = ["COMPLETED", "CANCELLED", "FAILED"].includes(campaign.status);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">{campaign.name}</h2>
              <StatusBadge status={campaign.status} attempt={campaign.attempt} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {campaign.platform} · {campaign.tone} · {campaign.messageStyle} · {done}/{total}{" "}
              sent
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {running && (
              <Button
                size="sm"
                variant="secondary"
                loading={isInFlight(`campaign:${campaign.id}:pause`)}
                icon={<Pause size={14} />}
                onClick={() => pauseCampaign(campaign.id)}
              >
                Pause
              </Button>
            )}
            {paused && (
              <Button
                size="sm"
                variant="secondary"
                loading={isInFlight(`campaign:${campaign.id}:resume`)}
                icon={<Play size={14} />}
                onClick={() => resumeCampaign(campaign.id)}
              >
                Resume
              </Button>
            )}
            {!terminal && (
              <Button
                size="sm"
                variant="danger"
                loading={isInFlight(`campaign:${campaign.id}:stop`)}
                icon={<Square size={14} />}
                onClick={() => stopCampaign(campaign.id)}
              >
                Stop
              </Button>
            )}
            <ShareButton
              kind="campaign"
              title={campaign.name}
              sharePath={`/share/campaign/${campaign.id}`}
            />
            <Button size="sm" variant="ghost" onClick={() => setPublishOpen(true)}>
              Save as template
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">Overall progress</span>
            <span className="text-xs font-medium tabular-nums text-slate-700">{pct}%</span>
          </div>
          <ProgressBar value={pct} className="mt-1.5" />
        </div>

        {campaign.status === "COMPLETED" && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 size={16} />
              Campaign completed — all targets reached a terminal state.
            </div>
            <ShareNudge
              text="This workflow worked well?"
              href="/templates"
            />
          </div>
        )}
      </Card>

      <div className="grid gap-3">
        {campaign.targets.map((t) => (
          <TargetRow key={t.id} campaign={campaign} target={t} />
        ))}
      </div>
      <PublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        kind="outreach"
        initialTitle={campaign.name}
        initialDescription={`Outreach playbook: ${campaign.goal || campaign.platform} (${campaign.tone}).`}
        payload={{
          platform: (["linkedin", "whatsapp", "instagram", "browser", "website"] as const).includes(
            campaign.platform.toLowerCase() as "linkedin"
          )
            ? (campaign.platform.toLowerCase() as "linkedin" | "whatsapp" | "instagram" | "browser" | "website")
            : "website",
          goal: campaign.goal,
          tone: campaign.tone,
          messageStyle: campaign.messageStyle,
          targets: campaign.targets.map((t) => t.name),
        }}
      />
    </div>
  );
}
