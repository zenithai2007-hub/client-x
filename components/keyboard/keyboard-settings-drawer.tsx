"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Settings2, Trash2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, FieldLabel } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { uid } from "@/lib/services/base";
import { useActivityStore } from "@/stores/use-activity-store";
import { useLocalStorage } from "@/components/settings/use-local-storage";

export interface KbShortcut {
  id: string;
  name: string;
  keys: string;
}

const DEFAULT_SHORTCUTS: KbShortcut[] = [
  { id: "sc-1", name: "Rewrite selection", keys: "Ctrl + Shift + R" },
  { id: "sc-2", name: "Generate reply", keys: "Ctrl + Shift + G" },
  { id: "sc-3", name: "Translate to Urdu", keys: "Ctrl + Shift + T" },
];

/**
 * Slide-over drawer: keyboard preferences (working toggles) + shortcut list.
 * Preferences persist to localStorage — the settings store has no keyboard
 * section (reported as a store gap).
 */
export function KeyboardSettingsDrawer({
  open,
  onClose,
  startOnShortcuts = false,
}: {
  open: boolean;
  onClose: () => void;
  startOnShortcuts?: boolean;
}) {
  const [autoSuggestions, setAutoSuggestions] = useLocalStorage("cx-kb-autosuggest", true);
  const [aiActions, setAiActions] = useLocalStorage("cx-kb-ai-actions", true);
  const [haptic, setHaptic] = useLocalStorage("cx-kb-haptic", true);
  const [shortcuts, setShortcuts] = useLocalStorage<KbShortcut[]>(
    "cx-kb-shortcuts",
    DEFAULT_SHORTCUTS
  );
  const [showShortcuts, setShowShortcuts] = useState(startOnShortcuts);
  const [adding, setAdding] = useState(startOnShortcuts);
  const [name, setName] = useState("");
  const [keys, setKeys] = useState("");

  const log = useActivityStore((s) => s.logEvent);

  const togglePref = (label: string, set: (v: boolean) => void, v: boolean) => {
    set(!v);
    void log("keyboard", `${label} ${!v ? "enabled" : "disabled"}.`);
  };

  const addShortcut = () => {
    if (!name.trim() || !keys.trim()) return;
    setShortcuts((prev) => [...prev, { id: uid("sc"), name: name.trim(), keys: keys.trim() }]);
    void log("keyboard", `Shortcut "${name.trim()}" created.`);
    setName("");
    setKeys("");
    setAdding(false);
  };

  const deleteShortcut = (id: string, label: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
    void log("keyboard", `Shortcut "${label}" deleted.`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/40"
          />
          <motion.aside
            initial={{ x: 340 }}
            animate={{ x: 0 }}
            exit={{ x: 340 }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-cx-pop"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cx-purpleLight text-cx-purpleDark">
                  <Settings2 size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Keyboard settings</h2>
                  <p className="text-xs text-slate-500">Saved automatically</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Preferences
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Auto-suggestions</p>
                    <p className="text-xs text-slate-500">Show AI word predictions while typing</p>
                  </div>
                  <Toggle
                    checked={autoSuggestions}
                    onChange={() => togglePref("Auto-suggestions", setAutoSuggestions, autoSuggestions)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">AI actions</p>
                    <p className="text-xs text-slate-500">Rewrite, generate and translate from the toolbar</p>
                  </div>
                  <Toggle
                    checked={aiActions}
                    onChange={() => togglePref("AI actions", setAiActions, aiActions)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Haptic feedback</p>
                    <p className="text-xs text-slate-500">Subtle vibration on key press</p>
                  </div>
                  <Toggle checked={haptic} onChange={() => togglePref("Haptic feedback", setHaptic, haptic)} />
                </div>
              </div>

              <div className="mt-7 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Shortcuts
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Plus size={15} />}
                  onClick={() => {
                    setShowShortcuts(true);
                    setAdding(true);
                  }}
                >
                  New
                </Button>
              </div>

              {(!showShortcuts && !adding && shortcuts.length === 0) || showShortcuts || adding ? (
                <div className="mt-3 flex flex-col gap-2">
                  {shortcuts.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/60 px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <Zap size={15} className="shrink-0 text-cx-purple" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.keys}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteShortcut(s.id, s.name)}
                        aria-label={`Delete ${s.name}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}

                  {adding ? (
                    <div className="rounded-xl border border-cx-purple/30 bg-cx-purpleLight/40 p-3.5">
                      <FieldLabel>Shortcut name</FieldLabel>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Make it shorter"
                        className="mb-3"
                      />
                      <FieldLabel>Key combination</FieldLabel>
                      <Input
                        value={keys}
                        onChange={(e) => setKeys(e.target.value)}
                        placeholder="e.g. Ctrl + Shift + S"
                        className="mb-3"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="primary-orange" onClick={addShortcut} disabled={!name.trim() || !keys.trim()}>
                          Create shortcut
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAdding(true)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-sm text-slate-500 hover:border-cx-purple hover:text-cx-purpleDark"
                    >
                      <Plus size={15} /> Add shortcut
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="mt-3 w-full rounded-xl border border-dashed border-slate-300 py-3 text-sm text-slate-500 hover:border-cx-purple hover:text-cx-purpleDark"
                >
                  View {shortcuts.length} shortcuts
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
