// The minimal Postgres client (pg.ts): SCRAM-SHA-256 against RFC 7677's vector, TLS required,
// cleartext and MD5 refused, the server's signature checked, and parameters always bound.
// A scripted server runs over an in-memory transport, so no network is needed.
import assert from 'node:assert/strict';
import { decodeBase64, encodeBase64 } from '../bytes.ts';
import { connect, type Connector, PgError, scram, type Transport } from '../pg.ts';

Deno.test('SCRAM-SHA-256 matches the RFC 7677 test vector', async () => {
  const c = scram('pencil', 'rOprNGfwEbeRWgbNEkqO', 'user');
  assert.equal(c.first, 'n,,n=user,r=rOprNGfwEbeRWgbNEkqO');
  const f = await c.final('r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0,s=W22ZaJ0SNY7soEsUEjb6gQ==,i=4096');
  assert.equal(f.clientFinal, 'c=biws,r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0,p=dHzbZapWIk4jUhN+Ute9ytag9zjfMHgsqmmiz7AndVQ=');
  assert.equal(f.serverSignature, '6rriTRBi23WpRR/wtup+mMhUZUn/dB5nLTJRsjl95G4=');
});

Deno.test('SCRAM refuses a server nonce that does not extend ours, or too few iterations', async () => {
  await assert.rejects(() => scram('pw', 'abc').final('r=xyz123,s=AAAA,i=4096'), PgError);
  await assert.rejects(() => scram('pw', 'abc').final('r=abcdef,s=AAAA,i=1000'), PgError);
});

// ── A scripted server ──────────────────────────────────────────────────────
class Queue {
  private chunks: Uint8Array[] = [];
  private wake: (() => void) | null = null;
  closed = false;
  push(u: Uint8Array) { this.chunks.push(u.slice()); this.wake?.(); }
  close() { this.closed = true; this.wake?.(); }
  async read(p: Uint8Array): Promise<number | null> {
    while (!this.chunks.length) {
      if (this.closed) return null;
      await new Promise<void>((r) => (this.wake = r));
      this.wake = null;
    }
    const c = this.chunks[0];
    const n = Math.min(p.length, c.length);
    p.set(c.subarray(0, n));
    if (n === c.length) this.chunks.shift(); else this.chunks[0] = c.subarray(n);
    return n;
  }
}
function pair(): [Transport, Transport] {
  const a = new Queue();
  const b = new Queue();
  const end = (inq: Queue, outq: Queue): Transport => ({
    read: (p) => inq.read(p), write: async (p) => { outq.push(p); return p.length; }, close: () => { outq.close(); inq.close(); },
  });
  return [end(a, b), end(b, a)];
}

const te = new TextEncoder();
const td = new TextDecoder();
const i32 = (n: number) => new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
const msg = (t: string, body: Uint8Array) => { const out = new Uint8Array(5 + body.length); out[0] = t.charCodeAt(0); out.set(i32(body.length + 4), 1); out.set(body, 5); return out; };
const auth = (kind: number, rest: Uint8Array = new Uint8Array(0)) => msg('R', new Uint8Array([...i32(kind), ...rest]));
const ab = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
const hmac = async (k: Uint8Array, d: string) => new Uint8Array(await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', ab(k), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), te.encode(d)));

class ServerReader {
  private buf = new Uint8Array(0);
  constructor(private t: Transport) {}
  async need(n: number) {
    while (this.buf.length < n) {
      const c = new Uint8Array(4096);
      const got = await this.t.read(c);
      if (!got) throw new Error('client closed');
      const nb = new Uint8Array(this.buf.length + got); nb.set(this.buf); nb.set(c.subarray(0, got), this.buf.length); this.buf = nb;
    }
  }
  async raw(n: number) { await this.need(n); const out = this.buf.slice(0, n); this.buf = this.buf.subarray(n); return out; }
  async typed() { const h = await this.raw(5); const len = ((h[1] << 24) | (h[2] << 16) | (h[3] << 8) | h[4]) >>> 0; return { type: String.fromCharCode(h[0]), body: await this.raw(len - 4) }; }
}

interface ServerOpts {
  password?: string;
  refuseTls?: boolean;
  cleartext?: boolean;
  badServerSignature?: boolean;
  skipSasl?: boolean;
  answer?: (sql: string, params: (string | null)[]) => { value?: string | null; error?: { code: string; message: string; detail?: string } };
}
const seen: { sql: string; params: (string | null)[] }[] = [];

async function serve(t: Transport, o: ServerOpts) {
  const rd = new ServerReader(t);
  await rd.raw(8); // SSLRequest
  if (o.refuseTls) { await t.write(te.encode('N')); return; }
  await t.write(te.encode('S'));
  const len = await rd.raw(4);
  const body = await rd.raw((((len[0] << 24) | (len[1] << 16) | (len[2] << 8) | len[3]) >>> 0) - 4);
  const params = td.decode(body.subarray(4)).split('\0');
  assert.equal(params[params.indexOf('user') + 1], 'escrow_svc.ref');
  if (o.cleartext) { await t.write(auth(3)); return; }
  if (o.skipSasl) { await t.write(new Uint8Array([...auth(0), ...msg('Z', te.encode('I'))])); return; }
  await t.write(auth(10, te.encode('SCRAM-SHA-256\0\0')));
  const first = await rd.typed();
  const z = first.body.indexOf(0);
  const clientFirst = td.decode(first.body.subarray(z + 5));
  const bare = clientFirst.slice(3);
  const cnonce = bare.split(',r=')[1];
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const serverFirst = `r=${cnonce}srvnonce,s=${encodeBase64(salt)},i=4096`;
  await t.write(auth(11, te.encode(serverFirst)));
  const fin = td.decode((await rd.typed()).body);
  const withoutProof = fin.slice(0, fin.indexOf(',p='));
  const proof = decodeBase64(fin.slice(fin.indexOf(',p=') + 3));
  const pk = await crypto.subtle.importKey('raw', te.encode(o.password ?? 'right-password'), 'PBKDF2', false, ['deriveBits']);
  const salted = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: ab(salt), iterations: 4096 }, pk, 256));
  const storedKey = new Uint8Array(await crypto.subtle.digest('SHA-256', ab(await hmac(salted, 'Client Key'))));
  const authMessage = `${bare},${serverFirst},${withoutProof}`;
  const sig = await hmac(storedKey, authMessage);
  const recovered = proof.map((b, i) => b ^ sig[i]);
  const ok = encodeBase64(new Uint8Array(await crypto.subtle.digest('SHA-256', ab(recovered)))) === encodeBase64(storedKey);
  if (!ok) { await t.write(msg('E', te.encode('SFATAL\0C28P01\0Mpassword authentication failed\0\0'))); return; }
  const serverSig = o.badServerSignature ? encodeBase64(new Uint8Array(32)) : encodeBase64(await hmac(await hmac(salted, 'Server Key'), authMessage));
  await t.write(new Uint8Array([...auth(12, te.encode(`v=${serverSig}`)), ...auth(0), ...msg('S', te.encode('server_version\x0017\0')), ...msg('Z', te.encode('I'))]));
  for (;;) {
    let m;
    try { m = await rd.typed(); } catch { return; }
    if (m.type === 'X') return;
    if (m.type !== 'P') continue;
    const sql = td.decode(m.body.subarray(1, m.body.indexOf(0, 1)));
    const b = (await rd.typed()).body;
    let off = 2 + 2; // portal "", statement "" (two NULs), then the format-code count (0)
    off += 2;
    const n = (b[off - 2] << 8) | b[off - 1];
    const args: (string | null)[] = [];
    for (let i = 0; i < n; i++) {
      const l = ((b[off] << 24) | (b[off + 1] << 16) | (b[off + 2] << 8) | b[off + 3]) | 0;
      off += 4;
      if (l < 0) args.push(null); else { args.push(td.decode(b.subarray(off, off + l))); off += l; }
    }
    await rd.typed(); // Execute
    await rd.typed(); // Sync
    seen.push({ sql, params: args });
    const a = o.answer?.(sql, args) ?? { value: '{"ok":true}' };
    const out: number[] = [...msg('1', new Uint8Array(0)), ...msg('2', new Uint8Array(0))];
    if (a.error) out.push(...msg('E', te.encode(`SERROR\0C${a.error.code}\0M${a.error.message}\0${a.error.detail ? `D${a.error.detail}\0` : ''}\0`)));
    else {
      const v = a.value === null || a.value === undefined ? null : te.encode(a.value);
      out.push(...msg('D', new Uint8Array([0, 1, ...i32(v ? v.length : -1), ...(v ?? [])])), ...msg('C', te.encode('SELECT 1\0')));
    }
    out.push(...msg('Z', te.encode('I')));
    await t.write(new Uint8Array(out));
  }
}

function connector(o: ServerOpts): Connector & { tls: number } {
  const c = {
    tls: 0,
    async connect() { const [client, server] = pair(); serve(server, o).catch(() => {}); return client; },
    async startTls(t: Transport) { c.tls++; return t; },
  };
  return c;
}
const URL_ = 'postgresql://escrow_svc.ref:right-password@pooler.example:5432/postgres';

Deno.test('connects over TLS with SCRAM, binds parameters, and returns the first column as text', async () => {
  const cn = connector({});
  const conn = await connect(URL_, { connector: cn });
  assert.equal(cn.tls, 1, 'TLS was started before anything else');
  seen.length = 0;
  const v = await conn.scalar('select public.escrow_load_wraps($1::uuid, $2::uuid, $3::uuid)::text', ["x'); drop table child_keys; --", null, 'c']);
  assert.equal(v, '{"ok":true}');
  assert.equal(seen[0].sql, 'select public.escrow_load_wraps($1::uuid, $2::uuid, $3::uuid)::text');
  assert.deepEqual(seen[0].params, ["x'); drop table child_keys; --", null, 'c'], 'values travel as bound parameters, never in the SQL text');
  await conn.close();
});

Deno.test('a database error comes back with its SQLSTATE and detail', async () => {
  const conn = await connect(URL_, { connector: connector({ answer: () => ({ error: { code: 'SCRAT', message: 'too many', detail: 'restores' } }) }) });
  await assert.rejects(() => conn.scalar('select 1', []), (e) => e instanceof PgError && e.code === 'SCRAT' && e.detail === 'restores');
  assert.equal(await connect(URL_, { connector: connector({ answer: () => ({ value: null }) }) }).then((c) => c.scalar('select 1', [])), null);
});

Deno.test('refuses a server without TLS, cleartext passwords, a skipped SCRAM, a wrong server signature and a wrong password', async () => {
  const code = async (o: ServerOpts, url = URL_) => { try { await connect(url, { connector: connector(o) }); return 'ok'; } catch (e) { return (e as PgError).code; } };
  assert.equal(await code({ refuseTls: true }), '08004');
  assert.equal(await code({ cleartext: true }), '28000');
  assert.equal(await code({ skipSasl: true }), '28000');
  assert.equal(await code({ badServerSignature: true }), '28000');
  assert.equal(await code({}, URL_.replace('right-password', 'wrong-password')), '28P01');
});
