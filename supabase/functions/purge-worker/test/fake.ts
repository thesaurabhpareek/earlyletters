/**
 * An in-memory stand-in for Supabase (PostgREST RPCs, Storage, Auth admin),
 * Apple's revoke endpoint and Resend, behind one fake `fetch`. The worker's
 * real HTTP clients run against it, so request shapes are exercised too.
 * The SQL side of every RPC is tested for real in supabase/tests/ops_deletion_worker.test.mjs.
 */
import type { ExecutingRequest, SlaReport, StepRow } from '../rpc.ts';

export const SUPA = 'https://fake-project.supabase.co';

export interface FakeObject {
  owner: string | null;
  body?: string;
}

export interface FakeRequest {
  id: string;
  profile_id: string;
  status: 'scheduled' | 'held' | 'executing' | 'completed' | 'cancelled';
  requested_at: string;
  scheduled_for: string;
  executing_at: string;
  cancelled_at: string | null;
  had_active_subscription: boolean | null;
  receipt: Record<string, unknown>;
  steps: StepRow[];
}

export interface SentEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  idempotencyKey: string | null;
}

export class FakeWorld {
  now: Date;
  buckets = new Set<string>(['entry-photos', 'ops-ledger']);
  objects = new Map<string, Map<string, FakeObject>>();
  users = new Map<string, { email: string | null; providers: string[] }>();
  requests: FakeRequest[] = [];
  queue: { id: number; bucket_id: string; object_path: string; is_prefix: boolean; request_id: string | null; attempts: number; done: boolean; next_attempt_at: number; last_error_code: string | null }[] = [];
  childPhotos = new Map<string, string>();
  appleTokens = new Map<string, { ciphertext: string; key_version: number; client_id: string }>();
  contributors = new Map<string, string[]>();
  purgeResults: { books: number; entries: number; accounts_due: number; more: boolean }[] = [];
  purgeCalls = 0;
  purgeError: number | null = null;
  prepareResult: { held?: boolean; entries?: number; books?: number } = { entries: 2, books: 1 };
  sla: SlaReport = {
    tombstones_overdue: 0, requests_executing_over_24h: 0, requests_executing_over_7d: 0, steps_failed: 0, steps_retrying: 0,
    queue_stuck: 0, queue_attempts_high: 0, scheduled_overdue: 0, holds_past_review: 0, purge_run_age_minutes: 0,
  };
  alertState = new Map<string, number | null>();
  ledger: { t: string; id: string; at: string }[] = [];
  retentionCalls = 0;
  finalized = new Map<string, Record<string, unknown>>();
  extraResidue: { table_schema: string; table_name: string; column_name: string }[] = [];

  // Vendors
  appleCalls: URLSearchParams[] = [];
  appleResponse: { status: number; body?: unknown } = { status: 200 };
  emails: SentEmail[] = [];
  resendStatus = 200;
  contactDeletes: string[] = [];
  /** Every request the worker made: url, method and body text (for the canary scan). */
  traffic: { url: string; method: string; body: string }[] = [];
  rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];
  private nextQueueId = 1;

  constructor(now = new Date('2026-11-05T10:00:00Z')) {
    this.now = now;
  }

  put(bucket: string, name: string, owner: string | null = null): void {
    if (!this.objects.has(bucket)) this.objects.set(bucket, new Map());
    this.objects.get(bucket)!.set(name, { owner });
  }

  has(bucket: string, name: string): boolean {
    return this.objects.get(bucket)?.has(name) ?? false;
  }

  names(bucket: string): string[] {
    return [...(this.objects.get(bucket)?.keys() ?? [])].sort();
  }

  enqueue(bucket: string, path: string, isPrefix: boolean, requestId: string | null = null): number {
    const id = this.nextQueueId++;
    this.queue.push({ id, bucket_id: bucket, object_path: path, is_prefix: isPrefix, request_id: requestId, attempts: 0, done: false, next_attempt_at: 0, last_error_code: null });
    return id;
  }

  addExecuting(id: string, profileId: string, opts: { executingDaysAgo?: number; steps?: string[]; hadSubscription?: boolean | null } = {}): FakeRequest {
    const executing = new Date(this.now.getTime() - (opts.executingDaysAgo ?? 0) * 86_400_000);
    const steps = opts.steps ?? ['storage_objects', 'apple_token_revoke', 'posthog', 'email_provider', 'receipt_email', 'auth_user', 'powersync_verify'];
    const req: FakeRequest = {
      id, profile_id: profileId, status: 'executing',
      requested_at: new Date(executing.getTime() - 30 * 86_400_000).toISOString(),
      scheduled_for: executing.toISOString(), executing_at: executing.toISOString(), cancelled_at: null,
      had_active_subscription: opts.hadSubscription ?? null, receipt: {},
      steps: steps.map((step) => ({ step, status: 'pending', attempts: 0, next_attempt_at: new Date(0).toISOString(), last_error_code: null })),
    };
    this.requests.push(req);
    return req;
  }

  step(requestId: string, step: string): StepRow | undefined {
    return this.requests.find((r) => r.id === requestId)?.steps.find((s) => s.step === step);
  }

  fetch = async (input: string, init: RequestInit = {}): Promise<Response> => {
    const method = (init.method ?? 'GET').toUpperCase();
    const body = typeof init.body === 'string' ? init.body : '';
    this.traffic.push({ url: input, method, body });
    const url = new URL(input);
    if (url.origin === SUPA) return this.supabase(url, method, body);
    if (input === 'https://appleid.apple.com/auth/revoke') {
      this.appleCalls.push(new URLSearchParams(body));
      return json(this.appleResponse.status, this.appleResponse.body ?? null);
    }
    if (input === 'https://api.resend.com/emails') {
      if (this.resendStatus !== 200) return json(this.resendStatus, { name: 'error', message: 'fake failure for asha.parent@example.invalid' });
      const b = JSON.parse(body);
      const headers = new Headers(init.headers);
      this.emails.push({ from: b.from, to: b.to[0], subject: b.subject, text: b.text, idempotencyKey: headers.get('Idempotency-Key') });
      return json(200, { id: 'email-1' });
    }
    if (input.startsWith('https://api.resend.com/contacts/')) {
      this.contactDeletes.push(decodeURIComponent(input.slice('https://api.resend.com/contacts/'.length)));
      return json(404, { name: 'not_found' });
    }
    return json(599, null);
  };

  private supabase(url: URL, method: string, body: string): Response {
    const path = url.pathname;
    if (path.startsWith('/rest/v1/rpc/')) {
      const fn = path.slice('/rest/v1/rpc/'.length);
      const args = body ? JSON.parse(body) : {};
      this.rpcCalls.push({ fn, args });
      try {
        return json(200, this.rpc(fn, args));
      } catch (e) {
        const err = e as { status?: number; code?: string };
        return json(err.status ?? 400, { code: err.code ?? 'P0001', message: `failed for ${JSON.stringify(args)}` });
      }
    }
    if (path === '/storage/v1/bucket' && method === 'GET') return json(200, [...this.buckets].map((id) => ({ id, name: id })));
    if (path.startsWith('/storage/v1/object/list/')) {
      const bucket = decodeURIComponent(path.slice('/storage/v1/object/list/'.length));
      const { prefix, limit, offset } = JSON.parse(body);
      const base = prefix ? `${prefix}/` : '';
      const children = new Map<string, boolean>();
      for (const name of this.names(bucket)) {
        if (!name.startsWith(base)) continue;
        const rest = name.slice(base.length);
        const slash = rest.indexOf('/');
        if (slash === -1) children.set(rest, false);
        else children.set(rest.slice(0, slash), true);
      }
      const rows = [...children.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(offset, offset + limit)
        .map(([name, folder]) => ({ name, id: folder ? null : `obj-${name}` }));
      return json(200, rows);
    }
    if (path === '/storage/v1/object/copy') {
      const { bucketId, sourceKey, destinationKey } = JSON.parse(body);
      if (!this.has(bucketId, sourceKey)) return json(404, { error: 'not_found' });
      this.put(bucketId, destinationKey, null);
      return json(200, { Key: `${bucketId}/${destinationKey}` });
    }
    const m = /^\/storage\/v1\/object\/([^/]+)(?:\/(.+))?$/.exec(path);
    if (m && method === 'DELETE' && !m[2]) {
      const bucket = decodeURIComponent(m[1]);
      const { prefixes } = JSON.parse(body) as { prefixes: string[] };
      const removed = prefixes.filter((n) => this.objects.get(bucket)?.delete(n));
      return json(200, removed.map((name) => ({ name })));
    }
    if (m && method === 'POST' && m[2]) {
      const bucket = decodeURIComponent(m[1]);
      const name = m[2].split('/').map(decodeURIComponent).join('/');
      this.put(bucket, name, null);
      this.objects.get(bucket)!.get(name)!.body = body;
      return json(200, { Key: `${bucket}/${name}` });
    }
    const u = /^\/auth\/v1\/admin\/users\/([^/]+)$/.exec(path);
    if (u) {
      const id = decodeURIComponent(u[1]);
      const user = this.users.get(id);
      if (!user) return json(404, { msg: 'User not found' });
      if (method === 'DELETE') {
        const owns = [...this.objects.values()].some((objs) => [...objs.values()].some((o) => o.owner === id));
        if (owns) return json(500, { msg: 'Database error deleting user' });
        this.users.delete(id);
        return json(200, {});
      }
      return json(200, { id, email: user.email, identities: user.providers.map((provider) => ({ provider })), app_metadata: { providers: user.providers } });
    }
    return json(404, { error: 'unknown route' });
  }

  private rpc(fn: string, a: Record<string, unknown>): unknown {
    const req = (id: unknown) => {
      const r = this.requests.find((x) => x.id === id);
      if (!r) throw { status: 404, code: 'P0002' };
      return r;
    };
    switch (fn) {
      case 'purge_due': {
        this.purgeCalls++;
        if (this.purgeError) throw { status: this.purgeError, code: '57014' };
        return this.purgeResults.shift() ?? { books: 0, entries: 0, accounts_due: 0, more: false };
      }
      case 'ops_deletion_work': {
        const executing: ExecutingRequest[] = this.requests.filter((r) => r.status === 'executing').map((r) => ({
          id: r.id, profile_id: r.profile_id, requested_at: r.requested_at, executing_at: r.executing_at,
          had_active_subscription: r.had_active_subscription, receipt: { ...r.receipt }, steps: r.steps.map((s) => ({ ...s })),
        }));
        const notices = this.requests.filter((r) => ['scheduled', 'held'].includes(r.status)).flatMap((r) =>
          r.steps.filter((s) => s.step === 'contributor_export_notice' && s.status === 'pending' && new Date(s.next_attempt_at) <= this.now)
            .map((s) => ({ request_id: r.id, kind: 'account', scheduled_for: r.scheduled_for, attempts: s.attempts })));
        const recent = (iso: string | null) => !!iso && this.now.getTime() - new Date(iso).getTime() < 2 * 86_400_000;
        const toEmail = (r: FakeRequest) => ({ id: r.id, profile_id: r.profile_id, scheduled_for: r.scheduled_for, requested_at: r.requested_at, cancelled_at: r.cancelled_at });
        return {
          executing,
          notices,
          request_emails: this.requests.filter((r) => ['scheduled', 'held'].includes(r.status) && !('request_email' in r.receipt) && recent(r.requested_at)).map(toEmail),
          cancel_emails: this.requests.filter((r) => r.status === 'cancelled' && !('cancel_email' in r.receipt) && recent(r.cancelled_at)).map(toEmail),
        };
      }
      case 'ops_storage_queue_due': {
        const rows = this.queue.filter((q) => !q.done && (a.p_request ? q.request_id === a.p_request : q.request_id === null && q.next_attempt_at <= this.now.getTime()));
        return rows.slice(0, Number(a.p_limit)).map(({ id, bucket_id, object_path, is_prefix, request_id, attempts }) => ({ id, bucket_id, object_path, is_prefix, request_id, attempts }));
      }
      case 'record_purge_attempt': {
        const q = this.queue.find((x) => x.id === a.p_id)!;
        q.attempts++;
        if (a.p_ok) { q.done = true; q.last_error_code = null; } else {
          q.last_error_code = String(a.p_error_code);
          q.next_attempt_at = this.now.getTime() + Math.min(6 * 3600_000, 60_000 * 2 ** (q.attempts - 1));
        }
        return null;
      }
      case 'record_deletion_step': {
        const s = req(a.p_request).steps.find((x) => x.step === a.p_step);
        if (!s) throw { status: 404, code: 'P0002' };
        s.attempts++;
        s.status = a.p_status as StepRow['status'];
        s.last_error_code = ['done', 'not_applicable'].includes(String(a.p_status)) ? null : String(a.p_error_code);
        if (a.p_status === 'pending') s.next_attempt_at = new Date(this.now.getTime() + Math.min(6 * 3600_000, 60_000 * 2 ** (s.attempts - 1))).toISOString();
        return null;
      }
      case 'prepare_account_purge': {
        const r = req(a.p_request);
        if (this.prepareResult.held) { r.status = 'held'; return { held: true }; }
        return this.prepareResult;
      }
      case 'ops_merge_deletion_receipt': {
        const r = req(a.p_request);
        r.receipt = { ...r.receipt, ...(a.p_part as Record<string, unknown>) };
        return r.receipt;
      }
      case 'ops_storage_owned_by': {
        const out: { bucket_id: string; name: string }[] = [];
        for (const [bucket, objs] of this.objects) for (const [name, o] of objs) if (o.owner === a.p_uid && bucket !== 'ops-ledger') out.push({ bucket_id: bucket, name });
        return out.slice(0, Number(a.p_limit));
      }
      case 'ops_storage_residue': {
        const out: { bucket_id: string; name: string }[] = [];
        for (const [bucket, objs] of this.objects) for (const name of objs.keys()) if (bucket !== 'ops-ledger' && `/${name}`.includes(`/${a.p_uid}/`)) out.push({ bucket_id: bucket, name });
        return out;
      }
      case 'ops_deletion_residue':
        return [...(this.users.has(String(a.p_uid)) ? [{ table_schema: 'public', table_name: 'profiles', column_name: 'id' }] : []), ...this.extraResidue];
      case 'ops_deletion_contributors':
        return this.contributors.get(String(a.p_request)) ?? [];
      case 'ops_set_child_photo_path': {
        if (this.childPhotos.get(String(a.p_child)) !== a.p_old) return false;
        this.childPhotos.set(String(a.p_child), String(a.p_new));
        return true;
      }
      case 'ops_apple_token_get': {
        const t = this.appleTokens.get(String(a.p_profile));
        return t ? [t] : [];
      }
      case 'ops_apple_token_delete':
        return this.appleTokens.delete(String(a.p_profile));
      case 'finalize_account_deletion': {
        const r = req(a.p_request);
        if (r.status !== 'executing') throw { status: 400, code: 'SCDEL' };
        if (this.users.has(r.profile_id)) throw { status: 400, code: 'SCDEL' };
        r.status = 'completed';
        r.receipt = a.p_receipt as Record<string, unknown>;
        this.finalized.set(r.id, r.receipt);
        return null;
      }
      case 'ops_deletion_sla':
        return this.sla;
      case 'ops_alert_claim': {
        const last = this.alertState.get(String(a.p_kind));
        if (last != null && this.now.getTime() - last < Number(a.p_cooldown_minutes) * 60_000) return false;
        this.alertState.set(String(a.p_kind), this.now.getTime());
        return true;
      }
      case 'ops_alert_reset':
        this.alertState.set(String(a.p_kind), null);
        return null;
      case 'ops_ledger_between':
        return this.ledger.filter((r) => r.at >= String(a.p_from) && r.at < String(a.p_until));
      case 'ops_retention':
        this.retentionCalls++;
        return { audit_log: 0, forget_quota: 0 };
      default:
        throw { status: 404, code: 'PGRST202' };
    }
  }
}

function json(status: number, body: unknown): Response {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
