"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Pencil, Plus, Trash2, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Textarea, FieldLabel } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { timeAgo } from "@/components/activity/format-time";
import type { MemoryItem, MemorySection as Section } from "@/lib/types";
import { useMemoryStore } from "@/stores/use-memory-store";
import { useActivityStore } from "@/stores/use-activity-store";

/** One memory section card: inline edit, delete-with-confirm, add via modal. */
export function MemorySection({
  section,
  title,
  description,
  icon: Icon,
}: {
  section: Section;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  const items = useMemoryStore((s) => s.items);
  const addItem = useMemoryStore((s) => s.addItem);
  const updateItem = useMemoryStore((s) => s.updateItem);
  const deleteItem = useMemoryStore((s) => s.deleteItem);
  const isInFlight = useMemoryStore((s) => s.isInFlight);
  const logEvent = useActivityStore((s) => s.logEvent);

  const sectionItems = useMemo(
    () => items.filter((i) => i.section === section),
    [items, section]
  );

  const [addOpen, setAddOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [deleting, setDeleting] = useState<MemoryItem | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const openAdd = () => {
    setNewKey("");
    setNewValue("");
    setAddOpen(true);
  };

  const saveAdd = async () => {
    if (!newKey.trim() || !newValue.trim() || adding) return;
    setAdding(true);
    try {
      await addItem(section, newKey.trim(), newValue.trim());
      void logEvent("system", `Memory added to ${title}: "${newKey.trim()}".`);
      setAddOpen(false);
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (item: MemoryItem) => {
    setEditingId(item.id);
    setDraft(item.value);
  };

  const saveEdit = async (item: MemoryItem) => {
    if (!draft.trim() || draft === item.value) {
      setEditingId(null);
      return;
    }
    await updateItem(item.id, { value: draft.trim() });
    void logEvent("system", `Memory updated in ${title}: "${item.key}".`);
    setEditingId(null);
  };

  const confirmDelete = async () => {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true);
    try {
      await deleteItem(deleting.id);
      void logEvent("system", `Memory deleted from ${title}: "${deleting.key}".`);
      setDeleting(null);
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cx-purpleLight text-cx-purpleDark">
            <Icon size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={openAdd}>
          Add
        </Button>
      </div>

      {sectionItems.length === 0 ? (
        <EmptyState
          icon={Icon}
          title="Nothing stored yet"
          description={`Add the first ${title.toLowerCase()} entry with the Add button.`}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {sectionItems.map((item) => {
            const editing = editingId === item.id;
            const saving = isInFlight(`memory:${item.id}:update`);
            return (
              <motion.div
                key={item.id}
                layout
                className="rounded-xl border border-slate-200/70 bg-slate-50/50 px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.key}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    {editing ? (
                      <>
                        <button
                          onClick={() => void saveEdit(item)}
                          disabled={saving || !draft.trim()}
                          aria-label="Save"
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          aria-label="Cancel"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                        >
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(item)}
                          aria-label="Edit"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleting(item)}
                          aria-label="Delete"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {editing ? (
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={saving}
                    className="mt-2"
                    autoFocus
                  />
                ) : (
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-600">{item.value}</p>
                )}
                <p className="mt-1.5 text-[11px] text-slate-400">Updated {timeAgo(item.updatedAt)}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`Add to ${title}`}>
        <FieldLabel>Key</FieldLabel>
        <Input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="e.g. Preferred greeting"
          className="mb-3"
          autoFocus
        />
        <FieldLabel>Value</FieldLabel>
        <Textarea
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="What should Client X remember?"
          className="mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAddOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary-orange"
            loading={adding}
            disabled={!newKey.trim() || !newValue.trim()}
            onClick={() => void saveAdd()}
          >
            Save memory
          </Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete memory?">
        <p className="mb-4 text-sm text-slate-600">
          Delete <span className="font-semibold text-slate-900">“{deleting?.key}”</span>? This
          cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deletingBusy} onClick={() => void confirmDelete()}>
            Delete
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
