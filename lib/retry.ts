/* §26 — Retry with exponential backoff.
   On attempt failure the caller is told via onAttempt so it can move the
   entity to RETRYING with the attempt count surfaced in state. After the
   last attempt the error is thrown; the caller moves the entity to FAILED
   with the error text. */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  onAttempt?: (attempt: number, error: Error) => void;
}

export class RetryExhaustedError extends Error {
  attempts: number;
  lastError: Error;
  constructor(attempts: number, lastError: Error) {
    super(`Failed after ${attempts} attempts: ${lastError.message}`);
    this.name = "RetryExhaustedError";
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 1000;
  let lastError: Error = new Error("unknown");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      opts.onAttempt?.(attempt, lastError);
      if (attempt < maxAttempts) {
        await sleep(baseDelayMs * 2 ** (attempt - 1));
      }
    }
  }
  throw new RetryExhaustedError(maxAttempts, lastError);
}
