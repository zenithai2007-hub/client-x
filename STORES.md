# Client X — Store & Service Reference

Foundation contract for feature builders. **Consume these stores — do not modify them.**
Swap mock services for real backends later; the store interfaces stay the same.

## Canonical execution states (§26)

`ExecutionStatus` (`lib/types.ts`) — use EXACTLY these 8 everywhere (tasks, campaigns,
outreach targets, executions):

```
READY · RUNNING · PAUSED · WAITING_FOR_USER · RETRYING · COMPLETED · FAILED · CANCELLED
```

- Tasks (`ClientTask.status`) and campaigns (`Campaign.status`) use `ExecutionStatus` directly.
- Outreach targets keep the granular pipeline (`Target.state`: `waiting → searching →
  profile_found → reviewing → generating → waiting_approval → executing → completed`,
  plus `failed | paused | waiting_for_user`) AND a canonical `Target.status` for badges.
  Mapping lives in `lib/execution.ts → canonicalForPipeline()`
  (`waiting_approval` → `RUNNING` with `awaitingApproval: true`; the `Approval` entity drives it).
- Render states with `<StatusBadge status attempt />` (`components/ui/status-badge.tsx`).
  `RETRYING` shows `attempt` as "Retrying · n/3".

## Idempotency & in-flight guards (§26)

- Every mutating action mints a per-action UUID idempotency key and registers it in the
  store's `inFlight: InFlightMap` (`{ actionKey: uuid }`). Actions guard with
  `beginAction()` / release with `endAction()` (`stores/_helpers.ts`).
- `isInFlight(key)` is exposed on every store — **buttons must disable while their action
  is in flight** (no duplicate clicks): `disabled={store.isInFlight('send:'+id)}`.
- Dedupe guards: a target/message is never sent twice — `driveTarget` checks
  `t.sentAt || t.status === "COMPLETED"` immediately before the side effect; `resume*`
  paths skip completed targets.

## Retry (§26)

`lib/retry.ts → withRetry(fn, { maxAttempts: 3, baseDelayMs: 1000, onAttempt })` —
exponential backoff. `onAttempt` moves the entity to `RETRYING` with the attempt count
surfaced in state; after the last attempt a `RetryExhaustedError` is thrown and the
entity goes to `FAILED` with the error text. Mock services fail occasionally
(`outreach-service.sendMessage` ~8%) so the retry UI states are real.

## Pre-action verification (§26)

`lib/execution.ts → requireStatus(entityId, actual, expected, action)` and
`requirePipeline(...)` throw `StateMismatchError` when the entity is not in the expected
pre-condition. Every transition catches it and fails **gracefully** (entity → `FAILED`
with the message, activity log entry) — never silently.

## Persistence & resume (§26)

- Persisted via `zustand/middleware` `persist` (localStorage): **outreach campaigns**,
  **tasks**, **agents + approvals**, **settings**. `inFlight` is never persisted.
- `onRehydrateStorage`: any entity left `RUNNING` is re-verified then resumed —
  completed/sent targets are never repeated; pending approvals are not recreated;
  task progress is monotonic so the ticker continues without redoing work.

## CAPTCHA / human-verification flow (§26)

Client X **NEVER** bypasses, evades, or auto-solves CAPTCHAs, anti-bot challenges, rate
limits, or login challenges. On challenge the entity goes to `WAITING_FOR_USER`.

- Reusable component: `components/ui/verification-card.tsx → <VerificationCard>`
  (exact copy from `lib/execution.ts → VERIFICATION_COPY`). Phase `pending` shows the
  4 working buttons (Open Platform / I've Completed Verification / Pause Task /
  Cancel Task); phase `confirmed` shows "Verification completed" + Resume Task.
- Task actions (`useTaskStore`): `flagVerificationNeeded(id, reason?)`,
  `confirmVerification(id)`, `resumeAfterVerification(id)` (restores `prevStatus`,
  re-verifies, never repeats completed actions).
- Target actions (`useOutreachStore`): `flagTargetVerification(campaignId, targetId)`,
  `confirmTargetVerification(...)`, `resumeTargetAfterVerification(...)` (restores
  `resumeFrom`, dedupe-guarded). One demo target per campaign is flagged automatically
  so builders can see the flow.

---

## Services (`lib/services/*`)

Interface + mock class per domain; realistic async delays, no network.
`chatService` (conversations, send, contextual `generateReply`, `aiTransform`),
`agentService`, `outreachService` (`researchTarget`, `draftMessage`, `sendMessage`
occasionally throws), `taskService`, `memoryService`, `activityService`,
`notificationService`. Helpers: `lib/services/base.ts` (`delay`, `jitter`, `uid`).

## Stores

### `useUIStore` — `stores/use-ui-store.ts` (not persisted)
State: `sidebarCollapsed, rightPanelOpen, commandPaletteOpen, mobileNavOpen, activeNav: NavKey`.
Actions: `toggleSidebar(), toggleRightPanel(), setCommandPaletteOpen(b), toggleCommandPalette(), setMobileNavOpen(b), setActiveNav(nav)`.

### `useChatStore` — `stores/use-chat-store.ts`
State: `conversations, activeId, messagesByConvo: Record<id, Message[]>, tab: 'all'|'unread'|'mentions', searchQuery, typingIn, loaded, inFlight`.
Actions:
- `load()` — seeds conversations + active thread.
- `selectConversation(id)` — sets active, zeroes unread, lazy-loads history.
- `sendMessage(text)` — optimistic add → `delivered` after 900ms → typing indicator →
  contextual reply via `chatService.generateReply` → own message `read`; logs activity,
  sometimes pushes a notification. In-flight key: `send:<convoId>`.
- `markAllRead()`, `newChat(name)`, `aiTransform(text, kind): Promise<string>`
  (kinds: rewrite, professional, friendly, shorter, longer, translate, generate-reply,
  personalize, improve).
- Selectors: `filteredConversations()` (tab + search), `activeMessages()`.

### `useAgentStore` — `stores/use-agent-store.ts` (persisted: agents, activeAgentId, approvals)
State: `agents: Agent[], activeAgentId, approvals: Approval[], loaded, inFlight`.
Actions: `load(), setActiveAgent(id), pauseAgent(id), resumeAgent(id), stopAgent(id)`,
`updateInstructions(id, text)`, `togglePermission(id, key)`,
`requestApproval({agentId, target, targetId?, campaignId?, action, message}): Promise<Approval>`
(adds pending approval + notification + activity),
`resolveApproval(id, 'approved'|'cancelled'|'edited', editedText?)` — verifies pending,
updates, emits on the approval bus (`lib/approval-bus.ts`) so the owning domain continues,
`logAgentActivity(id, text)`, `pendingApprovals()`.

### `useOutreachStore` — `stores/use-outreach-store.ts` (persisted: campaigns, activeCampaignId)
State: `campaigns: Campaign[], activeCampaignId, loaded, inFlight`.
Actions:
- `load()`, `createCampaign(data: NewCampaignData): Promise<Campaign>` (status `READY`).
- `startCampaign(id)` (`READY|PAUSED → RUNNING`, launches the async pipeline driver).
- `pauseCampaign(id)` (`RUNNING → PAUSED`, invalidates the run token; pipeline positions kept).
- `resumeCampaign(id)` (`PAUSED → RUNNING`; restores canonical statuses from pipeline positions; skips completed).
- `stopCampaign(id)` (→ `CANCELLED`).
- `retryTarget(campaignId, targetId)` (`FAILED → retryFrom` stage, then re-drives).
- Verification: `flagTargetVerification`, `confirmTargetVerification`, `resumeTargetAfterVerification`
  (see §26 section above).
- Pipeline: `waiting → searching → profile_found → reviewing → generating →
  waiting_approval` (creates `Approval` via `useAgentStore.requestApproval`; the approval
  bus continues the target on resolve: approved → `executing → completed`; cancelled →
  target `PAUSED` with note) `→ executing` (`withRetry(sendMessage)`; demo target #3
  goes `WAITING_FOR_USER` instead). Campaign → `COMPLETED` when all targets terminal.

### `useTaskStore` — `stores/use-task-store.ts` (persisted: tasks)
State: `tasks: ClientTask[], loaded, inFlight`.
Actions: `load(), createTask(title, agentId, detail?): Promise<ClientTask>` (creates `READY`),
`startTask(id)` (`READY|PAUSED → RUNNING`), `pauseTask(id)`, `resumeTask(id)`
(re-verifies progress; completes instead if already at total), `stopTask(id)`
(→ `CANCELLED`), `deleteTask(id)`, `tickProgress(id)` (advances `RUNNING` tasks;
a 2s ticker drives this automatically).
Verification: `flagVerificationNeeded(id, reason?)`, `confirmVerification(id)`,
`resumeAfterVerification(id)` (see §26 section above).

### `useMemoryStore` — `stores/use-memory-store.ts`
State: `items: MemoryItem[], loaded, inFlight`.
Actions: `load(), addItem(section, key, value): Promise<MemoryItem>`,
`updateItem(id, patch)`, `deleteItem(id)`, `itemsBySection(section)`.

### `useActivityStore` — `stores/use-activity-store.ts`
State: `events: ActivityEvent[], loaded`.
Actions: `load()`, `logEvent(category, text): Promise<ActivityEvent>` (prepends, caps at 100),
`clear()`.

### `useNotificationStore` — `stores/use-notification-store.ts`
State: `notifications: AppNotification[], loaded`.
Actions: `load()`, `push(title, body, kind?): Promise<AppNotification>`,
`markRead(id)`, `markAllRead()`, `unreadCount()`.

### `useSettingsStore` — `stores/use-settings-store.ts` (persisted)
Full `Settings` object (appearance, notifications, ai, privacy, outreach).
Actions: `update(patch: Partial<Settings>)` (merges per top-level section), `reset()`.

### `useKeyboardStore` — `stores/use-keyboard-store.ts`
State: `kbInput, kbOutput, tone: professional|friendly|concise|persuasive,
language: 'en'|'ur', clipboardItems: ClipboardItem[] (cap 20), generating, inFlight`.
Actions: `setKbInput(v), setTone(t), setLanguage(l)`,
`generateTone(kind?): Promise<void>` (mock, realistic delay),
`runQuickAction(id)` (`qa-rewrite | qa-reply | qa-translate | qa-shorten`),
`insertToClipboard(text)` (writes to clipboard API + history), `clearOutput()`.

## UI components (`components/ui/`)

`Button` (variants: `primary-orange` — key actions only, `secondary`, `ghost`, `danger`;
sizes sm/md/lg/icon; `loading`; press animation), `Card` (elevated, `hover` opt),
`Badge`, `StatusBadge` (§26, 8 states), `Avatar` (initials, `online` dot),
`Modal`, `Input`, `Textarea`, `FieldLabel`, `Toggle`, `Tabs`, `ProgressBar` (animated),
`EmptyState`, `Tooltip`, `DropdownMenu`, `Spinner`, `TypingDots`, `VerificationCard` (§26).

## Shell (`components/shell/`)

`Sidebar` (logo + CLIENT X wordmark, 9 nav items, active elevated state, Active Agent
card, New Chat, collapsible; mobile drawer), `RightAgentPanel` / `AgentPanelCard`
(agent switcher, task + progress, activity checklist, Pause/Stop/Approve/View Details;
mobile via `MobileAgentSheet`), `TopBar` (title, Ctrl+K trigger, bell + dropdown),
`CommandPalette` (Ctrl+K, searches chats/agents/tasks/memory + actions, keyboard
navigable), `MobileNav` (bottom bar), `StoreInitializer`, `PlaceholderPage`.

## Rules for builders

1. Never redefine types — import from `@/lib/types`.
2. Never mutate store state directly — use actions.
3. Every button must work: disable with `isInFlight(key)` during async actions.
4. Use `StatusBadge` for all 8 canonical states; never invent new status strings.
5. The previous brand string must appear nowhere (code, comments, UI, titles, package name). No emojis in UI — Lucide icons only.

### `useReferralStore` — `stores/use-referral-store.ts` (persisted: code, stats, ledger)
Referral program state. Backed by `lib/services/referral.ts` (mock backend).
- State: `code: string`, `stats: ReferralStats`, `ledger: ReferralReward[]`, `loaded`
- Actions: `load()` (hydrates mock backend from persisted snapshot first), `inviteUrl()` (absolute `/invite/<code>`), `recordInviteSent(channel)` (+1 sent, ledger entry, activity log), `simulateFriendJoined()` (demo helper: +1 joined, +50 credits, notification)

### `useTemplateStore` — `stores/use-template-store.ts` (persisted: user-published templates only)
Community template gallery. Seeded with 8 mock templates (agent/style/outreach kinds).
- Actions: `load()` (merges seeds + persisted mine), `search(q, kind)`, `publish({kind,title,description,payload})` (idempotent key, adds `mine: true`), `useTemplate(id)` → clones into workspace and returns `{ navigate }`:
  - `agent` → `useAgentStore.createAgent(...)` → navigate `/agents/<id>`
  - `style` → applies tone to settings + memory item → navigate `/chats`
  - `outreach` → navigate `/outreach?template=<id>` (builder prefills via `BuilderInitial`)

## Growth services
- `lib/services/sharing.ts` — `shareTextFor(kind,title,extra)` (includes "Made with Client X"), `shareUrlFor(channel,text,url)` (WhatsApp wa.me, X intent, LinkedIn share-offsite, Telegram, mailto), `openShare`, `copyText` (clipboard + fallback), `canSystemShare`/`systemShare` (Web Share API → clipboard fallback), `appUrl(path)`.
- `lib/services/referral.ts` — mock referral backend: `getDashboard`, `hydrate(snapshot)`, `inviteUrl(code)`, `recordInviteSent(channel)`, `simulateFriendJoined` (demo), credit constants (inviter 50, invitee 25).

## Growth UI (`components/growth/`)
- `ShareButton` — ghost/icon button → platform dropdown (WhatsApp/X/LinkedIn/Telegram/Email/Copy link/System share). Props: `kind: ShareKind`, `title`, `extra?`, `sharePath`.
- `Attribution` — "Made with Client X" line; hidden when `settings.growth.attribution` is off.
- `ShareNudge` — tasteful one-line sharing nudge linking to `/referrals`.
- `PublishModal` — publish agent/style/outreach payloads to the gallery.
- Public routes (no app shell): `/invite/[code]` (invite landing + claim), `/share/[kind]/[id]` (branded shareable view; `output` kind via `?text=&label=`).
