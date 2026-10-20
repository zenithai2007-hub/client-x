/* Client X — realistic seed data for the mock services.
   Times are generated relative to load so the demo always looks fresh. */

import type {
  ActivityEvent,
  Agent,
  AppNotification,
  Campaign,
  ClientTask,
  Conversation,
  MemoryItem,
  Message,
} from "./types";

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

let n = 0;
const id = (p: string) => `${p}_seed_${++n}`;

/* ------------------------------------------------------------------ */
/* Conversations (8)                                                   */
/* ------------------------------------------------------------------ */

export const seedConversations: Conversation[] = [
  { id: "c-sarah", name: "Sarah K.", avatarColor: "#7C3AED", lastMessage: "That works for me — let's do Thursday.", lastTime: minsAgo(4), unread: 2, online: true, platform: "WhatsApp", mentions: 1 },
  { id: "c-alex", name: "Alex R.", avatarColor: "#0EA5E9", lastMessage: "Can you send the updated quote?", lastTime: minsAgo(26), unread: 1, online: true, platform: "LinkedIn" },
  { id: "c-john", name: "John D.", avatarColor: "#F59E0B", lastMessage: "Thanks, received the files.", lastTime: hoursAgo(1.4), unread: 0, online: false, platform: "WhatsApp" },
  { id: "c-emily", name: "Emily W.", avatarColor: "#EC4899", lastMessage: "Sounds good, talk tomorrow!", lastTime: hoursAgo(3), unread: 0, online: false, platform: "Instagram" },
  { id: "c-marketing", name: "Marketing Team", avatarColor: "#10B981", lastMessage: "Mia: campaign assets are ready", lastTime: hoursAgo(5), unread: 3, online: true, platform: "WhatsApp" },
  { id: "c-project", name: "Team Project", avatarColor: "#6366F1", lastMessage: "Dev: pushed the latest build", lastTime: hoursAgo(8), unread: 0, online: false, platform: "Browser" },
  { id: "c-support", name: "Tech Support", avatarColor: "#64748B", lastMessage: "Ticket #4821 has been resolved.", lastTime: daysAgo(1), unread: 0, online: true, platform: "Website" },
  { id: "c-outreach", name: "Outreach Leads", avatarColor: "#FF7A18", lastMessage: "Agent: 3 new replies need review", lastTime: daysAgo(1.2), unread: 5, online: true, platform: "LinkedIn", mentions: 2 },
];

function thread(convoId: string, rows: [sender: "me" | "them", text: string, agoMin: number][]): Message[] {
  return rows.map(([sender, text, agoMin], i) => ({
    id: id(`m_${convoId}`),
    sender,
    text,
    time: minsAgo(agoMin),
    status: sender === "me" ? ("read" as const) : ("read" as const),
  })).sort((a, b) => a.time.localeCompare(b.time));
}

export const seedMessages: Record<string, Message[]> = {
  "c-sarah": thread("c-sarah", [
    ["them", "Hi! I saw your portfolio and I'm interested in a website for my boutique.", 190],
    ["me", "Hi Sarah! Thanks for reaching out. I'd love to help — what kind of boutique is it?", 182],
    ["them", "A handmade candle shop. I need something elegant but simple.", 175],
    ["me", "Perfect. A clean storefront with online ordering would suit you well. Our packages start at $97.", 168],
    ["them", "That sounds reasonable. How long does it usually take?", 160],
    ["me", "About 3–5 business days from confirmation.", 152],
    ["them", "Great. Can we do a quick call Thursday to go over details?", 12],
    ["them", "That works for me — let's do Thursday.", 4],
  ]),
  "c-alex": thread("c-alex", [
    ["me", "Hi Alex, following up on the automation quote I sent last week.", 300],
    ["them", "Hey! Yes, I reviewed it. A couple of questions on the API costs.", 290],
    ["me", "Of course — the API costs are pass-through, roughly $10–20/month for your volume.", 282],
    ["them", "Got it. And the setup timeline?", 275],
    ["me", "Setup takes about a week, including testing.", 268],
    ["them", "Can you send the updated quote?", 26],
  ]),
  "c-john": thread("c-john", [
    ["them", "Hi, do you handle logo design too?", 500],
    ["me", "Hi John! Yes — logo design starts at $49 as an add-on.", 495],
    ["them", "Nice. I'll bundle it with the website then.", 490],
    ["me", "Done. I've attached the brand questionnaire — fill it when you can.", 480],
    ["them", "Thanks, received the files.", 84],
  ]),
  "c-emily": thread("c-emily", [
    ["them", "Love the demo you sent! The chat felt really natural.", 700],
    ["me", "Thanks Emily! That demo runs the same engine your customers would get.", 690],
    ["them", "What's the monthly cost after setup?", 680],
    ["me", "Just $29/month for the care plan — hosting, updates and support included.", 670],
    ["them", "Sounds good, talk tomorrow!", 180],
  ]),
  "c-marketing": thread("c-marketing", [
    ["them", "Team: the Q4 content calendar is drafted.", 900],
    ["me", "Nice — can someone share the link?", 890],
    ["them", "Mia: shared in the drive, check the pinned message.", 880],
    ["them", "Leo: I'll handle the ad creatives.", 870],
    ["me", "I'll review everything by Friday.", 860],
    ["them", "Mia: campaign assets are ready", 300],
  ]),
  "c-project": thread("c-project", [
    ["them", "Dev: staging is up for review.", 1200],
    ["me", "On it — checking now.", 1190],
    ["them", "Dev: found a bug in the checkout flow, fixing.", 1100],
    ["me", "Thanks for the heads-up.", 1090],
    ["them", "Dev: pushed the latest build", 480],
  ]),
  "c-support": thread("c-support", [
    ["me", "Hi, ticket #4821 — the export button isn't working on mobile.", 1600],
    ["them", "Thanks for reporting. We've reproduced the issue and are on it.", 1590],
    ["them", "A fix has been deployed. Please try again.", 1500],
    ["me", "Confirmed working now. Thanks!", 1490],
    ["them", "Ticket #4821 has been resolved.", 1440],
  ]),
  "c-outreach": thread("c-outreach", [
    ["them", "Agent: LinkedIn batch 12 finished — 40 messages sent.", 2000],
    ["them", "Agent: 3 new replies need review", 1730],
    ["me", "On my way — I'll review them now.", 1720],
    ["them", "Agent: reminder — follow-ups are due tomorrow.", 1500],
  ]),
};

/* ------------------------------------------------------------------ */
/* Agents (9)                                                          */
/* ------------------------------------------------------------------ */

export const seedAgents: Agent[] = [
  {
    id: "ag-linkedin", name: "LinkedIn Agent", platform: "linkedin", status: "active",
    currentTask: "Outreach batch 12 — follow-ups", progress: 68,
    instructions: "You handle LinkedIn outreach. Keep messages short, professional and personal. Never send more than 10 connection requests per day. Always wait for approval before the first message to a new contact.",
    permissions: { sendMessages: true, readProfile: true, manageConnections: false, autoApprove: false },
    activity: [
      { time: minsAgo(9), text: "Sent follow-up to Ava K." },
      { time: minsAgo(31), text: "Found 12 new profiles matching the campaign criteria." },
      { time: hoursAgo(1), text: "Paused 2 targets pending approval." },
    ],
  },
  {
    id: "ag-whatsapp", name: "WhatsApp Agent", platform: "whatsapp", status: "active",
    currentTask: "Replying to Sarah K.", progress: 40,
    instructions: "You handle WhatsApp conversations in a warm, concise tone. Reply within a minute when online. Escalate pricing negotiations to the owner.",
    permissions: { sendMessages: true, readProfile: true, manageConnections: false, autoApprove: true },
    activity: [
      { time: minsAgo(4), text: "Received message from Sarah K." },
      { time: minsAgo(22), text: "Sent quote summary to John D." },
    ],
  },
  {
    id: "ag-instagram", name: "Instagram Agent", platform: "instagram", status: "ready",
    instructions: "You monitor Instagram DMs and comments. Draft replies for the owner to approve — never publish without approval.",
    permissions: { sendMessages: false, readProfile: true, manageConnections: false, autoApprove: false },
    activity: [{ time: hoursAgo(3), text: "Drafted 4 replies awaiting approval." }],
  },
  {
    id: "ag-browser", name: "Browser Agent", platform: "browser", status: "paused",
    currentTask: "Market research — competitor pricing", progress: 25,
    instructions: "You browse the web for research tasks. Never fill forms with personal data. Pause and ask if a page shows a CAPTCHA or login wall.",
    permissions: { sendMessages: false, readProfile: true, manageConnections: false, autoApprove: false },
    activity: [
      { time: hoursAgo(2), text: "Paused: competitor site showed a CAPTCHA." },
      { time: hoursAgo(4), text: "Collected pricing from 6 competitor pages." },
    ],
  },
  {
    id: "ag-website", name: "Website Agent", platform: "website", status: "offline",
    instructions: "You power the on-site chat widget. Answer FAQs from memory first; escalate anything else to the owner.",
    permissions: { sendMessages: true, readProfile: false, manageConnections: false, autoApprove: true },
    activity: [{ time: daysAgo(1), text: "Went offline — no active sessions." }],
  },
  {
    id: "ag-facebook", name: "Facebook Agent", platform: "facebook", status: "ready",
    instructions: "You monitor Facebook Page messages and comments. Draft friendly replies and wait for approval before posting anything publicly.",
    permissions: { sendMessages: false, readProfile: true, manageConnections: false, autoApprove: false },
    activity: [{ time: hoursAgo(5), text: "Drafted 2 comment replies awaiting approval." }],
  },
  {
    id: "ag-outreach", name: "Outreach Agent", platform: "outreach", status: "needs_approval",
    currentTask: "Discovery draft — Amelia Hart", progress: 30,
    instructions: "You prepare personalized outreach drafts from discovery results. Never send a first message without explicit approval. Keep drafts short and specific to the prospect.",
    permissions: { sendMessages: false, readProfile: true, manageConnections: false, autoApprove: false },
    activity: [
      { time: minsAgo(48), text: "Prepared a draft for Amelia Hart — waiting for approval." },
      { time: hoursAgo(2), text: "Built target list from the latest discovery run." },
    ],
  },
  {
    id: "ag-discovery", name: "Discovery Agent", platform: "discovery", status: "waiting",
    currentTask: "Retail founders — London", progress: 55,
    instructions: "You find people and businesses that match the user's target profile. Score every match, explain why it matched, and never invent contact details.",
    permissions: { sendMessages: false, readProfile: true, manageConnections: false, autoApprove: false },
    activity: [
      { time: minsAgo(15), text: "Waiting for the user to confirm the target filters." },
      { time: minsAgo(40), text: "Scored 24 sample candidates against the filters." },
    ],
  },
  {
    id: "ag-research", name: "Research Agent", platform: "research", status: "ready",
    instructions: "You research prospects, companies and markets, then summarize findings with sources noted. Flag anything you could not verify instead of guessing.",
    permissions: { sendMessages: false, readProfile: true, manageConnections: false, autoApprove: false },
    activity: [{ time: hoursAgo(6), text: "Summarized competitor pricing notes for the owner." }],
  },
];

/* ------------------------------------------------------------------ */
/* Tasks (3) — canonical ExecutionStatus                                */
/* ------------------------------------------------------------------ */

export const seedTasks: ClientTask[] = [
  {
    id: "task-1", title: "LinkedIn outreach batch 13", agentId: "ag-linkedin",
    status: "RUNNING", progress: 65, total: 100, createdAt: hoursAgo(2),
    detail: "Sending 40 personalized connection messages.",
  },
  {
    id: "task-2", title: "Competitor pricing research", agentId: "ag-browser",
    status: "WAITING_FOR_USER", progress: 25, total: 100, createdAt: hoursAgo(4),
    detail: "The target site requires human verification to continue.",
    prevStatus: "RUNNING",
    verification: { reason: "captcha", confirmed: false },
  },
  {
    id: "task-3", title: "Weekly activity digest", agentId: "ag-whatsapp",
    status: "COMPLETED", progress: 100, total: 100, createdAt: daysAgo(1),
    detail: "Digest compiled and delivered.", completedAt: hoursAgo(20),
  },
];

/* ------------------------------------------------------------------ */
/* Memory (8 across sections)                                          */
/* ------------------------------------------------------------------ */

export const seedMemory: MemoryItem[] = [
  { id: id("mem"), section: "global", key: "User name", value: "Zubair — prefers Roman Urdu in chat", updatedAt: daysAgo(9) },
  { id: id("mem"), section: "global", key: "Pricing rule", value: "No fixed pricing menu — quote per case by workflow complexity", updatedAt: daysAgo(2) },
  { id: id("mem"), section: "agent", key: "LinkedIn Agent — daily cap", value: "Max 10 connection requests per day", updatedAt: daysAgo(3) },
  { id: id("mem"), section: "agent", key: "WhatsApp Agent — tone", value: "Warm and concise; escalate pricing to owner", updatedAt: daysAgo(5) },
  { id: id("mem"), section: "platform", key: "LinkedIn limits", value: "Automation is restricted — keep volumes low and human-like", updatedAt: daysAgo(4) },
  { id: id("mem"), section: "conversation", key: "Sarah K. — boutique", value: "Handmade candle shop; call scheduled Thursday", updatedAt: hoursAgo(1) },
  { id: id("mem"), section: "outreach", key: "Batch 12 results", value: "40 sent, 6 replies, 2 positive", updatedAt: daysAgo(1) },
  { id: id("mem"), section: "outreach", key: "Follow-up rule", value: "One polite follow-up, 3 days after first pitch", updatedAt: daysAgo(2) },
];

/* ------------------------------------------------------------------ */
/* Activity (12)                                                       */
/* ------------------------------------------------------------------ */

export const seedActivity: ActivityEvent[] = [
  { id: id("evt"), time: minsAgo(4), category: "agents", text: "WhatsApp Agent received a message from Sarah K." },
  { id: id("evt"), time: minsAgo(9), category: "outreach", text: "LinkedIn Agent sent a follow-up to Ava K." },
  { id: id("evt"), time: minsAgo(26), category: "agents", text: "Alex R. asked for an updated quote." },
  { id: id("evt"), time: minsAgo(31), category: "outreach", text: "12 new profiles matched the campaign criteria." },
  { id: id("evt"), time: hoursAgo(1), category: "system", text: "Daily backup completed successfully." },
  { id: id("evt"), time: hoursAgo(2), category: "tasks", text: "Task 'Competitor pricing research' paused — verification needed." },
  { id: id("evt"), time: hoursAgo(3), category: "keyboard", text: "Generated a professional reply draft." },
  { id: id("evt"), time: hoursAgo(5), category: "agents", text: "Marketing Team shared campaign assets." },
  { id: id("evt"), time: hoursAgo(8), category: "system", text: "Client X updated to foundation build 0.1.0." },
  { id: id("evt"), time: daysAgo(1), category: "outreach", text: "Outreach batch 12 completed: 40 sent, 6 replies." },
  { id: id("evt"), time: daysAgo(1.2), category: "tasks", text: "Task 'Weekly activity digest' completed." },
  { id: id("evt"), time: daysAgo(2), category: "system", text: "New device signed in — session verified." },
];

/* ------------------------------------------------------------------ */
/* Notifications (4, 2 unread)                                         */
/* ------------------------------------------------------------------ */

export const seedNotifications: AppNotification[] = [
  { id: id("ntf"), title: "Approval needed", body: "LinkedIn Agent drafted a message for Ava K. — review to send.", time: minsAgo(31), read: false, kind: "approval", href: "/agents" },
  { id: id("ntf"), title: "Verification required", body: "Competitor pricing research paused — the site needs human verification.", time: hoursAgo(2), read: false, kind: "warning", href: "/tasks" },
  { id: id("ntf"), title: "Batch 12 finished", body: "40 messages sent, 6 replies received.", time: daysAgo(1), read: true, kind: "success", href: "/outreach" },
  { id: id("ntf"), title: "Welcome to Client X", body: "Your AI execution workspace is ready.", time: daysAgo(2), read: true, kind: "info", href: "/home" },
];

/* ------------------------------------------------------------------ */
/* Campaigns (1 completed, for reference)                               */
/* ------------------------------------------------------------------ */

export const seedCampaigns: Campaign[] = [
  {
    id: "camp-seed-1",
    name: "EU Founders — Batch 12",
    platform: "LinkedIn",
    goal: "Book intro calls with boutique founders",
    tone: "Professional",
    messageStyle: "Short + personalized",
    status: "COMPLETED",
    createdAt: daysAgo(2),
    targets: [
      { id: "tgt-s1", name: "Ava K.", state: "completed", status: "COMPLETED", sentAt: daysAgo(2), message: "Hi Ava — loved your candle studio's story…" },
      { id: "tgt-s2", name: "Liam R.", state: "completed", status: "COMPLETED", sentAt: daysAgo(2) },
      { id: "tgt-s3", name: "Mia D.", state: "completed", status: "COMPLETED", sentAt: daysAgo(2) },
      { id: "tgt-s4", name: "Noah W.", state: "completed", status: "COMPLETED", sentAt: daysAgo(2) },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Settings defaults                                                   */
/* ------------------------------------------------------------------ */

export const defaultSettings = {
  appearance: { theme: "light" as const, sidebarCollapsed: false, rightPanelOpen: true },
  notifications: { enabled: true, sound: true, approvalAlerts: true, agentAlerts: true },
  ai: { tone: "professional" as const, autoReply: false, approvalRequired: true },
  privacy: { readReceipts: true, onlineStatus: true },
  outreach: { defaultPlatform: "LinkedIn", dailyLimit: 40, delayBetween: 30 },
  growth: { attribution: true },
};
