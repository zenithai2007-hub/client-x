"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Megaphone, ListTodo, Settings, Menu, PanelRight } from "lucide-react";
import type { ReactNode } from "react";
import { useUIStore } from "@/stores/use-ui-store";
import { cn } from "@/lib/cn";

const ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Chats", href: "/chats", icon: MessageSquare },
  { label: "Outreach", href: "/outreach", icon: Megaphone },
  { label: "Tasks", href: "/tasks", icon: ListTodo },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { setMobileNavOpen, toggleRightPanel, rightPanelOpen } = useUIStore();

  return (
    <>
      {/* floating menu button for the drawer (mobile only) */}
      <button
        onClick={() => setMobileNavOpen(true)}
        className="fixed left-4 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-600 shadow-cx-card lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/70 bg-white/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-6 px-2 py-1.5">
          {ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium",
                  active ? "text-cx-purple" : "text-slate-400"
                )}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
          <button
            onClick={toggleRightPanel}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium",
              rightPanelOpen ? "text-cx-purple" : "text-slate-400"
            )}
            aria-label="Toggle agent panel"
          >
            <PanelRight size={20} />
            Agent
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}

/**
 * Mobile bottom-sheet version of the right agent panel.
 * Rendered inside the (app) layout on small screens when rightPanelOpen.
 */
export function MobileAgentSheet({ children }: { children: ReactNode }) {
  const { rightPanelOpen, toggleRightPanel } = useUIStore();
  if (!rightPanelOpen) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-slate-900/40" onClick={toggleRightPanel} />
      <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-24 shadow-cx-pop cx-fade-in">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
        {children}
      </div>
    </div>
  );
}
