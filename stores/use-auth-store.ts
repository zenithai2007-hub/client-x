"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AuthUser {
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  /** Known local accounts created via Sign Up, keyed by lowercased email — used to restore the display name on Log In. */
  accounts: Record<string, { name: string }>;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  loginWithGoogle: () => void;
  logout: () => void;
}

function nameFromEmail(email: string): string {
  const prefix = email.split("@")[0] ?? "";
  const cleaned = prefix.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "User";
  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/* Mock / local-only auth — no API, no credentials leave the browser. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accounts: {},
      login: (email) => {
        const key = email.trim().toLowerCase();
        if (!key) return false;
        const known = get().accounts[key];
        set({
          user: {
            name: known?.name ?? nameFromEmail(key),
            email: key,
          },
        });
        return true;
      },
      signup: (name, email) => {
        const key = email.trim().toLowerCase();
        const displayName = name.trim() || nameFromEmail(key);
        if (!key) return false;
        set((s) => ({
          accounts: { ...s.accounts, [key]: { name: displayName } },
          user: { name: displayName, email: key },
        }));
        return true;
      },
      loginWithGoogle: () => {
        set({
          user: { name: "Alex Morgan", email: "alex.morgan@gmail.com" },
        });
      },
      logout: () => set({ user: null }),
    }),
    {
      name: "clientx-auth-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
