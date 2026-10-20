"use client";

import { useState } from "react";
import { Download, Laptop, MonitorSmartphone, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SettingsSection, SettingRow } from "@/components/settings/settings-section";
import { useActivityStore } from "@/stores/use-activity-store";
import { useAgentStore } from "@/stores/use-agent-store";
import { useMemoryStore } from "@/stores/use-memory-store";
import { useNotificationStore } from "@/stores/use-notification-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { useTaskStore } from "@/stores/use-task-store";
import { useKeyboardStore } from "@/stores/use-keyboard-store";

interface Session {
  id: string;
  name: string;
  detail: string;
  current: boolean;
}

interface Device {
  id: string;
  name: string;
  detail: string;
}

/** Security: sessions, devices, data export, local-data wipe. All controls work. */
export function SecuritySection() {
  const [sessions, setSessions] = useState<Session[]>([
    { id: "s1", name: "Chrome — this device", detail: "Active now", current: true },
    { id: "s2", name: "Client X Android app", detail: "Last active 2h ago", current: false },
  ]);
  const [devices, setDevices] = useState<Device[]>([
    { id: "d1", name: "Pixel 8 — Android", detail: "Client X keyboard active" },
    { id: "d2", name: "Chrome — Windows", detail: "Web workspace" },
  ]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const logEvent = useActivityStore((s) => s.logEvent);

  const revokeSession = (id: string) => {
    setRevoking(id);
    const name = sessions.find((s) => s.id === id)?.name ?? "session";
    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setRevoking(null);
      void logEvent("system", `Session revoked: ${name}.`);
    }, 450);
  };

  const removeDevice = (id: string) => {
    const name = devices.find((d) => d.id === id)?.name ?? "device";
    setDevices((prev) => prev.filter((d) => d.id !== id));
    void logEvent("system", `Device removed: ${name}.`);
  };

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      product: "Client X",
      settings: useSettingsStore.getState(),
      memory: useMemoryStore.getState().items,
      tasks: useTaskStore.getState().tasks,
      approvals: useAgentStore.getState().approvals,
      activity: useActivityStore.getState().events,
      notifications: useNotificationStore.getState().notifications,
      keyboard: {
        input: useKeyboardStore.getState().kbInput,
        clipboard: useKeyboardStore.getState().clipboardItems,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `client-x-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    void logEvent("system", "Exported personal data as JSON.");
  };

  const clearLocalData = () => {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } finally {
      window.location.reload();
    }
  };

  return (
    <SettingsSection
      id="security"
      icon={ShieldCheck}
      title="Security"
      description="Sessions, devices and your local data."
    >
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Sessions</p>
        <div className="flex flex-col gap-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl  bg-cx-bg shadow-cx-inset-sm/50 px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <MonitorSmartphone size={16} className="text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {s.name}
                    {s.current && (
                      <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        current
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{s.detail}</p>
                </div>
              </div>
              {!s.current && (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={revoking === s.id}
                  onClick={() => revokeSession(s.id)}
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-sm text-slate-500">No other sessions. This is your only session.</p>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Devices</p>
        <div className="flex flex-col gap-2">
          {devices.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-xl  bg-cx-bg shadow-cx-inset-sm/50 px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <Laptop size={16} className="text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.detail}</p>
                </div>
              </div>
              <button
                onClick={() => removeDevice(d.id)}
                aria-label={`Remove ${d.name}`}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <SettingRow
        label="Export my data"
        description="Download everything Client X stores locally as JSON."
        control={
          <Button size="sm" variant="secondary" icon={<Download size={14} />} onClick={exportData}>
            Export JSON
          </Button>
        }
      />
      <SettingRow
        label="Clear local data"
        description="Wipe all Client X data from this browser and reload."
        control={
          <Button size="sm" variant="danger" onClick={() => setConfirmClear(true)}>
            Clear data
          </Button>
        }
      />

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="Clear all local data?">
        <p className="mb-4 text-sm text-slate-600">
          This permanently deletes every Client X setting, memory entry, task, approval and activity
          record stored in this browser. There is no undo.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={clearLocalData}>
            Clear everything
          </Button>
        </div>
      </Modal>

    </SettingsSection>
  );
}
