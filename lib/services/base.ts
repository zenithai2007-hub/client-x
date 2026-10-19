/* Shared helpers for mock services. Swap the class bodies for real
   API calls later — the interfaces stay the same. */

export const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

/** realistic jittered delay, e.g. delayBetween(120, 450) */
export const jitter = (min = 120, max = 450) => delay(min + Math.random() * (max - min));

let seq = 0;
export function uid(prefix = "id"): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq}`;
}

export const nowISO = () => new Date().toISOString();
