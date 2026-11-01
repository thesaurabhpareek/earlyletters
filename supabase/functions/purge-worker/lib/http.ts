/**
 * Fetch with a timeout, and the one error type every vendor call throws.
 *
 * ServiceError carries a provider, an HTTP status, our own error code and
 * (for Postgres) a SQLSTATE. Response bodies are never copied into it: a
 * PostgREST error body can echo a failing row (TDD 06 conflict C-2), and a
 * vendor message can echo an email address. Runtime neutral (Deno and Node).
 */
import type { ErrorCode, Provider } from '../../_shared/log/log.ts';

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

export class ServiceError extends Error {
  override readonly name = 'ServiceError';
  readonly provider: Provider;
  readonly status: number;
  readonly code: ErrorCode;
  readonly sqlstate?: string;

  constructor(provider: Provider, status: number, code: ErrorCode, sqlstate?: string) {
    super(`${provider} ${status} ${code}${sqlstate ? ` ${sqlstate}` : ''}`);
    this.provider = provider;
    this.status = status;
    this.code = code;
    this.sqlstate = sqlstate;
  }

  /** Worth retrying later: network, timeout, 408, 429, 5xx. */
  get transient(): boolean {
    return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500;
  }
}

export const httpCode = (status: number): ErrorCode => (status >= 100 && status <= 599 ? (`http_${status}` as ErrorCode) : 'error');

export async function fetchWithTimeout(
  fetchFn: FetchFn,
  provider: Provider,
  url: string,
  init: RequestInit,
  timeoutMs = 15_000,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetchFn(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    const aborted = ctrl.signal.aborted || (e as { name?: string })?.name === 'AbortError';
    throw new ServiceError(provider, 0, aborted ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }
}

/** Parses JSON or throws a content-free error. */
export async function jsonOf<T>(res: Response, provider: Provider): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    throw new ServiceError(provider, res.status, 'bad_response');
  }
}

/** Reads and discards a body so the connection is released; never returns its text. */
export async function drain(res: Response): Promise<void> {
  try {
    await res.arrayBuffer();
  } catch {
    // ignore
  }
}

/** Constant-time comparison for shared secrets (length is not secret). */
export function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length === 0 || ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
