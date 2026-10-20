"use client";

import { Sidebar } from "@/components/shell/sidebar";
import { RightAgentPanel, AgentPanelCard } from "@/components/shell/right-agent-panel";
import { TopBar } from "@/components/shell/topbar";
import { CommandPalette } from "@/components/shell/command-palette";
import { MobileNav, MobileAgentSheet } from "@/components/shell/mobile-nav";
import { StoreInitializer } from "@/components/shell/store-initializer";
import { AuthGuard } from "@/components/shell/auth-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
      <StoreInitializer />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-10">{children}</main>
      </div>
      <RightAgentPanel />
      <MobileAgentSheet>
        <AgentPanelCard />
      </MobileAgentSheet>
      <MobileNav />
      <CommandPalette />
      </div>
    </AuthGuard>
  );
}
