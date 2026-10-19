"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Copy,
  Eraser,
  Languages,
  Palette,
  Plus,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { VirtualKeyboard } from "@/components/keyboard/virtual-keyboard";
import { KeyboardSettingsDrawer } from "@/components/keyboard/keyboard-settings-drawer";
import { useLocalStorage } from "@/components/settings/use-local-storage";
import { timeAgo } from "@/components/activity/format-time";
import {
  QUICK_ACTIONS,
  useKeyboardStore,
  type KeyboardTone,
} from "@/stores/use-keyboard-store";
import { useChatStore } from "@/stores/use-chat-store";
import { useActivityStore } from "@/stores/use-activity-store";
import { cn } from "@/lib/cn";

const TONES: KeyboardTone[] = ["professional", "friendly", "concise", "persuasive"];

/** Keyboard page: virtual QWERTY preview + AI actions wired to the keyboard store. */
export default function KeyboardPage() {
  const kbInput = useKeyboardStore((s) => s.kbInput);
  const kbOutput = useKeyboardStore((s) => s.kbOutput);
  const tone = useKeyboardStore((s) => s.tone);
  const clipboardItems = useKeyboardStore((s) => s.clipboardItems);
  const generating = useKeyboardStore((s) => s.generating);
  const busy = useKeyboardStore((s) => s.isInFlight("keyboard:generate"));
  const setKbInput = useKeyboardStore((s) => s.setKbInput);
  const setTone = useKeyboardStore((s) => s.setTone);
  const generateTone = useKeyboardStore((s) => s.generateTone);
  const runQuickAction = useKeyboardStore((s) => s.runQuickAction);
  const insertToClipboard = useKeyboardStore((s) => s.insertToClipboard);
  const clearOutput = useKeyboardStore((s) => s.clearOutput);

  const aiTransform = useChatStore((s) => s.aiTransform);
  const logEvent = useActivityStore((s) => s.logEvent);

  // Store gap: useKeyboardStore has no clearClipboard action, so cleared items
  // are hidden locally via a cutoff timestamp (persisted).
  const [clearedBefore, setClearedBefore] = useLocalStorage("cx-kb-clipboard-cleared", "");
  const visibleClipboard = useMemo(
    () => clipboardItems.filter((i) => !clearedBefore || i.time > clearedBefore),
    [clipboardItems, clearedBefore]
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerShortcuts, setDrawerShortcuts] = useState(false);
  const [personalizing, setPersonalizing] = useState(false);
  const [aiActionsOn] = useLocalStorage("cx-kb-ai-actions", true);

  const working = generating || busy || personalizing;

  const openDrawer = (shortcuts: boolean) => {
    setDrawerShortcuts(shortcuts);
    setDrawerOpen(true);
  };

  const cycleTone = () => {
    const next = TONES[(TONES.indexOf(tone) + 1) % TONES.length];
    setTone(next);
    void logEvent("keyboard", `Tone set to ${next}.`);
  };

  const personalize = async () => {
    if (!kbInput.trim() || personalizing) return;
    setPersonalizing(true);
    try {
      const out = await aiTransform(kbInput, "personalize");
      setKbInput(out);
      void logEvent("keyboard", "Personalized text in the preview input.");
    } finally {
      setPersonalizing(false);
    }
  };

  const insertOutput = () => {
    const out = kbOutput.trim();
    if (!out) return;
    setKbInput(kbInput ? `${kbInput} ${out}` : out);
    void logEvent("keyboard", "Inserted AI output into the preview input.");
  };

  const reinsert = (text: string) => {
    setKbInput(kbInput ? `${kbInput} ${text}` : text);
    void logEvent("keyboard", "Re-inserted a clipboard item.");
  };

  const featureBtn =
    "flex items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-cx-card transition-colors hover:border-cx-purple/40 hover:text-cx-purpleDark disabled:opacity-50";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Client X Keyboard</h1>
          <p className="mt-1 text-sm text-slate-500">Your AI layer across the apps you use.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={<SlidersHorizontal size={15} />} onClick={() => openDrawer(false)}>
            Configure Keyboard
          </Button>
          <Button variant="secondary" size="sm" icon={<Settings2 size={15} />} onClick={() => openDrawer(false)}>
            Keyboard Settings
          </Button>
          <Button variant="primary-orange" size="sm" icon={<Plus size={15} />} onClick={() => openDrawer(true)}>
            Create Shortcut
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Left: keyboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="lg:col-span-3"
        >
          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Live preview</h2>
              <span className="rounded-full bg-cx-purpleLight px-2.5 py-0.5 text-xs font-medium text-cx-purpleDark">
                tone: {tone}
              </span>
            </div>
            <VirtualKeyboard />
          </Card>
        </motion.div>

        {/* Right: AI actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.06 }}
          className="flex flex-col gap-5 lg:col-span-2"
        >
          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-cx-purple" />
              <h2 className="text-sm font-semibold text-slate-900">AI actions</h2>
            </div>
            {!aiActionsOn && (
              <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                AI actions are off in keyboard settings — enable them to use these buttons.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button className={featureBtn} disabled={working || !aiActionsOn} onClick={() => void generateTone()}>
                <Wand2 size={15} className="text-cx-purple" /> AI Rewrite
              </button>
              <button className={featureBtn} disabled={working || !aiActionsOn} onClick={() => void runQuickAction("qa-reply")}>
                <Sparkles size={15} className="text-cx-purple" /> Generate
              </button>
              <button className={featureBtn} disabled={working || !aiActionsOn} onClick={() => void runQuickAction("qa-translate")}>
                <Languages size={15} className="text-cx-purple" /> Translate
              </button>
              <button className={featureBtn} disabled={working || !aiActionsOn} onClick={() => void personalize()}>
                <Palette size={15} className="text-cx-purple" /> Personalize
              </button>
              <button className={featureBtn} disabled={!aiActionsOn} onClick={cycleTone}>
                <SlidersHorizontal size={15} className="text-cx-purple" /> Tone: {tone}
              </button>
              <button className={cn(featureBtn, "border-cx-orange/50 text-cx-orangeDark")} disabled={!kbOutput.trim()} onClick={insertOutput}>
                <Plus size={15} /> Insert
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50/80 p-3.5">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Generated output
              </p>
              {generating ? (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-cx-purple border-t-transparent" />
                  Generating…
                </p>
              ) : kbOutput ? (
                <p className="text-sm text-slate-800">{kbOutput}</p>
              ) : (
                <p className="text-sm text-slate-400">
                  Type above, then run an AI action to generate text here.
                </p>
              )}
              {kbOutput && !generating && (
                <div className="mt-2.5 flex gap-2">
                  <Button size="sm" variant="secondary" icon={<Copy size={14} />} onClick={() => void insertToClipboard(kbOutput)}>
                    Copy
                  </Button>
                  <Button size="sm" variant="ghost" icon={<Eraser size={14} />} onClick={clearOutput}>
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Quick actions</h2>
            <div className="flex flex-col gap-2">
              {QUICK_ACTIONS.filter((a) => a.id !== "qa-translate").map((a) => (
                <button
                  key={a.id}
                  className={cn(featureBtn, "justify-start")}
                  disabled={working || !aiActionsOn}
                  onClick={() => void runQuickAction(a.id)}
                >
                  <Wand2 size={15} className="text-cx-purple" /> {a.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-cx-purple" />
                <h2 className="text-sm font-semibold text-slate-900">Clipboard</h2>
              </div>
              {visibleClipboard.length > 0 && (
                <button
                  onClick={() => {
                    setClearedBefore(new Date().toISOString());
                    void logEvent("keyboard", "Cleared the clipboard history.");
                  }}
                  className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600"
                >
                  <Trash2 size={13} /> Clear
                </button>
              )}
            </div>
            {visibleClipboard.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Clipboard is empty"
                description="Copied outputs appear here — tap one to insert it into the preview input."
              />
            ) : (
              <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
                {visibleClipboard.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => reinsert(item.text)}
                    className="rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2 text-left transition-colors hover:border-cx-purple/40"
                  >
                    <p className="line-clamp-2 text-sm text-slate-700">{item.text}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(item.time)} · tap to re-insert</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      <KeyboardSettingsDrawer
        key={drawerShortcuts ? "shortcuts" : "prefs"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        startOnShortcuts={drawerShortcuts}
      />
    </div>
  );
}
