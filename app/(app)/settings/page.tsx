"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  Bot,
  ChevronRight,
  Gift,
  Keyboard,
  RotateCcw,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, FieldLabel } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toggle } from "@/components/ui/toggle";
import {
  SettingsSection,
  SettingRow,
  selectCls,
} from "@/components/settings/settings-section";
import { SecuritySection } from "@/components/settings/security-section";
import { useLocalStorage } from "@/components/settings/use-local-storage";
import { useSettingsStore } from "@/stores/use-settings-store";
import { useAgentStore } from "@/stores/use-agent-store";
import { useActivityStore } from "@/stores/use-activity-store";

/**
 * Settings: every control is wired — to the settings store where a field
 * exists, otherwise to persisted local preferences (store gaps are reported).
 */
export default function SettingsPage() {
  const router = useRouter();
  const update = useSettingsStore((s) => s.update);
  const reset = useSettingsStore((s) => s.reset);
  const notif = useSettingsStore((s) => s.notifications);
  const ai = useSettingsStore((s) => s.ai);

  const agents = useAgentStore((s) => s.agents);
  const logEvent = useActivityStore((s) => s.logEvent);

  // View-level preferences (store gaps — Settings type has no fields for these)
  const [displayName, setDisplayName] = useLocalStorage("cx-display-name", "Zubair");
  const [language, setLanguage] = useLocalStorage("cx-language", "en");
  const [model, setModel] = useLocalStorage("cx-model", "smart");
  const [creativity, setCreativity] = useLocalStorage("cx-creativity", 60);
  const [emailNotif, setEmailNotif] = useLocalStorage("cx-notif-email", true);
  const [pushNotif, setPushNotif] = useLocalStorage("cx-notif-push", true);
  const [autoSuggestions, setAutoSuggestions] = useLocalStorage("cx-kb-autosuggest", true);
  const [kbAiActions, setKbAiActions] = useLocalStorage("cx-kb-ai-actions", true);
  const [haptic, setHaptic] = useLocalStorage("cx-kb-haptic", true);

  const [confirmReset, setConfirmReset] = useState(false);

  const persistPref = (label: string) => void logEvent("system", `${label} preference updated.`);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything is saved automatically — store-backed settings sync across sessions.
        </p>
      </div>

      {/* ---------------- General ---------------- */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        <SettingsSection id="general" icon={User} title="General" description="Your profile and workspace appearance.">
          <div>
            <FieldLabel>Display name</FieldLabel>
            <Input
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                persistPref("Display name");
              }}
              placeholder="Your name"
              maxLength={40}
            />
          </div>
          <SettingRow
            label="Language"
            description="Interface and AI reply language."
            control={
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  persistPref("Language");
                }}
                className={selectCls}
                aria-label="Language"
              >
                <option value="en">English</option>
                <option value="ur">Urdu</option>
                <option value="roman">Roman Urdu</option>
              </select>
            }
          />
          <SettingRow
            label="Reset to defaults"
            description="Restore all Client X settings to their defaults."
            control={
              <Button size="sm" variant="ghost" icon={<RotateCcw size={14} />} onClick={() => setConfirmReset(true)}>
                Reset
              </Button>
            }
          />
        </SettingsSection>
      </motion.div>

      {/* ---------------- AI ---------------- */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.04 }}>
        <SettingsSection id="ai" icon={Sparkles} title="AI" description="Model, style and creativity of AI output.">
          <SettingRow
            label="Default model"
            description="Which Client X engine answers by default."
            control={
              <select
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  persistPref("Default model");
                }}
                className={selectCls}
                aria-label="Default model"
              >
                <option value="smart">Client X Smart</option>
                <option value="fast">Client X Fast</option>
                <option value="precise">Client X Precise</option>
              </select>
            }
          />
          <SettingRow
            label="Response style"
            description="Default tone for generated text."
            control={
              <select
                value={ai.tone}
                onChange={(e) => {
                  update({ ai: { ...ai, tone: e.target.value as "professional" | "friendly" | "concise" } });
                  void logEvent("system", `Response style set to ${e.target.value}.`);
                }}
                className={selectCls}
                aria-label="Response style"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="concise">Concise</option>
              </select>
            }
          />
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-800">Creativity</p>
              <span className="text-xs font-medium text-cx-purpleDark">{creativity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={creativity}
              onChange={(e) => setCreativity(Number(e.target.value))}
              className="w-full accent-cx-purple"
              aria-label="Creativity"
            />
            <p className="mt-0.5 text-xs text-slate-500">Higher values make AI output more varied.</p>
          </div>
        </SettingsSection>
      </motion.div>

      {/* ---------------- Keyboard ---------------- */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.08 }}>
        <SettingsSection id="keyboard" icon={Keyboard} title="Keyboard" description="The Client X keyboard layer.">
          <SettingRow
            label="Auto-suggestions"
            description="Show AI word predictions while typing."
            control={<Toggle checked={autoSuggestions} onChange={(v) => { setAutoSuggestions(v); persistPref("Auto-suggestions"); }} />}
          />
          <SettingRow
            label="AI actions"
            description="Rewrite, generate and translate from the toolbar."
            control={<Toggle checked={kbAiActions} onChange={(v) => { setKbAiActions(v); persistPref("AI actions"); }} />}
          />
          <SettingRow
            label="Haptic feedback"
            description="Subtle vibration on key press."
            control={<Toggle checked={haptic} onChange={(v) => { setHaptic(v); persistPref("Haptic feedback"); }} />}
          />
          <SettingRow
            label="Shortcuts & preview"
            description="Manage shortcuts and try the live keyboard."
            control={
              <Link href="/keyboard">
                <Button size="sm" variant="secondary" icon={<ChevronRight size={14} />}>
                  Open keyboard
                </Button>
              </Link>
            }
          />
        </SettingsSection>
      </motion.div>

      {/* ---------------- Agents ---------------- */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.12 }}>
        <SettingsSection id="agents" icon={Bot} title="Agents" description="Approvals and execution behaviour.">
          <SettingRow
            label="Approval mode"
            description="When agents must ask before acting."
            control={
              <select
                value={ai.approvalRequired ? "always" : "per-type"}
                onChange={(e) => {
                  update({ ai: { ...ai, approvalRequired: e.target.value === "always" } });
                  void logEvent("system", `Approval mode set to ${e.target.value === "always" ? "always require" : "per-type defaults"}.`);
                }}
                className={selectCls}
                aria-label="Approval mode"
              >
                <option value="always">Always require approval</option>
                <option value="per-type">Per-action defaults</option>
              </select>
            }
          />
          <SettingRow
            label="Auto-reply"
            description="Let agents draft replies automatically when you are away."
            control={
              <Toggle
                checked={ai.autoReply}
                onChange={(v) => {
                  update({ ai: { ...ai, autoReply: v } });
                  void logEvent("system", `Auto-reply ${v ? "enabled" : "disabled"}.`);
                }}
              />
            }
          />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Per-agent permissions
            </p>
            <div className="flex flex-col gap-2">
              {agents.map((a) => {
                const perms = Object.entries(a.permissions);
                const on = perms.filter(([, v]) => v).length;
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/50 px-3.5 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{a.name}</p>
                      <p className="text-xs capitalize text-slate-500">
                        {a.platform} · {a.status} · {on}/{perms.length} permissions on
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => router.push("/agents")}>
                      Manage
                    </Button>
                  </div>
                );
              })}
              {agents.length === 0 && (
                <p className="text-sm text-slate-500">No agents yet.</p>
              )}
            </div>
          </div>
        </SettingsSection>
      </motion.div>

      {/* ---------------- Notifications ---------------- */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.16 }}>
        <SettingsSection id="notifications" icon={Bell} title="Notifications" description="How Client X gets your attention.">
          <SettingRow
            label="In-app notifications"
            description="Show alerts inside the workspace."
            control={
              <Toggle
                checked={notif.enabled}
                onChange={(v) => {
                  update({ notifications: { ...notif, enabled: v } });
                  void logEvent("system", `In-app notifications ${v ? "enabled" : "disabled"}.`);
                }}
              />
            }
          />
          <SettingRow
            label="Email notifications"
            description="Send important alerts to your email."
            control={<Toggle checked={emailNotif} onChange={(v) => { setEmailNotif(v); persistPref("Email notifications"); }} />}
          />
          <SettingRow
            label="Push notifications"
            description="Push alerts to your devices."
            control={<Toggle checked={pushNotif} onChange={(v) => { setPushNotif(v); persistPref("Push notifications"); }} />}
          />
          <SettingRow
            label="Approval alerts"
            description="Notify when an agent needs your approval."
            control={
              <Toggle
                checked={notif.approvalAlerts}
                onChange={(v) => update({ notifications: { ...notif, approvalAlerts: v } })}
              />
            }
          />
          <SettingRow
            label="Agent alerts"
            description="Notify on agent status changes."
            control={
              <Toggle
                checked={notif.agentAlerts}
                onChange={(v) => update({ notifications: { ...notif, agentAlerts: v } })}
              />
            }
          />
          <SettingRow
            label="Sound"
            description="Play a sound with notifications."
            control={
              <Toggle checked={notif.sound} onChange={(v) => update({ notifications: { ...notif, sound: v } })} />
            }
          />
        </SettingsSection>
      </motion.div>

      {/* ---------------- Growth ---------------- */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.18 }}>
        <SettingsSection id="growth" icon={Gift} title="Growth" description="Referrals, sharing and attribution.">
          <SettingRow
            label="Referral program"
            description="Invite friends — you both earn Pro credits."
            control={
              <Link href="/referrals">
                <Button size="sm" variant="secondary" icon={<ChevronRight size={14} />}>
                  Open referrals
                </Button>
              </Link>
            }
          />
          <SettingRow
            label="Attribution"
            description="Show a subtle “Made with Client X” line on shared and exported content."
            control={
              <Toggle
                checked={useSettingsStore((s) => s.growth.attribution)}
                onChange={(v) => update({ growth: { attribution: v } })}
              />
            }
          />
        </SettingsSection>
      </motion.div>

      {/* ---------------- Security ---------------- */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.2 }}>
        <SecuritySection />
      </motion.div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset settings?">
        <p className="mb-4 text-sm text-slate-600">
          All Client X settings return to their defaults. Your memory, tasks and activity are kept.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
          <Button
            variant="primary-orange"
            onClick={() => {
              reset();
              setConfirmReset(false);
              void logEvent("system", "Settings reset to defaults.");
            }}
          >
            Reset settings
          </Button>
        </div>
      </Modal>
    </div>
  );
}
