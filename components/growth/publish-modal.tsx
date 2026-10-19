"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useTemplateStore, KIND_LABEL } from "@/stores/use-template-store";
import type { CommunityTemplate, TemplateKind } from "@/lib/types";

export function PublishModal({
  open,
  onClose,
  kind,
  initialTitle = "",
  initialDescription = "",
  payload,
}: {
  open: boolean;
  onClose: () => void;
  kind: TemplateKind;
  initialTitle?: string;
  initialDescription?: string;
  payload: CommunityTemplate["payload"];
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const publish = useTemplateStore((s) => s.publish);
  const isInFlight = useTemplateStore((s) => s.isInFlight);
  const busy = isInFlight(`template:publish:${title}`);

  const submit = async () => {
    if (!title.trim()) return;
    await publish({ kind, title: title.trim(), description: description.trim(), payload });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Publish ${KIND_LABEL[kind]} to gallery`}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Other Client X users will be able to browse and clone this {KIND_LABEL[kind].toLowerCase()}.
          You can remove it from the gallery anytime.
        </p>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give it a clear name" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does it do? When should someone use it?"
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary-orange" onClick={submit} loading={busy} disabled={!title.trim()}>
            Publish
          </Button>
        </div>
      </div>
    </Modal>
  );
}
