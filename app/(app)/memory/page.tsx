"use client";

import { motion } from "framer-motion";
import { Bot, Brain, Globe, Megaphone, MessagesSquare, type LucideIcon } from "lucide-react";
import { MemorySection } from "@/components/memory/memory-section";
import type { MemorySection as Section } from "@/lib/types";

const SECTIONS: { key: Section; title: string; description: string; icon: LucideIcon }[] = [
  {
    key: "global",
    title: "Global Memory",
    description: "Facts Client X applies everywhere.",
    icon: Globe,
  },
  {
    key: "agent",
    title: "Agent Memory",
    description: "Per-agent context and instructions.",
    icon: Bot,
  },
  {
    key: "platform",
    title: "Platform Memory",
    description: "LinkedIn, WhatsApp and other platform specifics.",
    icon: MessagesSquare,
  },
  {
    key: "conversation",
    title: "Conversation Memory",
    description: "Details remembered from your chats.",
    icon: Brain,
  },
  {
    key: "outreach",
    title: "Outreach Preferences",
    description: "Tone, targeting and messaging rules.",
    icon: Megaphone,
  },
];

export default function MemoryPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Memory</h1>
        <p className="mt-1 text-sm text-slate-500">
          What Client X remembers about you, your agents and your outreach. Changes apply immediately.
        </p>
      </div>
      {SECTIONS.map((s, i) => (
        <motion.div
          key={s.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.04 }}
        >
          <MemorySection
            section={s.key}
            title={s.title}
            description={s.description}
            icon={s.icon}
          />
        </motion.div>
      ))}
    </div>
  );
}
