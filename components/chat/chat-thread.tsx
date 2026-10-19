"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, MessagesSquare, Sparkles } from "lucide-react";
import type { AITransformKind, Conversation } from "@/lib/types";
import { useChatStore } from "@/stores/use-chat-store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TypingDots } from "@/components/ui/spinner";
import { Composer } from "./composer";
import { GeneratedCard } from "./generated-card";
import { MessageBubble } from "./message-bubble";
import { formatDayLabel, formatLastSeen, isSameDay } from "./time-utils";

interface Generated {
  text: string;
  kindLabel: string;
  kind: AITransformKind;
  source: string;
}

const KIND_LABELS: Record<AITransformKind, string> = {
  rewrite: "Rewrite",
  professional: "Make professional",
  friendly: "Make friendly",
  shorter: "Make shorter",
  longer: "Make longer",
  translate: "Translate",
  "generate-reply": "Generate reply",
  personalize: "Personalize",
  improve: "Improve",
};

export function ChatThread({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack: () => void;
}) {
  const messages = useChatStore((s) => s.activeMessages());
  const typing = useChatStore((s) => s.typingIn[conversation.id] ?? false);
  const isInFlight = useChatStore((s) => s.isInFlight);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const aiTransform = useChatStore((s) => s.aiTransform);

  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [gen, setGen] = useState<Generated | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const genSeq = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sending = isInFlight(`send:${conversation.id}`);
  const lastIncoming = [...messages].reverse().find((m) => m.sender === "them");

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, typing, conversation.id]);

  useEffect(() => {
    setDraft("");
    setAttachments([]);
    setGen(null);
    setGenLoading(false);
  }, [conversation.id]);

  const handleSend = async () => {
    const text = draft.trim();
    if ((!text && attachments.length === 0) || sending) return;
    const full = [text, ...attachments.map((a) => `[Attachment: ${a} — demo mock, not uploaded]`)]
      .filter(Boolean)
      .join("\n");
    setDraft("");
    setAttachments([]);
    await sendMessage(full);
  };

  const runTransform = async (kind: AITransformKind, label: string, explicitSource?: string) => {
    const fallback = lastIncoming?.text ?? "";
    const source =
      explicitSource ??
      (kind === "generate-reply" ? fallback || draft.trim() : draft.trim() || fallback);
    if (!source.trim()) return;
    const seq = ++genSeq.current;
    setGenLoading(true);
    setGen({ text: "", kindLabel: label, kind, source });
    try {
      const out = await aiTransform(source, kind);
      if (genSeq.current === seq) setGen({ text: out, kindLabel: label, kind, source });
    } catch {
      if (genSeq.current === seq) setGen(null);
    } finally {
      if (genSeq.current === seq) setGenLoading(false);
    }
  };

  const handleTransform = (kind: AITransformKind, label: string) =>
    void runTransform(kind, KIND_LABELS[kind] ?? label);

  /** The store's mock transform has no custom-instruction kind, so this runs as a
   *  rewrite of the draft and lets the user edit the result. */
  const handleCustomInstruction = (instruction: string) =>
    void runTransform(
      "rewrite",
      `Custom: “${instruction.length > 32 ? `${instruction.slice(0, 32)}…` : instruction}”`
    );

  const closeGen = () => {
    genSeq.current += 1;
    setGen(null);
    setGenLoading(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-cx-card">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-2.5 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onBack}
          aria-label="Back to chats"
        >
          <ArrowLeft size={18} />
        </Button>
        <Avatar name={conversation.name} color={conversation.avatarColor} online={conversation.online} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{conversation.name}</p>
          <p className="flex items-center gap-1 text-xs text-slate-500">
            {conversation.online ? (
              <span className="text-emerald-600">Online</span>
            ) : (
              <span>{formatLastSeen(conversation.lastTime)}</span>
            )}
            <span className="text-slate-300">·</span>
            <Sparkles size={11} className="text-cx-purple" />
            <span className="text-cx-purple">Client X assisted</span>
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-3 py-4 sm:px-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cx-purpleLight text-cx-purple">
              <MessagesSquare size={22} />
            </span>
            <p className="text-sm font-semibold text-slate-700">Start the conversation</p>
            <p className="max-w-xs text-xs text-slate-500">
              Say hello to {conversation.name} — Client X can help you draft the perfect opener.
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
            <Fragment key={m.id}>
              {(i === 0 || !isSameDay(messages[i - 1].time, m.time)) && (
                <div className="flex justify-center py-1">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-500 shadow-cx-card ring-1 ring-slate-200/60">
                    {formatDayLabel(m.time)}
                  </span>
                </div>
              )}
              <MessageBubble message={m} />
            </Fragment>
          ))
        )}
        {typing && (
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-br-lg bg-cx-orangeLight px-4 py-3.5">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* Generated card */}
      <AnimatePresence>
        {(gen || genLoading) && gen && (
          <div className="border-t border-slate-100 px-3 pt-2">
            <GeneratedCard
              kindLabel={gen.kindLabel}
              text={gen.text}
              loading={genLoading}
              onInsert={() => {
                setDraft(gen.text);
                closeGen();
              }}
              onRegenerate={() => void runTransform(gen.kind, gen.kindLabel, gen.source)}
              onClose={closeGen}
              onSave={(t) => setGen({ ...gen, text: t })}
            />
          </div>
        )}
      </AnimatePresence>

      <Composer
        value={draft}
        onChange={setDraft}
        onSend={() => void handleSend()}
        sending={sending}
        aiBusy={genLoading}
        attachments={attachments}
        onAddAttachment={(name) => setAttachments((a) => [...a, name])}
        onRemoveAttachment={(i) => setAttachments((a) => a.filter((_, x) => x !== i))}
        onTransform={handleTransform}
        onCustomInstruction={handleCustomInstruction}
      />
    </div>
  );
}
