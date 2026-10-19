"use client";

import { useState } from "react";
import { Plus, Rocket, Trash2, Users } from "lucide-react";
import { useOutreachStore } from "@/stores/use-outreach-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, FieldLabel } from "@/components/ui/input";

const PLATFORMS = ["LinkedIn", "Website", "Other"];
const TONES = ["Professional", "Friendly", "Casual", "Persuasive"];
const MESSAGE_STYLES = [
  "Short + personalized",
  "Detailed pitch",
  "Cold intro",
  "Follow-up style",
];

const selectClass =
  "w-full rounded-xl border border-slate-200/70 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-cx-purple focus:outline-none focus:ring-2 focus:ring-cx-purple/15";

export interface BuilderInitial {
  name?: string;
  platform?: string;
  targets?: string[];
  goal?: string;
  tone?: string;
  messageStyle?: string;
}

export function CampaignBuilder({
  onLaunched,
  initial,
}: {
  onLaunched: () => void;
  initial?: BuilderInitial;
}) {
  const createCampaign = useOutreachStore((s) => s.createCampaign);
  const startCampaign = useOutreachStore((s) => s.startCampaign);
  const isInFlight = useOutreachStore((s) => s.isInFlight);

  const [name, setName] = useState(initial?.name ?? "");
  const [platform, setPlatform] = useState(initial?.platform ?? "LinkedIn");
  const [targets, setTargets] = useState<string[]>(
    initial?.targets?.length ? initial.targets : ["Faisal", "Ahmad", "Hamza"]
  );
  const [draft, setDraft] = useState("");
  const [goal, setGoal] = useState(initial?.goal ?? "");
  const [tone, setTone] = useState(initial?.tone ?? "Professional");
  const [messageStyle, setMessageStyle] = useState(initial?.messageStyle ?? MESSAGE_STYLES[0]);

  const launching = isInFlight("campaign:create");
  const cleanTargets = targets.map((t) => t.trim()).filter(Boolean);
  const valid = name.trim().length > 0 && cleanTargets.length > 0;

  const addTarget = () => {
    const v = draft.trim();
    if (!v) return;
    setTargets((t) => [...t, v]);
    setDraft("");
  };

  const removeTarget = (idx: number) => setTargets((t) => t.filter((_, i) => i !== idx));

  const handleLaunch = async () => {
    if (!valid || launching) return;
    const campaign = await createCampaign({
      name: name.trim(),
      platform,
      goal: goal.trim() || "Book intro calls",
      tone,
      messageStyle,
      targetNames: cleanTargets,
    });
    await startCampaign(campaign.id);
    onLaunched();
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cx-purpleLight text-cx-purpleDark">
          <Users size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">New outreach campaign</h2>
          <p className="text-xs text-slate-500">
            Define the campaign — targets flow through the pipeline live, with approval and
            verification handled honestly.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Campaign name</FieldLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. EU Founders — Batch 13"
          />
        </div>
        <div>
          <FieldLabel>Platform</FieldLabel>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={selectClass}>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <FieldLabel>Targets ({cleanTargets.length})</FieldLabel>
        <div className="space-y-2">
          {targets.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={t}
                onChange={(e) =>
                  setTargets((all) => all.map((x, j) => (j === i ? e.target.value : x)))
                }
                placeholder={`Target ${i + 1}`}
              />
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Remove ${t || "target"}`}
                onClick={() => removeTarget(i)}
              >
                <Trash2 size={15} className="text-red-500" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTarget()}
              placeholder="Add a target name, then press Enter"
            />
            <Button size="icon" variant="secondary" aria-label="Add target" onClick={addTarget}>
              <Plus size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <FieldLabel>Goal</FieldLabel>
        <Textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          placeholder="What should this campaign achieve? e.g. Book intro calls with boutique founders."
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Tone</FieldLabel>
          <select value={tone} onChange={(e) => setTone(e.target.value)} className={selectClass}>
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Message style</FieldLabel>
          <select
            value={messageStyle}
            onChange={(e) => setMessageStyle(e.target.value)}
            className={selectClass}
          >
            {MESSAGE_STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          variant="primary-orange"
          size="lg"
          loading={launching}
          disabled={!valid}
          icon={<Rocket size={16} />}
          onClick={handleLaunch}
        >
          Start Outreach
        </Button>
      </div>
      {!valid && (
        <p className="mt-2 text-right text-[11px] text-slate-400">
          Add a campaign name and at least one target to launch.
        </p>
      )}
    </Card>
  );
}
