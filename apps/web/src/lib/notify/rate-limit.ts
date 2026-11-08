/**
 * Owner: E2 (back-end). Small in-memory fixed-window rate limiter plus client-IP helpers.
 *
 * LIMITS, stated plainly: the counters live in the memory of one serverless instance. Vercel runs
 * many instances (and regions), recycles them on idle and on every deploy, so a determined client
 * is only slowed, never stopped, by this code. It is a backstop against bugs and casual abuse.
 * The real control is a Vercel WAF rate-limit rule on POST /api/notify (first party, all plans,
 * enforced at the edge before this function runs; see the E2 report and docs/ops runbook).
 *
 * Memory is bounded: expired windows are dropped as we go, and when the table is still full the
 * oldest entries are evicted, so an attacker rotating addresses cannot grow it without limit.
 * Keys are held in memory only and are never logged.
 */
import { isIPv6 } from 'node:net';

export type RateLimiter = {
  /** Counts one hit for `key`. `allowed` is false once the window's limit is exceeded. */
  hit(key: string, now?: number): { allowed: boolean; retryAfterSeconds: number };
  reset(): void;
};

export function createRateLimiter(options: { limit: number; windowMs: number; maxKeys?: number }): RateLimiter {
  const { limit, windowMs, maxKeys = 5000 } = options;
  const windows = new Map<string, { count: number; resetAt: number }>();

  function evict(now: number) {
    for (const [key, entry] of windows) {
      if (entry.resetAt <= now) windows.delete(key);
    }
    // Map iterates in insertion order, so this drops the oldest entries first.
    for (const key of windows.keys()) {
      if (windows.size < maxKeys) break;
      windows.delete(key);
    }
  }

  return {
    hit(key, now = Date.now()) {
      let entry = windows.get(key);
      if (!entry || entry.resetAt <= now) {
        if (windows.size >= maxKeys) evict(now);
        entry = { count: 0, resetAt: now + windowMs };
        windows.set(key, entry);
      }
      entry.count += 1;
      return {
        allowed: entry.count <= limit,
        retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      };
    },
    reset() {
      windows.clear();
    },
  };
}

/** Expands an IPv6 address and keeps its first 64 bits: one household or one rented /64 is one client. */
function ipv6Prefix64(ip: string): string {
  const address = ip.split('%')[0].toLowerCase();
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(address);
  if (mapped) return mapped[1];

  const halves = address.split('::');
  if (halves.length > 2) return address;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
  const groups = [...head, ...Array<string>(Math.max(fill, 0)).fill('0'), ...tail];
  if (groups.length !== 8) return address;

  const parsed = groups.slice(0, 4).map((group) => parseInt(group, 16));
  if (parsed.some((n) => Number.isNaN(n))) return address;
  return `${parsed.map((n) => n.toString(16)).join(':')}::/64`;
}

/**
 * Client IP for rate limiting. Vercel overwrites x-forwarded-for with the real client address and
 * does not forward client-supplied values (Vercel docs, "Request headers"), so the first entry is
 * trustworthy there. Anywhere else (local dev) every request without the header shares one bucket.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const raw = (forwarded || headers.get('x-real-ip')?.trim() || '').slice(0, 64);
  if (!raw) return 'unknown';
  return isIPv6(raw) ? ipv6Prefix64(raw) : raw;
}
