"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, MessageSquare, Bot, Megaphone, ListTodo, Keyboard, Brain,
  Activity, Settings, ChevronLeft, ChevronRight, Plus, X, History,
  Zap, BarChart3, Gift, LayoutTemplate, Plug, LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NavKey } from "@/lib/types";
import { useUIStore } from "@/stores/use-ui-store";
import { useAgentStore } from "@/stores/use-agent-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { useChatStore } from "@/stores/use-chat-store";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

const NAV: { key: NavKey; label: string; href: string; icon: LucideIcon }[] = [
  { key: "home", label: "Home", href: "/home", icon: Home },
  { key: "chat", label: "Chats", href: "/chats", icon: MessageSquare },
  { key: "agents", label: "Agents", href: "/agents", icon: Bot },
  { key: "outreach", label: "Outreach", href: "/outreach", icon: Megaphone },
  { key: "tasks", label: "Tasks", href: "/tasks", icon: ListTodo },
  { key: "keyboard", label: "Keyboard", href: "/keyboard", icon: Keyboard },
  { key: "memory", label: "Memory", href: "/memory", icon: Brain },
  { key: "activity", label: "Activity", href: "/activity", icon: Activity },
  { key: "history", label: "History", href: "/history", icon: History },
  { key: "automations", label: "Automations", href: "/automations", icon: Zap },
  { key: "connections", label: "Connections", href: "/connections", icon: Plug },
  { key: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
  { key: "referrals", label: "Referrals", href: "/referrals", icon: Gift },
  { key: "templates", label: "Templates", href: "/templates", icon: LayoutTemplate },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar, setActiveNav, mobileNavOpen, setMobileNavOpen } = useUIStore();
  const { agents, activeAgentId } = useAgentStore();
  const newChat = useChatStore((s) => s.newChat);
  const logout = useAuthStore((s) => s.logout);
  const activeAgent = agents.find((a) => a.id === activeAgentId);

  const collapsed = sidebarCollapsed;

  const handleNewChat = () => {
    newChat("New conversation");
    setActiveNav("chat");
    setMobileNavOpen(false);
    router.push("/chats");
  };

  const body = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <img src="/logo-face.png" alt="Client X" className="h-9 w-9 rounded-xl object-cover" />
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-[15px] font-bold tracking-tight text-slate-900">CLIENT X</p>
            <p className="text-[11px] text-slate-400">AI execution workspace</p>
          </div>
        )}
        <button
          onClick={() => setMobileNavOpen(false)}
          className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-white/60 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map(({ key, label, href, icon: Icon }) => {
          const active = pathname === href;
          const link = (
            <Link
              key={key}
              href={href}
              onClick={() => {
                setActiveNav(key);
                setMobileNavOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-cx-surface text-slate-900 shadow-cx-card "
                  : "text-slate-500 hover:bg-cx-surface/70 hover:text-slate-800",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon size={19} className={active ? "text-cx-purple" : ""} />
              {!collapsed && label}
            </Link>
          );
          return collapsed ? (
            <Tooltip key={key} tip={label}>
              {link}
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>

      {/* Active agent card + New chat */}
      <div className="space-y-2 p-3">
        {!collapsed && activeAgent && (
          <div className="rounded-2xl  bg-cx-surface p-3 shadow-cx-card">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-cx-purpleLight text-cx-purpleDark">
                <Bot size={16} />
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
                    activeAgent.status === "active" ? "bg-emerald-500" : "bg-slate-300"
                  )}
                />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-xs font-semibold text-slate-800">{activeAgent.name}</p>
                <p className="text-[11px] capitalize text-slate-400">{activeAgent.status}</p>
              </div>
            </div>
          </div>
        )}
        <Button
          variant="secondary"
          size={collapsed ? "icon" : "md"}
          className="w-full"
          icon={<Plus size={16} />}
          onClick={handleNewChat}
        >
          {collapsed ? null : "New Chat"}
        </Button>
        {(() => {
          const logoutBtn = (
            <button
              onClick={() => { logout(); router.push("/"); }}
              aria-label="Log out"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-all",
                "hover:bg-cx-surface/70 hover:text-slate-800",
                collapsed && "justify-center px-0"
              )}
            >
              <LogOut size={19} />
              {!collapsed && "Log out"}
            </button>
          );
          return collapsed ? <Tooltip tip="Log out">{logoutBtn}</Tooltip> : logoutBtn;
        })()}
        <button
          onClick={toggleSidebar}
          className="hidden w-full items-center justify-center rounded-xl py-1.5 text-slate-400 hover:bg-cx-surface/70 lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 transition-all lg:block",
          collapsed ? "w-[76px]" : "w-60"
        )}
      >
        {body}
      </aside>
      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-[#E9EDF4] shadow-cx-pop cx-fade-in">
            {body}
          </aside>
        </div>
      )}
    </>
  );
}
