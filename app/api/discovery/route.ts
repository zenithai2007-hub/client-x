import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { ok, fail, unauthorized, internalError, parseJsonBody, isNonEmptyString } from "@/lib/server/http";

interface SampleLead {
  id: string;
  name: string;
  company: string;
  role: string;
  location: string;
  profileUrl: string | null;
}

const SAMPLE_LEADS: SampleLead[] = [
  { id: "lead-sample-1", name: "Ava K.", company: "Glow Candle Studio", role: "Founder", location: "London, UK", profileUrl: null },
  { id: "lead-sample-2", name: "Liam R.", company: "Northline Athletics", role: "Co-founder", location: "Manchester, UK", profileUrl: null },
  { id: "lead-sample-3", name: "Mia D.", company: "Atelier Mia", role: "Owner", location: "Berlin, DE", profileUrl: null },
];

export async function POST(req: NextRequest) {
  try {
    if (!requireSession(req)) return unauthorized();
    const body = await parseJsonBody(req);
    if (!body) return fail("Malformed request body");
    if (!isNonEmptyString(body.target)) return fail("target is required");
    if (!isNonEmptyString(body.industry)) return fail("industry is required");
    // Honest: no live data source is connected, so discovery returns
    // clearly-labeled sample results only.
    return ok(
      {
        results: SAMPLE_LEADS,
        note: "Sample demo data — connect a data source to go live",
      },
      200,
    );
  } catch {
    return internalError();
  }
}
