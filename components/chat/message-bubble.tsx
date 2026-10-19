"use client";

import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/cn";
import { formatMessageTime } from "./time-utils";

function Ticks({ status }: { status: Message["status"] }) {
  if (status === "sent")
    return <Check size={13} className="text-slate-400" aria-label="Sent" />;
  if (status === "delivered")
    return <CheckCheck size={14} className="text-slate-400" aria-label="Delivered" />;
  return <CheckCheck size={14} className="text-blue-500" aria-label="Read" />;
}

export function MessageBubble({ message }: { message: Message }) {
  const mine = message.sender === "me";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn("flex", mine ? "justify-start" : "justify-end")}
    >
      <div
        className={cn(
          "max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed",
          mine
            ? "rounded-2xl rounded-bl-lg border border-slate-200/70 bg-white text-slate-800 shadow-cx-card"
            : "rounded-2xl rounded-br-lg bg-cx-orangeLight text-slate-800"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[11px] text-slate-400",
            mine ? "justify-start" : "justify-end"
          )}
        >
          <span>{formatMessageTime(message.time)}</span>
          {mine && <Ticks status={message.status} />}
        </div>
      </div>
    </motion.div>
  );
}
