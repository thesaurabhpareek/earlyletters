/**
 * A minimal Postgres client for one job: call the escrow_* functions as escrow_svc.
 *
 * Why not a library: the escrow function may have no remote imports (F08 6.5 G3), and a full
 * driver vendored here would be thousands of lines inside the trust boundary. This is the
 * protocol subset that job needs, and no more:
 *  - TLS is required (SSLRequest first; a server that says no is refused), with the main
 *    project's CA, which the configuration requires (runbook B5, ESCROW_DB_CA);
 *  - authentication is SCRAM-SHA-256 only (RFC 5802, RFC 7677); cleartext and MD5 are refused,
 *    and the server's signature is checked, so a fake server cannot pass as the database;
 *  - queries use the extended protocol with bound text parameters only, never string-built SQL;
 *  - every call returns the first column of the first row as text.
 * The transport is injected, so tests run a scripted server with no network (test/pg.test.ts).
 */
import { decodeBase64, encodeBase64, randomBytes, sameString } from './bytes.ts';

export interface Transport {
  read(p: Uint8Array): Promise<number | null>;
  write(p: Uint8Array): Promise<number>;
  close(): void;
}

export interface Connector {
  connect(host: string, port: number): Promise<Transport>;
  startTls(t: Transport, host: string, caCerts: string[]): Promise<Transport>;
}

/** Deno's TCP and TLS, for production. */
export const denoConnector: Connector = {
  // deno-lint-ignore no-explicit-any
  connect: (host, port) => (globalThis as any).Deno.connect({ hostname: host, port }),
  // deno-lint-ignore no-explicit-any
  startTls: (t, host, caCerts) => (globalThis as any).Deno.startTls(t, { hostname: host, ...(caCerts.length ? { caCerts } : {}) }),
};

export class PgError extends Error {
  readonly code: string;
  readonly detail?: string;
  constructor(code: string, message: string, detail?: string) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}

const te = new TextEncoder();
const td = new TextDecoder();
const int32 = (n: number) => new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
const int16 = (n: number) => new Uint8Array([(n >>> 8) & 0xff, n & 0xff]);
const cstr = (s: string) => {
  if (s.includes('\0')) throw new PgError('22023', 'nul in string');
  return new Uint8Array([...te.encode(s), 0]);
};
const cat = (...p: Uint8Array[]) => {
  const out = new Uint8Array(p.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of p) { out.set(x, o); o += x.length; }
  return out;
};
const message = (type: string, body: Uint8Array) => cat(te.encode(type), int32(body.length + 4), body);

/** Buffered reader over a transport: whole messages, never partial. */
class Reader {
  private buf = new Uint8Array(0);
  private t: Transport;
  constructor(t: Transport) { this.t = t; }
  setTransport(t: Transport) { this.t = t; }
  async need(n: number): Promise<void> {
    while (this.buf.length < n) {
      const chunk = new Uint8Array(16384);
      const got = await this.t.read(chunk);
      if (got === null || got === 0) throw new PgError('08006', 'connection closed');
      this.buf = cat(this.buf, chunk.subarray(0, got));
    }
  }
  async byte(): Promise<number> {
    await this.need(1);
    const b = this.buf[0];
    this.buf = this.buf.subarray(1);
    return b;
  }
  async message(): Promise<{ type: string; body: Uint8Array }> {
    await this.need(5);
    const type = String.fromCharCode(this.buf[0]);
    const len = ((this.buf[1] << 24) | (this.buf[2] << 16) | (this.buf[3] << 8) | this.buf[4]) >>> 0;
    if (len < 4 || len > 16 * 1024 * 1024) throw new PgError('08P01', 'bad message length');
    await this.need(1 + len);
    const body = this.buf.slice(5, 1 + len);
    this.buf = this.buf.subarray(1 + len);
    return { type, body };
  }
}

const readInt32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) | 0;
const readInt16 = (b: Uint8Array, o: number) => ((b[o] << 8) | b[o + 1]) & 0xffff;

function errorFields(body: Uint8Array): PgError {
  const f: Record<string, string> = {};
  let o = 0;
  while (o < body.length && body[o] !== 0) {
    const k = String.fromCharCode(body[o++]);
    const end = body.indexOf(0, o);
    f[k] = td.decode(body.subarray(o, end));
    o = end + 1;
  }
  return new PgError(f.C ?? 'XX000', f.M ?? 'error', f.D);
}

// ── SCRAM-SHA-256 ──────────────────────────────────────────────────────────
const subtle = crypto.subtle;
const ab = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
async function hmac(key: Uint8Array, data: string | Uint8Array): Promise<Uint8Array> {
  const k = await subtle.importKey('raw', ab(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await subtle.sign('HMAC', k, ab(typeof data === 'string' ? te.encode(data) : data)));
}

export interface ScramClient {
  first: string;
  final(serverFirst: string): Promise<{ clientFinal: string; serverSignature: string }>;
}

/** RFC 5802 client side. `user` stays empty for Postgres (it uses the startup user). */
export function scram(password: string, nonce = encodeBase64(randomBytes(18)), user = ''): ScramClient {
  const bare = `n=${user},r=${nonce}`;
  return {
    first: `n,,${bare}`,
    async final(serverFirst: string) {
      const attrs = Object.fromEntries(serverFirst.split(',').map((kv) => [kv[0], kv.slice(2)]));
      const r = attrs.r ?? '';
      const iterations = Number(attrs.i);
      if (!r.startsWith(nonce) || r.length <= nonce.length || !attrs.s || !Number.isInteger(iterations) || iterations < 4096) {
        throw new PgError('28000', 'bad SCRAM server-first message');
      }
      const salt = decodeBase64(attrs.s);
      const pk = await subtle.importKey('raw', te.encode(password), 'PBKDF2', false, ['deriveBits']);
      const salted = new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: ab(salt), iterations }, pk, 256));
      const clientKey = await hmac(salted, 'Client Key');
      const storedKey = new Uint8Array(await subtle.digest('SHA-256', ab(clientKey)));
      const withoutProof = `c=biws,r=${r}`;
      const authMessage = `${bare},${serverFirst},${withoutProof}`;
      const sig = await hmac(storedKey, authMessage);
      const proof = clientKey.map((b, i) => b ^ sig[i]);
      const serverKey = await hmac(salted, 'Server Key');
      return { clientFinal: `${withoutProof},p=${encodeBase64(proof)}`, serverSignature: encodeBase64(await hmac(serverKey, authMessage)) };
    },
  };
}

// ── Connection ─────────────────────────────────────────────────────────────
export interface ConnectOptions {
  connector: Connector;
  caCerts?: string[];
  /** Tests only: a fixed SCRAM nonce. */
  nonce?: string;
}

export interface PgConnection {
  /** Runs `sql` with text parameters; returns the first column of the first row, or null. */
  scalar(sql: string, params: (string | null)[]): Promise<string | null>;
  close(): Promise<void>;
}

export function parseDbUrl(url: string): { user: string; password: string; host: string; port: number; database: string } {
  const u = new URL(url);
  if (u.protocol !== 'postgres:' && u.protocol !== 'postgresql:') throw new PgError('22023', 'not a postgres url');
  return {
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    host: u.hostname,
    port: u.port ? Number(u.port) : 5432,
    database: u.pathname.replace(/^\//, '') || 'postgres',
  };
}

export async function connect(url: string, opts: ConnectOptions): Promise<PgConnection> {
  const cfg = parseDbUrl(url);
  let t = await opts.connector.connect(cfg.host, cfg.port);
  const rd = new Reader(t);
  try {
    // TLS first, always.
    await t.write(cat(int32(8), int32(80877103)));
    if ((await rd.byte()) !== 'S'.charCodeAt(0)) throw new PgError('08004', 'the server refused TLS');
    t = await opts.connector.startTls(t, cfg.host, opts.caCerts ?? []);
    rd.setTransport(t);

    const params = cat(cstr('user'), cstr(cfg.user), cstr('database'), cstr(cfg.database), cstr('application_name'), cstr('escrow'),
      cstr('client_encoding'), cstr('UTF8'), new Uint8Array([0]));
    const startup = cat(int32(196608), params);
    await t.write(cat(int32(startup.length + 4), startup));

    let client: ScramClient | null = null;
    let expectServer = '';
    let verified = false;
    for (;;) {
      const m = await rd.message();
      if (m.type === 'E') throw errorFields(m.body);
      if (m.type === 'R') {
        const kind = readInt32(m.body, 0);
        if (kind === 0) {
          // Only after the server proved it knows the password (its SCRAM signature checked).
          if (!verified) throw new PgError('28000', 'the server skipped SCRAM');
          continue;
        }
        if (kind === 10) {
          const mechs = td.decode(m.body.subarray(4)).split('\0').filter(Boolean);
          if (!mechs.includes('SCRAM-SHA-256')) throw new PgError('28000', 'SCRAM-SHA-256 not offered');
          client = scram(cfg.password, opts.nonce);
          const first = te.encode(client.first);
          await t.write(message('p', cat(cstr('SCRAM-SHA-256'), int32(first.length), first)));
          continue;
        }
        if (kind === 11 && client) {
          const f = await client.final(td.decode(m.body.subarray(4)));
          expectServer = f.serverSignature;
          await t.write(message('p', te.encode(f.clientFinal)));
          continue;
        }
        if (kind === 12 && expectServer) {
          const v = td.decode(m.body.subarray(4));
          if (!sameString(v, `v=${expectServer}`)) throw new PgError('28000', 'server signature mismatch');
          verified = true;
          continue;
        }
        throw new PgError('28000', 'only SCRAM-SHA-256 is accepted');
      }
      if (m.type === 'Z') {
        if (!verified) throw new PgError('28000', 'the server skipped SCRAM');
        break;
      }
      // 'S' ParameterStatus, 'K' BackendKeyData, 'N' Notice: nothing to do.
    }
  } catch (e) {
    try { t.close(); } catch { /* closing */ }
    throw e;
  }

  let busy = false;
  return {
    async scalar(sql, args) {
      if (busy) throw new PgError('55000', 'one query at a time');
      busy = true;
      try {
        const bind = [cstr(''), cstr(''), int16(0), int16(args.length)];
        for (const a of args) {
          if (a === null) bind.push(int32(-1));
          else { const b = te.encode(a); bind.push(int32(b.length), b); }
        }
        bind.push(int16(0));
        await t.write(cat(
          message('P', cat(cstr(''), cstr(sql), int16(0))),
          message('B', cat(...bind)),
          message('E', cat(cstr(''), int32(0))),
          message('S', new Uint8Array(0)),
        ));
        let value: string | null = null;
        let seen = false;
        let error: PgError | null = null;
        for (;;) {
          const m = await rd.message();
          if (m.type === 'E') error = errorFields(m.body);
          else if (m.type === 'D' && !seen) {
            seen = true;
            if (readInt16(m.body, 0) > 0) {
              const len = readInt32(m.body, 2);
              value = len < 0 ? null : td.decode(m.body.subarray(6, 6 + len));
            }
          } else if (m.type === 'Z') break;
        }
        if (error) throw error;
        return value;
      } finally {
        busy = false;
      }
    },
    async close() {
      try { await t.write(message('X', new Uint8Array(0))); } catch { /* closing */ }
      try { t.close(); } catch { /* closing */ }
    },
  };
}
