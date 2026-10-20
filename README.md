# Client X — AI Execution Workspace

Next.js 14 App Router + React 18 + TypeScript (strict) + Tailwind CSS 3 + Zustand +
Framer Motion + lucide-react.

## Architecture

Client X has two data layers that deliberately do not mix:

1. **Client working state (today's UI).** The pages under `app/(app)/` read and
   write Zustand persisted stores under `stores/`, which call the mock service
   interfaces in `lib/services/*` seeded from `lib/mock-data.ts`. This is the
   fast, fully offline demo surface.
2. **Server boundary (production path).** `app/api/` exposes real route
   handlers. They authenticate via `lib/server/auth.ts`, talk to the
   repository seam in `lib/server/db.ts`, and return a strict envelope:
   `{ ok: true, data }` or `{ ok: false, error }`. The repositories are backed
   by in-memory seed data today; when `DATABASE_URL` is set they are the
   single place that swaps to Postgres — the schema for that swap lives in
   `prisma/schema.prisma` and no route handler changes when it lands.
   `lib/server/*` modules are server-only: no `"use client"`, no
   `localStorage`, no Zustand imports.

```
app/
  layout.tsx            # root layout, metadata ("Client X"), favicon links
  globals.css           # design tokens (light premium theme)
  api/                  # server route handlers (see "API routes" below)
  (app)/                # 3-panel workspace (client stores)
lib/
  types.ts              # all domain types incl. ExecutionStatus (§26)
  cn.ts                 # class-name helper
  execution.ts          # pipeline→canonical mapping, pre-action verification, CAPTCHA copy
  retry.ts              # withRetry + exponential backoff (§26)
  approval-bus.ts       # decoupled approval routing (agent store → outreach store)
  mock-data.ts          # rich seed data
  services/             # interface + mock impl per domain (chat, agent, outreach,
                        # task, memory, activity, notification)
  server/
    db.ts               # repository seam (in-memory now, Postgres when DATABASE_URL set)
    auth.ts             # clientx_session cookie -> session (mock-backed)
    http.ts             # { ok, data } / { ok: false, error } helpers
    platforms.ts        # honest platform availability metadata
stores/                 # 10 Zustand stores — see STORES.md
components/
  ui/                   # Button, Card, Badge, StatusBadge, Avatar, Modal, Input,
                        # Textarea, Toggle, Tabs, ProgressBar, EmptyState, Tooltip,
                        # DropdownMenu, Spinner, TypingDots, VerificationCard
  shell/                # Sidebar, TopBar, RightAgentPanel, CommandPalette,
                        # MobileNav, StoreInitializer, PlaceholderPage
prisma/
  schema.prisma         # Postgres schema for the production swap (documentation)
```

### What is honestly NOT real yet

- **No live database.** The API repositories run in memory; writes reset on
  restart. `prisma/schema.prisma` is not connected to any database, and no
  Prisma client is installed yet.
- **No live OAuth or platform connections.** Authentication is mock-backed: any
  non-empty `clientx_session` cookie resolves to a demo user, and no platform
  (WhatsApp, LinkedIn, Instagram, …) is connected to anything. Routes enforce
  the boundary (missing cookie → `401`) but there is no real provider behind
  it yet.
- **Discovery returns labeled sample data**, not live lead results.

## API routes

All routes return `{ ok: true, data }` or `{ ok: false, error }`. Except for
`/api/health`, every route requires a valid `clientx_session` cookie and
returns `401 { ok: false, error: "Unauthorized" }` without one. Request
bodies are validated minimally (empty/malformed bodies → `400`).

| Method | Route | Purpose |
| ------ | ----- | ------- |
| GET | `/api/health` | Liveness: `{ status: "ok", time }` |
| GET | `/api/auth/session` | Current session user, or 401 |
| GET | `/api/chats` | List conversations |
| GET | `/api/messages?conversationId=` | List messages in a conversation |
| POST | `/api/messages` | Create a message `{ conversationId, text }` |
| GET | `/api/agents` | List agents |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create a task `{ title, agentId, detail? }` |
| PATCH | `/api/tasks/:id` | Update task `{ status }` (canonical §26 states) |
| GET | `/api/platforms` | Honest platform availability list (nothing connected) |
| GET | `/api/platforms/:platform` | One platform's availability + integration notes |
| POST | `/api/discovery` | `{ target, industry, … }` → labeled sample leads |
| GET | `/api/outreach` | List campaigns |
| POST | `/api/outreach` | Create a campaign **draft** (nothing is sent) |
| GET | `/api/approvals` | List approvals |
| POST | `/api/approvals` | Resolve `{ approvalId, approved }` |
| GET | `/api/notifications` | List notifications |
| GET | `/api/memory` | List memory items |
| POST | `/api/memory` | Add a memory item `{ section, key, value }` |
| DELETE | `/api/memory?id=` | Delete a memory item |
| GET | `/api/activity?category=` | List activity events (optional category filter) |

## Platform honesty policy

Non-negotiable, enforced in code (see `lib/server/platforms.ts`):

- **No fake "Connected" / "Linked" / OAuth-complete / QR-paired states.**
  A platform is described only by an accurate availability status:
  **Supported / OAuth Available / API Available / Requires configuration /
  Coming Soon / Unavailable**.
- Connect flows must end honestly when no official integration is
  configured — the user is told what is missing, never shown a fabricated
  success.
- Platform credentials live server-side only (see `.env.example`) and are
  never read from, or written to, client-facing JSON.

## Environment variables

Copy `.env.example` to `.env.local`. Names only — no real values in git:

- `DATABASE_URL` — Postgres DSN; blank = in-memory repositories.
- `AUTH_SECRET` / `NEXTAUTH_SECRET` — session signing secret.
- `NEXTAUTH_URL` — public base URL of the deployment.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `LINKEDIN_CLIENT_ID`,
  `LINKEDIN_CLIENT_SECRET` — OAuth app credentials, server-side only.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run typecheck
npm run build
```

## Deployment

- Hosted on **Vercel**, target **production**. Pushing to the production
  branch deploys automatically (`git push` → production build).
- Set the environment variables above in the Vercel project settings
  (Production scope). Secrets go in the platform's secret store — never in
  the repository.
- Production build: `npm run build` (same command Vercel runs).

## Design tokens

- `--cx-purple: #7C3AED` — AI/intelligence accents
- `--cx-orange: #FF7A18` — key actions only, used sparingly
- Background `#F7F8FC`, white panels, `border-slate-200/70`, soft shadows
- Rounded-2xl cards, Inter font (system fallback)

## Contracts

- **STORES.md** is the builder contract: state shapes, action signatures, §26
  reliable-execution semantics (canonical states, idempotency, retry, persistence,
  pre-action verification, CAPTCHA flow).
- Brand is **CLIENT X** — the previous brand string must never appear.
- No emojis in UI — Lucide icons only.
