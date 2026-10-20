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

/* Roman-Urdu shorthand commands → ready-to-send English messages.
   e.g. "Sarah ko bolo ke main feedback check kar raha hoon" */
const ROMAN_URDU_PATTERN = /\b(ko bolo|mein|mein ne|kar raha|kar rahi|bhejo|bata do)\b/i;

function romanUrduToMessage(t: string): string {
  const text = t.trim();
  const nameMatch = text.match(/^([A-Z][a-z]+)\s+ko\s+bolo/i);
  const name = nameMatch ? nameMatch[1] : null;
  if (/feedback/i.test(text) && /check/i.test(text)) {
    return `Hi ${name ?? "there"}, thanks for the feedback. I'm reviewing the comments now and will get back to you shortly.`;
  }
  if (/call/i.test(text)) {
    return `Hi ${name ?? "there"}, just confirming our call. I'll speak with you at the scheduled time.`;
  }
  if (/price|quote/i.test(text)) {
    return `Hi ${name ?? "there"}, I'll prepare the quote details and send them over shortly.`;
  }
  if (/follow.?up/i.test(text)) {
    return `Hi ${name ?? "there"}, just following up on this — let me know if you need anything from my side.`;
  }
  return `Hi ${name ?? "there"}, noted — I'll take care of this and get back to you shortly.`;
}

const TRANSFORMS: Record<AITransformKind, (t: string) => string> = {
  rewrite: (t) => (ROMAN_URDU_PATTERN.test(t) ? romanUrduToMessage(t) : t.trim()),
  professional: (t) =>
    `Dear team,\n\n${t.trim()}\n\nBest regards,\nClient X`,
  friendly: (t) => `Hey! ${t.trim()} Let me know if you need anything else — happy to help.`,
  shorter: (t) => {
    const s = t.split(/[.!?]\s/).filter(Boolean);
    return s.length > 1 ? `${s[0]}.` : t.slice(0, 90) + (t.length > 90 ? "…" : "");
  },
  longer: (t) =>
    `${t.trim()}\n\nTo expand on that: this gives us room to cover the details properly, and I'll follow up with any updates as soon as they're ready.`,
  translate: (t) =>
    ROMAN_URDU_PATTERN.test(t)
      ? romanUrduToMessage(t)
      : t.trim(),
  "generate-reply": (t) =>
    ROMAN_URDU_PATTERN.test(t)
      ? romanUrduToMessage(t)
      : `Thanks for your message. Regarding "${t.slice(0, 60)}${t.length > 60 ? "…" : ""}", I'll confirm the details and get back to you shortly.`,
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
