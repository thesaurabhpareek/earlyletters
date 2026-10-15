/**
 * Test doubles for the escrow function: an in-memory EscrowDb with the rules of the escrow_*
 * SQL functions that the function's ordering depends on (the SQL itself is tested for real in
 * supabase/tests/audio_backup_escrow.test.mjs), a recording mailer, a JWKS-backed token minter,
 * and a phone that makes real keys and wraps with hpke.ts.
 * Fictional family "Asha" only (CLAUDE.md).
 */
import { encodeBase64Url, fromHex, toHex } from '../bytes.ts';
import type { EscrowDb, LoadResult, OpenResult, RequestContext, RequestState, RotationRow, UnwrapRow } from '../db.ts';
import { aad, generateKeyPair, INFO, packV1, seal } from '../hpke.ts';
import type { Mail, Mailer } from '../mail.ts';
import { PgError } from '../pg.ts';

export const ASHA = {
  profile: '11111111-1111-4111-8111-111111111111',
  child: '0192e000-0000-7000-8000-0000000000c1',
  child2: '0192e000-0000-7000-8000-0000000000c2',
  oldPhone: '0192e000-0000-7000-8000-0000000000d1',
  newPhone: '0192e000-0000-7000-8000-0000000000d2',
  email: 'asha@example.com',
  mainUrl: 'https://main-fixture.supabase.co',
};

export type Call = { fn: string; args: unknown[] };

interface Req {
  id: string; profile: string; device: string; state: RequestState; hold_until: number; notified: boolean;
  approved: boolean; tokenHash: string; approvals: { device_id: string; code_hash_hex: string; sealed_code_hex: string }[]; released_at?: number;
}

export class FakeDb implements EscrowDb {
  calls: Call[] = [];
  devices = new Map<string, { profile: string; pk: Uint8Array; enrolled: boolean }>();
  wraps: { profile: string; child: string; kv: number; ekv: number; wrap: Uint8Array }[] = [];
  requests: Req[] = [];
  log: (UnwrapRow & { request: string; profile: string })[] = [];
  rotations: { profile: string; child: string }[] = [];
  deleting = false;
  emails = new Map<string, string>([[ASHA.profile, ASHA.email]]);
  failOn: string | null = null;
  now = () => Date.now();
  private seq = 0;

  private hit(fn: string, args: unknown[]) {
    this.calls.push({ fn, args });
    if (this.failOn === fn) throw new PgError('08006', 'db', 'db');
  }

  async context(profile: string, device: string): Promise<RequestContext> {
    this.hit('context', [profile, device]);
    const d = this.devices.get(device);
    if (!d || d.profile !== profile) throw new PgError('P0002', 'device', 'device_unknown');
    const open = this.requests.find((r) => r.device === device && (['requested', 'approved'].includes(r.state)
      || (r.state === 'released' && this.now() - (r.released_at ?? 0) < 86_400_000)));
    return {
      device_public_key_hex: toHex(d.pk),
      deleting: this.deleting,
      has_keys: this.wraps.some((w) => w.profile === profile),
      open_request: open ? { request_id: open.id, state: open.state, hold_until: new Date(open.hold_until).toISOString(), notified: open.notified } : null,
      enrolled: [...this.devices].filter(([id, x]) => x.profile === profile && id !== device && x.enrolled)
        .map(([id, x]) => ({ device_id: id, public_key_hex: toHex(x.pk) })),
    };
  }

  async openRequest(profile: string, device: string, requestId: string, hash: Uint8Array, approvals: Req['approvals']): Promise<OpenResult> {
    this.hit('openRequest', [profile, device, requestId, toHex(hash), approvals]);
    const open = this.requests.find((r) => r.device === device && ['requested', 'approved'].includes(r.state));
    if (open) {
      if (!open.notified) open.tokenHash = toHex(hash);
      return { request_id: open.id, state: open.state, hold_until: new Date(open.hold_until).toISOString(), notified: open.notified, created: false, token_replaced: !open.notified };
    }
    const others = [...this.devices].filter(([id, x]) => x.profile === profile && id !== device && x.enrolled).length;
    const r: Req = {
      id: `0192e000-0000-7000-8000-${String(++this.seq).padStart(12, 'e')}`, profile, device, state: 'requested',
      hold_until: this.now() + (others ? 72 : 24) * 3600_000, notified: false, approved: false, tokenHash: toHex(hash), approvals,
    };
    this.requests.push(r);
    return { request_id: r.id, state: r.state, hold_until: new Date(r.hold_until).toISOString(), notified: false, created: true, token_replaced: false };
  }

  async loadWraps(profile: string, device: string, request: string): Promise<LoadResult> {
    this.hit('loadWraps', [profile, device, request]);
    const r = this.requests.find((x) => x.id === request && x.profile === profile && x.device === device);
    if (!r) throw new PgError('P0002', 'request', 'request');
    if (r.state === 'cancelled' || r.state === 'expired') return { state: r.state };
    const ready = r.state === 'approved' || r.hold_until <= this.now() || (r.state === 'released' && this.now() - (r.released_at ?? 0) < 86_400_000);
    if (!ready || !r.notified) return { state: r.state, hold_until: new Date(r.hold_until).toISOString(), notified: r.notified };
    return {
      state: 'ready', request_id: r.id, device_public_key_hex: toHex(this.devices.get(device)!.pk),
      keys: this.wraps.filter((w) => w.profile === profile).map((w) => ({ child_id: w.child, key_version: w.kv, escrow_key_version: w.ekv, escrow_wrap_hex: toHex(w.wrap) })),
    };
  }

  async recordUnwraps(profile: string, _device: string, request: string, rows: UnwrapRow[], requestId: string): Promise<number> {
    this.hit('recordUnwraps', [profile, request, rows, requestId]);
    for (const row of rows) this.log.push({ ...row, request, profile });
    return rows.length;
  }

  async setState(profile: string, request: string, event: 'notified' | 'released') {
    this.hit('setState', [profile, request, event]);
    const r = this.requests.find((x) => x.id === request && x.profile === profile)!;
    if (event === 'notified') r.notified = true;
    else {
      if (!this.log.some((l) => l.request === request && l.outcome === 'opened')) throw new PgError('SCIMM', 'invariant', 'invariant');
      r.state = 'released';
      r.released_at = this.now();
    }
    return { state: r.state };
  }

  async rotationBatch(from: number, limit: number): Promise<RotationRow[]> {
    this.hit('rotationBatch', [from, limit]);
    return this.wraps.filter((w) => w.ekv === from).slice(0, limit).map((w) => ({ profile_id: w.profile, child_id: w.child, key_version: w.kv, escrow_wrap_hex: toHex(w.wrap) }));
  }

  async rewrapKey(profile: string, child: string, kv: number, from: number, to: number, wrap: Uint8Array) {
    this.hit('rewrapKey', [profile, child, kv, from, to]);
    const w = this.wraps.find((x) => x.profile === profile && x.child === child && x.kv === kv && x.ekv === from);
    if (!w) return { updated: false, first_for_account: false, email: null };
    const first = !this.wraps.some((x) => x.profile === profile && x.ekv === to);
    w.wrap = wrap;
    w.ekv = to;
    this.rotations.push({ profile, child });
    return { updated: true, first_for_account: first, email: first ? this.emails.get(profile) ?? null : null };
  }

  async close() {
    this.calls.push({ fn: 'close', args: [] });
  }
}

export class FakeMailer implements Mailer {
  sent: Mail[] = [];
  fail = false;
  constructor(private calls?: Call[]) {}
  async send(m: Mail) {
    this.calls?.push({ fn: 'email', args: [m.subject] });
    if (this.fail) throw new Error('resend 503');
    this.sent.push(m);
  }
}

/** The phone: its device key pair and a book key wrapped to the escrow public key, as the app does. */
export async function phone(db: FakeDb, escrowPk: Uint8Array, opts: { device?: string; enrolled?: boolean; child?: string; ekv?: number } = {}) {
  const device = opts.device ?? ASHA.newPhone;
  const pair = await generateKeyPair();
  db.devices.set(device, { profile: ASHA.profile, pk: pair.pk, enrolled: opts.enrolled ?? false });
  const bk = crypto.getRandomValues(new Uint8Array(32));
  const child = opts.child ?? ASHA.child;
  const ekv = opts.ekv ?? 1;
  const wrap = packV1(await seal(escrowPk, INFO.bookKey, aad.bookKey(ASHA.profile, child, 1, ekv), bk));
  if (!db.wraps.some((w) => w.profile === ASHA.profile && w.child === child)) db.wraps.push({ profile: ASHA.profile, child, kv: 1, ekv, wrap });
  return { device, sk: pair.sk, pk: pair.pk, bk, child };
}

/** ES256 tokens signed by a fake main project, and its JWKS. */
export async function tokenMinter(mainUrl = ASHA.mainUrl) {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair;
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const kid = 'kid-fixture-1';
  const enc = (o: unknown) => encodeBase64Url(new TextEncoder().encode(JSON.stringify(o)));
  const mint = async (claims: Record<string, unknown> = {}, header: Record<string, unknown> = {}) => {
    const now = Math.floor(Date.now() / 1000);
    const h = enc({ alg: 'ES256', kid, typ: 'JWT', ...header });
    const p = enc({ iss: `${mainUrl}/auth/v1`, aud: 'authenticated', role: 'authenticated', sub: ASHA.profile, email: ASHA.email,
      iat: now, exp: now + 3600, amr: [{ method: 'otp', timestamp: now - 60 }], session_id: 'sess-fixture', is_anonymous: false, ...claims });
    const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, new TextEncoder().encode(`${h}.${p}`)));
    return `${h}.${p}.${encodeBase64Url(sig)}`;
  };
  let jwksCalls = 0;
  const fetchFn = async (url: string) => {
    if (url === `${mainUrl}/auth/v1/.well-known/jwks.json`) {
      jwksCalls++;
      return new Response(JSON.stringify({ keys: [{ ...jwk, kid, alg: 'ES256', use: 'sig' }] }), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  };
  return { mint, fetchFn, kid, jwksCalls: () => jwksCalls, enc };
}

export const hexToBytes = fromHex;
