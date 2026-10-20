/* Client X — server-side data layer (repository seam).
   ====================================================================
   This module is SERVER-ONLY. It is imported by app/api route handlers
   and must never be imported from client components: it has no
   "use client" directive, and it never reads localStorage, cookies
   from the browser, or any zustand store.

   Architecture
   ------------
   Every domain entity sits behind a repository with the same shape:

       list(filter?) -> T[]
       get(id)       -> T | null
       create(data)  -> T
       update(id,    patch) -> T | null
       delete(id)    -> boolean

   Right now every repository is backed by an in-memory store seeded
   from `@/lib/mock-data`, so the API layer works with zero external
   setup. This is a deliberate seam, not a dead end:

   ## Postgres swap (production path)

   When `DATABASE_URL` is set in the environment (`USE_POSTGRES`
   below flips to `true`), the same repository methods are the place
   to target Postgres — e.g. via the Prisma Client generated from
   `prisma/schema.prisma`. Callers (the route handlers) depend only
   on the repository interface, so swapping the backing store means
   changing this file only. Nothing else in the codebase imports the
   seed data for server reads.

   Until that swap lands, in-memory writes live for the lifetime of
   the Node process only and are reset on restart — treat them as
   demo data. No real database is connected yet.

   Secrets rule
   -----------
   Nothing in this layer reads, logs, or returns credentials, API
   keys, or tokens. Platform connection metadata lives server-side
   only and is never serialised into client-facing JSON.
   ==================================================================== */

import {
  seedConversations,
  seedMessages,
  seedAgents,
  seedTasks,
  seedMemory,
  seedActivity,
  seedNotifications,
  seedCampaigns,
} from "@/lib/mock-data";
import type {
  ActivityEvent,
  Agent,
  AppNotification,
  Approval,
  Campaign,
  ClientTask,
  Conversation,
  ExecutionStatus,
  MemoryItem,
  MemorySection,
  Message,
} from "@/lib/types";

/** True when a Postgres DSN is configured. Repositories would target
 *  Postgres in this mode (see the seam note above); the in-memory
 *  fallback keeps the app runnable without one. */
const USE_POSTGRES = !!process.env.DATABASE_URL;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

let counter = 0;
const serverId = (prefix: string) =>
  `${prefix}_srv_${(++counter).toString(36)}${Date.now().toString(36)}`;

const nowIso = () => new Date().toISOString();

/** Minimal in-memory table. `T` always carries a string `id`. */
class Table<T extends { id: string }> {
  private rows: T[];

  constructor(seed: T[]) {
    // Deep-clone so repository writes never mutate the shared seed
    // module that the client bundles also import.
    this.rows = seed.map((r) => structuredClone(r));
  }

  list(filter?: (row: T) => boolean): T[] {
    const rows = filter ? this.rows.filter(filter) : this.rows;
    return rows.map((r) => structuredClone(r));
  }

  get(id: string): T | null {
    const row = this.rows.find((r) => r.id === id) ?? null;
    return row ? structuredClone(row) : null;
  }

  insert(row: T): T {
    this.rows.push(structuredClone(row));
    return structuredClone(row);
  }

  update(id: string, patch: Partial<T>): T | null {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.rows[idx] = { ...this.rows[idx], ...patch };
    return structuredClone(this.rows[idx]);
  }

  remove(id: string): boolean {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.rows.splice(idx, 1);
    return true;
  }
}

/** Demo user record. Authentication is mock-backed for now (see
 *  lib/server/auth.ts); this shape mirrors the `User` model in
 *  prisma/schema.prisma minus any credential material, which is
 *  never stored here or returned to a client. */
export interface ServerUser {
  id: string;
  email: string;
  name: string;
  plan: string;
  createdAt: string;
}

const demoUser: ServerUser = {
  id: "user_demo",
  email: "demo@clientx.app",
  name: "Demo User",
  plan: "demo",
  createdAt: nowIso(),
};

/* ------------------------------------------------------------------ */
/* Repository implementations                                          */
/* ------------------------------------------------------------------ */

const conversationsTable = new Table<Conversation>(seedConversations);
const agentsTable = new Table<Agent>(seedAgents);
const tasksTable = new Table<ClientTask>(seedTasks);
const notificationsTable = new Table<AppNotification>(seedNotifications);
const memoriesTable = new Table<MemoryItem>(seedMemory);
const activityTable = new Table<ActivityEvent>(seedActivity);
const campaignsTable = new Table<Campaign>(seedCampaigns);

// Messages are keyed by conversation id, mirroring seedMessages.
const messagesByConversation = new Map<string, Message[]>(
  Object.entries(seedMessages).map(([cid, msgs]) => [cid, msgs.map((m) => ({ ...m }))]),
);

// Approvals have no seed module yet; they start empty and are created
// by the approvals route / future agent runs.
const approvalsTable = new Table<Approval>([]);

export const db = {
  /** True when DATABASE_URL is set — i.e. the production Postgres
   *  target is configured behind this seam. */
  usingPostgres: USE_POSTGRES,

  users: {
    list: (): ServerUser[] => [structuredClone(demoUser)],
    get: (id: string): ServerUser | null =>
      id === demoUser.id ? structuredClone(demoUser) : null,
    create: (data: { email: string; name: string }): ServerUser => ({
      id: serverId("user"),
      email: data.email,
      name: data.name,
      plan: "demo",
      createdAt: nowIso(),
    }),
  },

  sessions: {
    /** Sessions are validated by lib/server/auth.ts against the
     *  `clientx_session` cookie. Records here are opaque ids only —
     *  never cookie values or tokens. */
    get: (userId: string): { userId: string; createdAt: string } | null =>
      userId === demoUser.id ? { userId, createdAt: demoUser.createdAt } : null,
  },

  conversations: {
    list: () => conversationsTable.list(),
    get: (id: string) => conversationsTable.get(id),
    create: (data: { name: string; platform?: string }): Conversation => {
      const convo: Conversation = {
        id: serverId("c"),
        name: data.name,
        avatarColor: "#64748B",
        lastMessage: "",
        lastTime: nowIso(),
        unread: 0,
        online: false,
        platform: data.platform,
      };
      return conversationsTable.insert(convo);
    },
    update: (id: string, patch: Partial<Conversation>) =>
      conversationsTable.update(id, patch),
    delete: (id: string) => conversationsTable.remove(id),
  },

  messages: {
    list: (conversationId: string): Message[] =>
      (messagesByConversation.get(conversationId) ?? []).map((m) => ({ ...m })),
    create: (conversationId: string, data: { text: string; sender?: "me" | "them" }): Message => {
      const message: Message = {
        id: serverId("m"),
        sender: data.sender ?? "me",
        text: data.text,
        time: nowIso(),
        status: "sent",
      };
      const thread = messagesByConversation.get(conversationId) ?? [];
      thread.push(message);
      messagesByConversation.set(conversationId, thread);
      return { ...message };
    },
  },

  agents: {
    list: () => agentsTable.list(),
    get: (id: string) => agentsTable.get(id),
    update: (id: string, patch: Partial<Agent>) => agentsTable.update(id, patch),
  },

  tasks: {
    list: () => tasksTable.list(),
    get: (id: string) => tasksTable.get(id),
    create: (data: {
      title: string;
      agentId: string;
      detail?: string;
      status?: ExecutionStatus;
    }): ClientTask => {
      const task: ClientTask = {
        id: serverId("task"),
        title: data.title,
        agentId: data.agentId,
        status: data.status ?? "READY",
        progress: 0,
        total: 100,
        createdAt: nowIso(),
        detail: data.detail,
      };
      return tasksTable.insert(task);
    },
    update: (id: string, patch: Partial<ClientTask>) => tasksTable.update(id, patch),
    delete: (id: string) => tasksTable.remove(id),
  },

  platforms: {
    /** Platform metadata is defined statically in the platforms API
     *  route (honest availability only). This repository exists so a
     *  production swap can persist per-user connection state without
     *  changing route handlers. It starts empty: no platform is
     *  connected for anyone until a real integration is configured. */
    list: (): never[] => [],
  },

  approvals: {
    list: () => approvalsTable.list(),
    get: (id: string) => approvalsTable.get(id),
    create: (data: Omit<Approval, "id" | "status" | "createdAt">): Approval => {
      const approval: Approval = {
        ...data,
        id: serverId("appr"),
        status: "pending",
        createdAt: nowIso(),
      };
      return approvalsTable.insert(approval);
    },
    resolve: (id: string, approved: boolean): Approval | null =>
      approvalsTable.update(id, {
        status: approved ? "approved" : "cancelled",
        resolvedAt: nowIso(),
      }),
  },

  notifications: {
    list: () => notificationsTable.list(),
    get: (id: string) => notificationsTable.get(id),
    update: (id: string, patch: Partial<AppNotification>) =>
      notificationsTable.update(id, patch),
  },

  memories: {
    list: () => memoriesTable.list(),
    get: (id: string) => memoriesTable.get(id),
    create: (data: { section: MemorySection; key: string; value: string }): MemoryItem => {
      const item: MemoryItem = {
        id: serverId("mem"),
        section: data.section,
        key: data.key,
        value: data.value,
        updatedAt: nowIso(),
      };
      return memoriesTable.insert(item);
    },
    delete: (id: string) => memoriesTable.remove(id),
  },

  activity: {
    list: (category?: string) =>
      activityTable.list(category ? (e) => e.category === category : undefined),
  },

  campaigns: {
    list: () => campaignsTable.list(),
    get: (id: string) => campaignsTable.get(id),
    create: (data: {
      name: string;
      platform: string;
      goal: string;
      tone?: string;
      messageStyle?: string;
    }): Campaign => {
      const campaign: Campaign = {
        id: serverId("camp"),
        name: data.name,
        platform: data.platform,
        targets: [],
        goal: data.goal,
        tone: data.tone ?? "Professional",
        messageStyle: data.messageStyle ?? "Short + personalized",
        status: "READY",
        createdAt: nowIso(),
      };
      return campaignsTable.insert(campaign);
    },
  },
};

export type Db = typeof db;
