"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Chrome, LogIn, UserPlus } from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* If a session already exists, skip the welcome screen. Client-side only —
   the served HTML is always the landing. */
function LandingRedirect() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) router.replace("/home");
  }, [user, router]);

  return null;
}

export default function LandingPage() {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);

  const handleGoogle = () => {
    loginWithGoogle();
    router.replace("/home");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-cx-bg px-4 py-10">
      <LandingRedirect />
      <Card className="w-full max-w-md p-8 text-center sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-cx-surface shadow-cx-card">
          <Image
            src="/logo-face.png"
            alt="CLIENT X"
            width={80}
            height={80}
            className="h-full w-full object-cover"
            priority
          />
        </div>

        <p className="mt-6 text-sm font-bold tracking-[0.3em] text-slate-900">CLIENT X</p>
        <h1 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-slate-900">
          Your AI workspace for conversations, agents and execution.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Connect your channels, deploy agents and get work done — all from one calm workspace.
        </p>

        <div className="mt-8 space-y-3">
          <Link href="/login" className="block">
            <Button variant="primary-orange" size="lg" className="w-full" icon={<LogIn size={17} />}>
              Log In
            </Button>
          </Link>
          <Link href="/signup" className="block">
            <Button size="lg" className="w-full" icon={<UserPlus size={17} />}>
              Sign Up
            </Button>
          </Link>
          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-slate-300/60" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">or</span>
            <span className="h-px flex-1 bg-slate-300/60" />
          </div>
          <Button size="lg" className="w-full" icon={<Chrome size={17} />} onClick={handleGoogle}>
            Continue with Google
          </Button>
        </div>
      </Card>
    </main>
  );
}
