"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, LogIn, Mail } from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, FieldLabel } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (user) router.replace("/home");
  }, [user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    if (login(trimmedEmail, password)) {
      router.replace("/home");
    }
  };

  const handleForgot = () => {
    setError(null);
    setResetSent(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-cx-bg px-4 py-10">
      <Card className="w-full max-w-md p-8 sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-cx-surface shadow-cx-card">
            <Image src="/logo-face.png" alt="CLIENT X" width={64} height={64} className="h-full w-full object-cover" priority />
          </div>
          <p className="mt-5 text-xs font-bold tracking-[0.3em] text-slate-900">CLIENT X</p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to your workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <div>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Password</FieldLabel>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <Button type="submit" variant="primary-orange" size="lg" className="w-full" icon={<LogIn size={17} />}>
            Log In
          </Button>
        </form>

        <div className="mt-4 text-center">
          {resetSent ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 size={14} /> Password reset link sent to your email (demo)
            </p>
          ) : (
            <button
              type="button"
              onClick={handleForgot}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-cx-purple hover:text-cx-purpleDark"
            >
              <Mail size={13} /> Forgot Password?
            </button>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-cx-purple hover:text-cx-purpleDark">
            Sign Up
          </Link>
        </p>
      </Card>
    </main>
  );
}
