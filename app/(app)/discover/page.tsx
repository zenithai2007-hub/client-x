"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Compass, Megaphone, Search, User } from "lucide-react";
import {
  discoveryCandidates,
  DISCOVERY_GOALS,
  DISCOVERY_PLATFORMS,
  type DiscoveryCandidate,
} from "@/lib/discovery-data";
import { useOutreachStore } from "@/stores/use-outreach-store";
import { useUIStore } from "@/stores/use-ui-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, FieldLabel } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";

interface DiscoveryForm {
  target: string;
  industry: string;
  location: string;
  jobTitle: string;
  companySize: string;
  budget: string;
  service: string;
  keywords: string;
  platforms: string[];
  goal: string;
}

interface ScoredResult {
  candidate: DiscoveryCandidate;
  score: number;
  reasons: string[];
}

const SELECT_CLASS =
  "w-full rounded-xl bg-cx-bg px-3.5 py-2.5 text-sm text-slate-900 shadow-cx-inset transition-shadow focus:bg-[#F2F4F9] focus:outline-none focus:ring-2 focus:ring-cx-purple/25";

function norm(s: string) {
  return s.trim().toLowerCase();
}

function scoreCandidate(c: DiscoveryCandidate, f: DiscoveryForm): ScoredResult | null {
  let score = 0;
  const reasons: string[] = [];

  if (f.platforms.length > 0 && !f.platforms.includes(c.platform)) return null;

  if (norm(f.industry)) {
    if (norm(c.industry) === norm(f.industry)) {
      score += 25;
      reasons.push(`Industry matches: ${c.industry}`);
    } else if (!norm(c.industry).includes(norm(f.industry))) {
      return null;
    }
  }
  if (norm(f.location)) {
    if (norm(c.location) === norm(f.location)) {
      score += 20;
      reasons.push(`Located in ${c.location}`);
    } else {
      return null;
    }
  }
  if (norm(f.jobTitle)) {
    if (c.type === "person" && norm(c.jobTitle).includes(norm(f.jobTitle))) {
      score += 15;
      reasons.push(`Role: ${c.jobTitle}`);
    } else if (c.type === "person") {
      return null;
    } else {
      return null;
    }
  }
  if (norm(f.companySize)) {
    if (c.companySize === f.companySize.trim()) {
      score += 10;
      reasons.push(`Company size ${c.companySize}`);
    } else {
      return null;
    }
  }
  if (norm(f.budget)) {
    if (c.budget === f.budget.trim()) {
      score += 10;
      reasons.push(`Budget range ${c.budget}`);
    } else {
      return null;
    }
  }
  if (norm(f.service)) {
    const hit = c.services.find((s) => norm(s).includes(norm(f.service)));
    if (hit) {
      score += 15;
      reasons.push(`Needs: ${hit}`);
    } else {
      return null;
    }
  }
  if (norm(f.target)) {
    const t = norm(f.target);
    if (t === "people" || t === "person" || t === "persons") {
      if (c.type !== "person") return null;
      score += 5;
      reasons.push("Person match");
    } else if (t === "companies" || t === "company" || t === "businesses" || t === "business") {
      if (c.type !== "company") return null;
      score += 5;
      reasons.push("Company match");
    } else if (norm(c.name).includes(t)) {
      score += 10;
      reasons.push("Name matches your target");
    } else {
      return null;
    }
  }
  const kws = f.keywords
    .split(",")
    .map((k) => norm(k))
    .filter(Boolean);
  if (kws.length > 0) {
    const hits = kws.filter((k) =>
      c.keywords.some((ck) => norm(ck).includes(k) || k.includes(norm(ck)))
    );
    if (hits.length === 0) return null;
    score += hits.length * 5;
    reasons.push(`Keywords: ${hits.join(", ")}`);
  }

  if (f.goal === "Find businesses" && c.type !== "company") return null;
  if (f.goal === "Find potential clients" || f.goal === "Find leads") score += 5;
  if (f.goal === "Find freelance projects" && (c.platform === "Upwork" || c.platform === "Fiverr")) {
    score += 10;
    reasons.push("Freelance marketplace listing");
  }
  if (f.goal === "Find partnership opportunities" && c.type === "company") {
    score += 8;
    reasons.push("Company — partnership candidate");
  }

  if (reasons.length === 0) reasons.push("Matches your platform selection");
  return { candidate: c, score: Math.min(98, 45 + score), reasons };
}

export default function DiscoverPage() {
  const router = useRouter();
  const createCampaign = useOutreachStore((s) => s.createCampaign);
  const setActiveNav = useUIStore((s) => s.setActiveNav);

  const [form, setForm] = useState<DiscoveryForm>({
    target: "",
    industry: "",
    location: "",
    jobTitle: "",
    companySize: "",
    budget: "",
    service: "",
    keywords: "",
    platforms: [],
    goal: DISCOVERY_GOALS[0],
  });
  const [results, setResults] = useState<ScoredResult[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const set = (patch: Partial<DiscoveryForm>) => setForm((f) => ({ ...f, ...patch }));

  const togglePlatform = (name: string) =>
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(name)
        ? f.platforms.filter((p) => p !== name)
        : [...f.platforms, name],
    }));

  const runDiscovery = () => {
    const scored = discoveryCandidates
      .map((c) => scoreCandidate(c, form))
      .filter((r): r is ScoredResult => r !== null)
      .sort((a, b) => b.score - a.score);
    setResults(scored);
  };

  const createDraft = async (r: ScoredResult) => {
    if (busyId) return;
    setBusyId(r.candidate.id);
    try {
      await createCampaign({
        name: `Discovery draft — ${r.candidate.name}`,
        platform: r.candidate.platform,
        goal: form.goal,
        tone: "Professional",
        messageStyle: "Short + personalized",
        targetNames: [r.candidate.name],
      });
      setActiveNav("outreach");
      router.push("/outreach");
    } finally {
      setBusyId(null);
    }
  };

  const resultCount = useMemo(() => results?.length ?? 0, [results]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Compass size={20} className="text-cx-purple" /> Discover
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Describe who you are looking for and Client X searches for matching people and
          businesses. Results below come from the built-in sample dataset for this demo
          workspace.
        </p>
      </div>

      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FieldLabel>Target</FieldLabel>
            <Input
              value={form.target}
              onChange={(e) => set({ target: e.target.value })}
              placeholder="e.g. people, companies, or a name"
              aria-label="Target"
            />
          </div>
          <div>
            <FieldLabel>Industry</FieldLabel>
            <Input
              value={form.industry}
              onChange={(e) => set({ industry: e.target.value })}
              placeholder="e.g. Retail"
              aria-label="Industry"
            />
          </div>
          <div>
            <FieldLabel>Location</FieldLabel>
            <Input
              value={form.location}
              onChange={(e) => set({ location: e.target.value })}
              placeholder="e.g. London"
              aria-label="Location"
            />
          </div>
          <div>
            <FieldLabel>Job title</FieldLabel>
            <Input
              value={form.jobTitle}
              onChange={(e) => set({ jobTitle: e.target.value })}
              placeholder="e.g. Founder"
              aria-label="Job title"
            />
          </div>
          <div>
            <FieldLabel>Company size</FieldLabel>
            <select
              className={SELECT_CLASS}
              value={form.companySize}
              onChange={(e) => set({ companySize: e.target.value })}
              aria-label="Company size"
            >
              <option value="">Any size</option>
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="200+">200+</option>
            </select>
          </div>
          <div>
            <FieldLabel>Budget</FieldLabel>
            <select
              className={SELECT_CLASS}
              value={form.budget}
              onChange={(e) => set({ budget: e.target.value })}
              aria-label="Budget"
            >
              <option value="">Any budget</option>
              <option value="Under $500">Under $500</option>
              <option value="$500-$2k">$500-$2k</option>
              <option value="$2k-$5k">$2k-$5k</option>
              <option value="$5k+">$5k+</option>
            </select>
          </div>
          <div>
            <FieldLabel>Service needed</FieldLabel>
            <Input
              value={form.service}
              onChange={(e) => set({ service: e.target.value })}
              placeholder="e.g. website, ai agent, booking"
              aria-label="Service needed"
            />
          </div>
          <div>
            <FieldLabel>Keywords</FieldLabel>
            <Input
              value={form.keywords}
              onChange={(e) => set({ keywords: e.target.value })}
              placeholder="Comma separated, e.g. boutique, gym"
              aria-label="Keywords"
            />
          </div>
          <div>
            <FieldLabel>Goal</FieldLabel>
            <select
              className={SELECT_CLASS}
              value={form.goal}
              onChange={(e) => set({ goal: e.target.value })}
              aria-label="Goal"
            >
              {DISCOVERY_GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel>Platforms</FieldLabel>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Platforms">
            {DISCOVERY_PLATFORMS.map((name) => {
              const active = form.platforms.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => togglePlatform(name)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "bg-cx-purpleLight text-cx-purpleDark shadow-cx-raised-sm"
                      : "bg-cx-surface text-slate-500 shadow-cx-card hover:text-slate-800"
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Leave all unselected to search every platform in the sample dataset.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            variant="primary-orange"
            icon={<Search size={16} />}
            onClick={runDiscovery}
          >
            Start Discovery
          </Button>
          {results !== null && (
            <span className="text-sm text-slate-500" role="status">
              {resultCount} match{resultCount === 1 ? "" : "es"} found
            </span>
          )}
        </div>
      </Card>

      {results !== null &&
        (results.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No matches found"
            description="No one in the sample dataset matches those filters. Try widening the industry, location or keywords."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => {
              const c = r.candidate;
              const Icon = c.type === "person" ? User : Building2;
              return (
                <Card key={c.id} className="flex flex-col p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cx-purpleLight text-cx-purpleDark shadow-cx-card">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                      <p className="text-xs capitalize text-slate-400">
                        {c.type}
                        {c.jobTitle ? ` · ${c.jobTitle}` : ""} · {c.location}
                      </p>
                    </div>
                    <Badge tone={r.score >= 80 ? "green" : r.score >= 65 ? "blue" : "amber"}>
                      {r.score}%
                    </Badge>
                  </div>

                  <dl className="mt-3 space-y-1.5 text-xs">
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 font-medium text-slate-400">Platform</dt>
                      <dd className="text-slate-700">{c.platform}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 font-medium text-slate-400">Relevance</dt>
                      <dd className="text-slate-700">{r.score}% match</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 font-medium text-slate-400">Reason</dt>
                      <dd className="text-slate-700">{r.reasons.join("; ")}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 font-medium text-slate-400">
                        Suggested action
                      </dt>
                      <dd className="text-slate-700">
                        Create an outreach draft for {c.name} on {c.platform}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 font-medium text-slate-400">Contact status</dt>
                      <dd className="text-slate-700">{c.contactStatus}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex-1" />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    icon={<Megaphone size={14} />}
                    loading={busyId === c.id}
                    disabled={busyId !== null && busyId !== c.id}
                    onClick={() => createDraft(r)}
                  >
                    Create outreach draft
                  </Button>
                </Card>
              );
            })}
          </div>
        ))}
    </div>
  );
}
