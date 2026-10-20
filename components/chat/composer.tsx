"use client";

import { useState } from "react";
import {
  AlignLeft,
  Briefcase,
  Camera,
  FileText,
  Image as ImageIcon,
  Languages,
  Paperclip,
  PenLine,
  Plus,
  Reply,
  Scissors,
  Send,
  SlidersHorizontal,
  Smile,
  Sparkles,
  UserRound,
  Wand2,
  X,
} from "lucide-react";
import type { AITransformKind } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";

const AI_ITEMS: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: "rewrite", label: "Rewrite", icon: <PenLine size={15} className="text-cx-purple" /> },
  { key: "professional", label: "Make professional", icon: <Briefcase size={15} className="text-cx-purple" /> },
  { key: "friendly", label: "Make friendly", icon: <Smile size={15} className="text-cx-purple" /> },
  { key: "shorter", label: "Make shorter", icon: <Scissors size={15} className="text-cx-purple" /> },
  { key: "longer", label: "Make longer", icon: <AlignLeft size={15} className="text-cx-purple" /> },
  { key: "translate", label: "Translate", icon: <Languages size={15} className="text-cx-purple" /> },
  { key: "generate-reply", label: "Generate reply", icon: <Reply size={15} className="text-cx-purple" /> },
  { key: "personalize", label: "Personalize", icon: <UserRound size={15} className="text-cx-purple" /> },
  { key: "improve", label: "Improve", icon: <Wand2 size={15} className="text-cx-purple" /> },
  { key: "custom", label: "Custom instruction…", icon: <SlidersHorizontal size={15} className="text-cx-purple" /> },
];

/** DropdownMenu opens downward by default; the composer sits at the bottom of the
 *  thread, so flip its popover upward. */
const MENU_UP_CLASS = "[&_.absolute]:bottom-full [&_.absolute]:!mt-0 [&_.absolute]:mb-2";

export function Composer({
  value,
  onChange,
  onSend,
  sending,
  aiBusy,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  onTransform,
  onCustomInstruction,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  aiBusy: boolean;
  attachments: string[];
  onAddAttachment: (name: string) => void;
  onRemoveAttachment: (index: number) => void;
  onTransform: (kind: AITransformKind, label: string) => void;
  onCustomInstruction: (instruction: string) => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !sending;

  const submit = () => {
    if (canSend) onSend();
  };

  const handleAiSelect = (key: string) => {
    if (aiBusy) return;
    if (key === "custom") {
      setCustomText("");
      setCustomOpen(true);
      return;
    }
    const item = AI_ITEMS.find((i) => i.key === key);
    if (item) onTransform(key as AITransformKind, item.label);
  };

  const applyCustom = () => {
    if (!customText.trim()) return;
    onCustomInstruction(customText.trim());
    setCustomText("");
    setCustomOpen(false);
  };

  return (
    <div className="border-t border-white/60 bg-cx-surface/90 px-3 pb-3 pt-2 backdrop-blur">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((a, i) => (
            <span
              key={`${a}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-full  bg-cx-bg shadow-cx-inset-sm py-1 pl-2.5 pr-1.5 text-xs text-slate-600"
            >
              <Paperclip size={12} className="text-slate-400" />
              <span className="font-medium">{a}</span>
              <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700">
                demo
              </span>
              <button
                onClick={() => onRemoveAttachment(i)}
                className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                aria-label={`Remove ${a}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {customOpen && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-cx-purple/25 bg-cx-purpleLight/40 p-2">
          <Input
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyCustom()}
            placeholder="Describe what Client X should do…"
            className="h-9"
            autoFocus
          />
          <Button size="sm" variant="primary-orange" onClick={applyCustom} disabled={!customText.trim()}>
            Apply
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCustomOpen(false)}>
            Cancel
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <DropdownMenu
          className={MENU_UP_CLASS}
          align="left"
          trigger={
            <Tooltip tip="Attach (demo mock)">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/60 hover:text-slate-700">
                <Plus size={18} />
              </span>
            </Tooltip>
          }
          items={[
            { key: "photo", label: "Photo (demo mock)", icon: <ImageIcon size={15} className="text-slate-500" /> },
            { key: "document", label: "Document (demo mock)", icon: <FileText size={15} className="text-slate-500" /> },
            { key: "camera", label: "Camera (demo mock)", icon: <Camera size={15} className="text-slate-500" /> },
          ]}
          onSelect={(key) =>
            onAddAttachment(
              key === "photo" ? "photo.jpg" : key === "document" ? "document.pdf" : "capture.png"
            )
          }
        />

        <DropdownMenu
          className={MENU_UP_CLASS}
          align="left"
          trigger={
            <Tooltip tip={aiBusy ? "Client X is writing…" : "Client X AI"}>
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  aiBusy ? "text-slate-300" : "text-cx-purple hover:bg-cx-purpleLight"
                }`}
              >
                <Sparkles size={18} />
              </span>
            </Tooltip>
          }
          items={AI_ITEMS.map(({ key, label, icon }) => ({ key, label, icon }))}
          onSelect={handleAiSelect}
        />

        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask Client X to write something…"
          className="h-10 flex-1 rounded-full"
          aria-label="Message input"
        />

        <Button
          variant="primary-orange"
          size="icon"
          icon={<Send size={16} />}
          onClick={submit}
          disabled={!canSend}
          loading={sending}
          aria-label="Send message"
        />
      </div>

      <p className="mt-1.5 px-1 text-[11px] text-slate-400">
        Demo workspace — attachments and AI output are mock; nothing is uploaded.
      </p>
    </div>
  );
}
