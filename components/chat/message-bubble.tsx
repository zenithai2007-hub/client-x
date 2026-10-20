"use client";

import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/cn";
import { formatMessageTime } from "./time-utils";

function Ticks({ status, onPurple }: { status: Message["status"]; onPurple?: boolean }) {
  const base = onPurple ? "text-white/70" : "text-slate-400";
  if (status === "sent") return <Check size={13} className={base} aria-label="Sent" />;
  if (status === "delivered")
    return <CheckCheck size={14} className={base} aria-label="Delivered" />;
  return (
    <CheckCheck size={14} className={onPurple ? "text-white" : "text-cx-purple"} aria-label="Read" />
  );
}

/** Messaging convention: incoming (contact) left = soft raised light bubble;
 *  outgoing (me) right = elevated purple bubble. Both get large rounded
 *  corners, soft diffused shadows and subtle depth. */
export function MessageBubble({ message }: { message: Message }) {
  const mine = message.sender === "me";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn("flex", mine ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed",
          mine
            ? "rounded-3xl rounded-br-lg bg-cx-purple text-white shadow-[5px_5px_14px_rgba(124,58,237,0.28),-2px_-2px_8px_rgba(255,255,255,0.5)]"
            : "rounded-3xl rounded-bl-lg bg-cx-surface text-slate-800 shadow-cx-card"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[11px]",
            mine ? "justify-end text-white/70" : "justify-start text-slate-400"
          )}
        >
          <span>{formatMessageTime(message.time)}</span>
          {mine && <Ticks status={message.status} onPurple />}
        </div>
      </div>
    </motion.div>
  );
}
