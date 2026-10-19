import type { AITransformKind, Conversation, Message } from "../types";
import { delay, jitter, nowISO, uid } from "./base";
import { seedConversations, seedMessages } from "../mock-data";

export interface IChatService {
  fetchConversations(): Promise<Conversation[]>;
  fetchMessages(conversationId: string): Promise<Message[]>;
  sendMessage(conversationId: string, text: string): Promise<Message>;
  generateReply(incoming: string): Promise<string>;
  aiTransform(text: string, kind: AITransformKind): Promise<string>;
  markRead(conversationId: string): Promise<void>;
}

const REPLY_BANK: { match: RegExp; replies: string[] }[] = [
  { match: /price|cost|pricing|quote/i, replies: [
    "Happy to share details — pricing depends on the scope, but most setups land between $97 and $247. Want a tailored quote?",
    "Good question. Our packages start at $97 for a simple setup. I can send the full breakdown if you like.",
  ]},
  { match: /thank|thanks|great|awesome|perfect/i, replies: [
    "You're welcome! Anything else I can help with today?",
    "Glad to hear that. Just let me know if you need anything else.",
  ]},
  { match: /when|how long|timeline|delivery/i, replies: [
    "Typical delivery is 3–5 business days from confirmation. I can fast-track it if you're in a hurry.",
    "Most orders are ready within a few days. Want me to reserve a slot for you?",
  ]},
  { match: /hi|hello|hey|salam|assalam/i, replies: [
    "Hi there! How can I help you today?",
    "Hello! What can I do for you?",
  ]},
];

const FALLBACK_REPLIES = [
  "Got it — let me look into that and get back to you in a moment.",
  "That makes sense. I'll take care of it and confirm once done.",
  "Noted. Anything else you'd like me to handle while I'm on it?",
  "Thanks for the details — I'm on it right now.",
];

const TRANSFORMS: Record<AITransformKind, (t: string) => string> = {
  rewrite: (t) => t.trim(),
  professional: (t) =>
    `Dear team,\n\n${t.trim()}\n\nBest regards,\nClient X`,
  friendly: (t) => `Hey! ${t.trim()} Let me know if you need anything else — happy to help.`,
  shorter: (t) => {
    const s = t.split(/[.!?]\s/).filter(Boolean);
    return s.length > 1 ? `${s[0]}.` : t.slice(0, 90) + (t.length > 90 ? "…" : "");
  },
  longer: (t) =>
    `${t.trim()}\n\nTo expand on that: this gives us room to cover the details properly, and I'll follow up with any updates as soon as they're ready.`,
  translate: (t) => `[Urdu] ${t.trim()}`,
  "generate-reply": (t) =>
    `Thanks for your message. Regarding "${t.slice(0, 60)}${t.length > 60 ? "…" : ""}", I'll confirm the details and get back to you shortly.`,
  personalize: (t) => t.trim(),
  improve: (t) =>
    t
      .trim()
      .replace(/\s+/g, " ")
      .replace(/^./, (c) => c.toUpperCase()),
};

export class MockChatService implements IChatService {
  async fetchConversations(): Promise<Conversation[]> {
    await jitter(150, 350);
    return structuredClone(seedConversations);
  }

  async fetchMessages(conversationId: string): Promise<Message[]> {
    await jitter(120, 300);
    return structuredClone(seedMessages[conversationId] ?? []);
  }

  async sendMessage(conversationId: string, text: string): Promise<Message> {
    await jitter(150, 300);
    return {
      id: uid("msg"),
      sender: "me",
      text,
      time: nowISO(),
      status: "sent",
    };
  }

  async generateReply(incoming: string): Promise<string> {
    await delay(700 + Math.random() * 800);
    for (const { match, replies } of REPLY_BANK) {
      if (match.test(incoming)) {
        return replies[Math.floor(Math.random() * replies.length)];
      }
    }
    return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
  }

  async aiTransform(text: string, kind: AITransformKind): Promise<string> {
    await jitter(400, 900);
    return TRANSFORMS[kind](text);
  }

  async markRead(conversationId: string): Promise<void> {
    await jitter(80, 180);
  }
}

export const chatService: IChatService = new MockChatService();
