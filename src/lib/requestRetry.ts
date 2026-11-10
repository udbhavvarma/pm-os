const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
}

export class NetworkRequestError extends Error {
  constructor(message = "The connection was interrupted during processing. The recording is saved; try again when the connection is stable.") {
    super(message);
    this.name = "NetworkRequestError";
  }
}

function isNetworkFailure(error: unknown) {
  if (error instanceof TypeError) return true;
  if (!(error instanceof Error)) return false;
  return /failed to fetch|networkerror|network request failed|load failed/i.test(error.message);
}

function retryDelay(response: Response | null, attempt: number, baseDelayMs: number) {
  const retryAfter = response?.headers.get("Retry-After");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN;
  if (Number.isFinite(retryAfterSeconds)) return Math.min(3_000, Math.max(baseDelayMs, retryAfterSeconds * 1_000));
  return Math.min(3_000, baseDelayMs * 2 ** attempt);
}

export async function requestWithRetry(request: () => Promise<Response>, options: RetryOptions = {}) {
  const attempts = Math.max(1, options.attempts ?? 3);
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 500);
  const sleep = options.sleep ?? ((delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs)));

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let response: Response | null = null;
    try {
      response = await request();
      if (!RETRYABLE_STATUSES.has(response.status) || attempt === attempts - 1) return response;
    } catch (error) {
      if (!isNetworkFailure(error)) throw error;
      if (attempt === attempts - 1) throw new NetworkRequestError();
    }
    await sleep(retryDelay(response, attempt, baseDelayMs));
  }

  throw new NetworkRequestError();
}
