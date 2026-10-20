"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/use-auth-store";

/* Blocks the workspace until the persisted auth state has hydrated.
   Unauthenticated users are sent to /login and never see children —
   not even for a frame. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // zustand persist rehydrates synchronously from localStorage on store
    // creation, but guard on the persist API when available so we never
    // redirect a logged-in user before hydration completes.
    const persistApi = (
      useAuthStore as unknown as {
        persist?: {
          hasHydrated: () => boolean;
          onFinishHydration: (cb: () => void) => () => void;
        };
      }
    ).persist;

    if (!persistApi || persistApi.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = persistApi.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-cx-bg">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-cx-surface shadow-cx-card">
          <Image src="/logo-face.png" alt="CLIENT X" width={64} height={64} className="h-full w-full object-cover" priority />
        </div>
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-cx-purple" />
        <p className="text-xs font-medium tracking-wide text-slate-400">Loading your workspace…</p>
      </div>
    );
  }

  return <>{children}</>;
}
