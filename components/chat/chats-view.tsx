"use client";

import { useEffect, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { useChatStore } from "@/stores/use-chat-store";
import { useUIStore } from "@/stores/use-ui-store";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { ChatList } from "./chat-list";
import { ChatThread } from "./chat-thread";

export function ChatsView() {
  const loaded = useChatStore((s) => s.loaded);
  const load = useChatStore((s) => s.load);
  const activeId = useChatStore((s) => s.activeId);
  const conversations = useChatStore((s) => s.conversations);
  const setActiveNav = useUIStore((s) => s.setActiveNav);
  const [mobileThread, setMobileThread] = useState(false);

  useEffect(() => {
    setActiveNav("chat");
  }, [setActiveNav]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  if (!loaded) {
    return (
      <div className="flex h-[calc(100dvh-13rem)] min-h-[440px] items-center justify-center md:h-[calc(100dvh-11rem)]">
        <p className="text-sm text-slate-400">Loading chats…</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-13rem)] min-h-[440px] gap-4 md:h-[calc(100dvh-11rem)]">
      <aside
        className={cn(
          "min-h-0 w-full shrink-0 md:block md:w-[340px] lg:w-[380px]",
          mobileThread ? "hidden" : "block"
        )}
      >
        <ChatList onOpenThread={() => setMobileThread(true)} />
      </aside>

      <section
        className={cn(
          "min-h-0 min-w-0 flex-1 md:block",
          mobileThread ? "block" : "hidden"
        )}
      >
        {activeConversation ? (
          <ChatThread conversation={activeConversation} onBack={() => setMobileThread(false)} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl  bg-cx-surface px-6 shadow-cx-card">
            <EmptyState
              icon={MessagesSquare}
              title="Select a chat"
              description="Pick a conversation from the list to start messaging."
            />
          </div>
        )}
      </section>
    </div>
  );
}
