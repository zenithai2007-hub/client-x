"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Chrome,
  ClipboardList,
  Compass,
  LogIn,
  Megaphone,
  MessagesSquare,
  ShieldCheck,
  UserPlus,
  Workflow,
  BarChart3,
} from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PLATFORM_REGISTRY } from "@/lib/platforms";

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

const FEATURES = [
  {
    icon: Bot,
    title: "AI Agents",
    text: "Platform agents that draft, reply and execute authorized work on your behalf.",
  },
  {
    icon: Compass,
    title: "Multi-platform client discovery",
    text: "Describe who you need — Client X finds matching people and businesses across platforms.",
  },
  {
    icon: Megaphone,
    title: "Smart outreach",
    text: "Personalized outreach campaigns with human approval before anything is sent.",
  },
  {
    icon: MessagesSquare,
    title: "Conversation workspace",
    text: "Every client conversation in one calm, organized workspace.",
  },
  {
    icon: Workflow,
    title: "Task automation",
    text: "Turn repeat work into tasks your agents carry out step by step.",
  },
  {
    icon: CheckCircle2,
    title: "Approvals",
    text: "Nothing goes out without you saying yes. Review, edit or cancel any draft.",
  },
  {
    icon: Brain,
    title: "Memory",
    text: "Your agents remember your rules, clients and preferences across sessions.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    text: "See what your agents did, what is running, and where the results came from.",
  },
];

const HOW_IT_WORKS = [
  "Connect platforms",
  "Define your target",
  "Client X finds opportunities",
  "AI prepares personalized outreach",
  "User approves",
  "Agent executes authorized actions",
  "Results appear in activity",
];

const SECURITY_POINTS = [
  {
    title: "User-controlled actions",
    text: "Agents only take actions you have authorized — you stay in control at all times.",
  },
  {
    title: "Official integrations",
    text: "Platforms connect through their official integration paths, never unofficial shortcuts.",
  },
  {
    title: "Approval controls",
    text: "Sensitive actions wait for your review and approval before they run.",
  },
  {
    title: "Secure authentication",
    text: "Sign in securely to your own workspace; your sessions stay yours.",
  },
  {
    title: "Manual verification when required",
    text: "If a platform asks for human verification, the agent pauses and waits for you. CAPTCHA and manual verification are never bypassed.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);

  const handleGoogle = () => {
    loginWithGoogle();
    router.replace("/home");
  };

  return (
    <main className="min-h-screen bg-cx-bg">
      <LandingRedirect />

      {/* ------------------------------ Hero ------------------------------ */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-12 sm:pt-16">
        <Card className="p-6 text-center sm:p-10">
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
          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-cx-purple">
            Your AI workspace for finding, managing and communicating with clients.
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Find clients. Start conversations. Let AI handle the busy work.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500">
            Connect your platforms, describe the clients you want, and let your agents prepare
            the outreach — you approve every step before anything happens.
          </p>

          <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3">
            <Link href="/signup" className="block">
              <Button
                variant="primary-orange"
                size="lg"
                className="w-full"
                icon={<UserPlus size={17} />}
              >
                Get Started
              </Button>
            </Link>
            <Link href="/login" className="block">
              <Button size="lg" className="w-full" icon={<LogIn size={17} />}>
                Log in
              </Button>
            </Link>
            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-slate-300/60" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                or
              </span>
              <span className="h-px flex-1 bg-slate-300/60" />
            </div>
            <Button size="lg" className="w-full" icon={<Chrome size={17} />} onClick={handleGoogle}>
              Continue with Google
            </Button>
          </div>
        </Card>
      </section>

      {/* ---------------------------- Features ---------------------------- */}
      <section aria-labelledby="features-heading" className="mx-auto w-full max-w-5xl px-4 pb-16">
        <h2
          id="features-heading"
          className="text-center text-2xl font-bold tracking-tight text-slate-900"
        >
          Everything you need to win clients
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-500">
          One workspace for discovery, outreach, conversations and follow-through.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cx-purpleLight text-cx-purpleDark shadow-cx-card">
                <Icon size={18} />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ----------------------- Platform ecosystem ---------------------- */}
      <section aria-labelledby="platforms-heading" className="mx-auto w-full max-w-5xl px-4 pb-16">
        <h2
          id="platforms-heading"
          className="text-center text-2xl font-bold tracking-tight text-slate-900"
        >
          A platform ecosystem built for discovery
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-500">
          Client X is designed to work across the platforms where your clients already are.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PLATFORM_REGISTRY.map((p) => (
            <Card key={p.id} className="p-4 text-center">
              <span
                aria-hidden="true"
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.name.slice(0, 1)}
              </span>
              <p className="mt-2 truncate text-sm font-semibold text-slate-800">{p.name}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-slate-400">{p.category}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* --------------------------- How it works -------------------------- */}
      <section aria-labelledby="how-heading" className="mx-auto w-full max-w-5xl px-4 pb-16">
        <h2
          id="how-heading"
          className="text-center text-2xl font-bold tracking-tight text-slate-900"
        >
          How it works
        </h2>
        <ol className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step}>
              <Card className="flex items-center gap-3 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cx-surface text-sm font-bold text-cx-purple shadow-cx-card">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-slate-800">{step}</span>
                {i === HOW_IT_WORKS.length - 1 && (
                  <ClipboardList size={16} className="ml-auto shrink-0 text-slate-300" />
                )}
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* ----------------------------- Security ---------------------------- */}
      <section aria-labelledby="security-heading" className="mx-auto w-full max-w-5xl px-4 pb-16">
        <h2
          id="security-heading"
          className="text-center text-2xl font-bold tracking-tight text-slate-900"
        >
          Safe by design
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-500">
          Your accounts, your rules. Client X never acts behind your back.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY_POINTS.map(({ title, text }) => (
            <Card key={title} className="p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cx-orangeLight text-cx-orangeDark shadow-cx-card">
                <ShieldCheck size={18} />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/signup" className="inline-block">
            <Button variant="primary-orange" size="lg" icon={<ArrowRight size={17} />}>
              Get Started
            </Button>
          </Link>
          <p className="mt-6 text-xs text-slate-400">
            CLIENT X — Your AI workspace for finding, managing and communicating with clients.
          </p>
        </div>
      </section>
    </main>
  );
}
