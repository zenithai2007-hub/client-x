# Client X — AI Execution Workspace (Foundation)

Next.js 14 App Router + React 18 + TypeScript (strict) + Tailwind CSS 3 + Zustand +
Framer Motion + lucide-react.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run typecheck
npm run build
```

## Structure

```
app/
  layout.tsx            # root layout, metadata ("Client X"), favicon links
  globals.css           # design tokens (light premium theme)
  (app)/
    layout.tsx          # 3-panel shell: sidebar | main + TopBar | right agent panel
    page.tsx            # Home dashboard (fully wired)
    chat|agents|outreach|tasks|keyboard|memory|activity|settings/page.tsx
                        # placeholders — feature builders replace these
lib/
  types.ts              # all domain types incl. ExecutionStatus (§26)
  cn.ts                 # class-name helper
  execution.ts          # pipeline→canonical mapping, pre-action verification, CAPTCHA copy
  retry.ts              # withRetry + exponential backoff (§26)
  approval-bus.ts       # decoupled approval routing (agent store → outreach store)
  mock-data.ts          # rich seed data
  services/             # interface + mock impl per domain (chat, agent, outreach,
                        # task, memory, activity, notification)
stores/                 # 10 Zustand stores — see STORES.md
components/
  ui/                   # Button, Card, Badge, StatusBadge, Avatar, Modal, Input,
                        # Textarea, Toggle, Tabs, ProgressBar, EmptyState, Tooltip,
                        # DropdownMenu, Spinner, TypingDots, VerificationCard
  shell/                # Sidebar, TopBar, RightAgentPanel, CommandPalette,
                        # MobileNav, StoreInitializer, PlaceholderPage
```

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
