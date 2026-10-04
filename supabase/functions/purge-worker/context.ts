/**
 * What every part of one worker run shares: clients, config, clock, budget
 * and the alert conditions found along the way.
 */
import type { AlertKind, Logger } from '../_shared/log/log.ts';
import type { WorkerConfig } from './config.ts';
import type { FetchFn } from './lib/http.ts';
import { ServiceError } from './lib/http.ts';
import type { ServiceClient } from './lib/service.ts';
import { db, type Db } from './rpc.ts';

export interface WorkerDeps {
  client: ServiceClient;
  /** For vendor calls (Apple, Resend). */
  fetch: FetchFn;
  config: WorkerConfig;
  log: Logger;
  now?: () => Date;
  newId?: () => string;
}

export interface Ctx {
  c: ServiceClient;
  d: Db;
  fetch: FetchFn;
  cfg: WorkerConfig;
  log: Logger;
  now: () => Date;
  newId: () => string;
  deadline: number;
  buckets: Set<string> | null;
  conditions: Map<AlertKind, number>;
}

export function makeCtx(deps: WorkerDeps): Ctx {
  const now = deps.now ?? (() => new Date());
  return {
    c: deps.client,
    d: db(deps.client),
    fetch: deps.fetch,
    cfg: deps.config,
    log: deps.log,
    now,
    newId: deps.newId ?? (() => crypto.randomUUID()),
    deadline: now().getTime() + deps.config.budgetMs,
    buckets: null,
    conditions: new Map(),
  };
}

export const overBudget = (ctx: Ctx): boolean => ctx.now().getTime() >= ctx.deadline;

export function flag(ctx: Ctx, kind: AlertKind, count = 1): void {
  ctx.conditions.set(kind, (ctx.conditions.get(kind) ?? 0) + count);
}

/** Error code for a step or queue row: our own class, never a vendor message. */
export function codeOf(e: unknown): string {
  if (e instanceof ServiceError) return e.sqlstate ?? e.code;
  const name = (e as { name?: unknown })?.name;
  return name === 'TypeError' ? 'type_error' : 'error';
}

export const isTransient = (e: unknown): boolean => !(e instanceof ServiceError) || e.transient;

/** SHA-256 hex of a string (idempotency keys that should not carry raw ids). */
export async function sha256Hex(s: string): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  return Array.from(h, (b) => b.toString(16).padStart(2, '0')).join('');
}
