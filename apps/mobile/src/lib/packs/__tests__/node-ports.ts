/// <reference types="node" />
/**
 * Node implementations of the pack engine's ports, for tests only: a real
 * file system under a temp directory (with crash injection), real HTTP Range
 * requests through `fetch`, and a local Range-capable server with faults.
 */
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Connection, KeyValue, NetworkPort, PackFs, PackHttp } from '../engine';

export class CrashError extends Error {
  override name = 'CrashError';
}

/** Throws a CrashError on the nth call of an operation, simulating the app being killed at that instant. */
export interface CrashPlan {
  op: 'rename' | 'writeText' | 'remove' | 'appendFile';
  nth: number;
}

export class NodeFs implements PackFs {
  private counts: Record<string, number> = {};
  constructor(
    readonly root: string,
    private crash: CrashPlan | null = null,
    private free: number | null = null,
  ) {
    fs.mkdirSync(root, { recursive: true });
  }
  private tick(op: CrashPlan['op']) {
    this.counts[op] = (this.counts[op] ?? 0) + 1;
    if (this.crash && this.crash.op === op && this.counts[op] === this.crash.nth) throw new CrashError(`crash at ${op} #${this.crash.nth}`);
  }
  setFreeBytes(n: number | null) {
    this.free = n;
  }
  join = (...parts: string[]) => path.join(...parts);
  exists = (p: string) => fs.existsSync(p);
  isDirectory = (p: string) => fs.existsSync(p) && fs.statSync(p).isDirectory();
  fileSize = (p: string) => (fs.existsSync(p) && fs.statSync(p).isFile() ? fs.statSync(p).size : null);
  mkdirp = (p: string) => void fs.mkdirSync(p, { recursive: true });
  remove = (p: string) => {
    this.tick('remove');
    fs.rmSync(p, { recursive: true, force: true });
  };
  rename = (from: string, to: string) => {
    this.tick('rename');
    if (fs.existsSync(to)) throw new Error('target exists');
    fs.renameSync(from, to);
  };
  list = (dir: string) => (fs.existsSync(dir) && fs.statSync(dir).isDirectory() ? fs.readdirSync(dir).sort() : []);
  readText = (p: string) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
  writeText = (p: string, text: string) => {
    this.tick('writeText');
    fs.writeFileSync(p, text);
  };
  appendFile = async (from: string, to: string) => {
    this.tick('appendFile');
    fs.appendFileSync(to, fs.readFileSync(from));
  };
  sha256 = async (p: string) => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  freeBytes = () => this.free;
}

export class NodeHttp implements PackHttp {
  readonly requests: { url: string; range: string }[] = [];
  async downloadRange(url: string, dest: string, start: number, end: number, opts: { signal: AbortSignal; onBytes?: (n: number) => void }) {
    const range = `bytes=${start}-${end}`;
    this.requests.push({ url, range });
    const res = await fetch(url, { headers: { Range: range }, signal: opts.signal });
    if (res.status < 200 || res.status > 299) {
      await res.arrayBuffer().catch(() => undefined);
      throw new Error(`status ${res.status}`);
    }
    const body = new Uint8Array(await res.arrayBuffer());
    opts.onBytes?.(body.length);
    fs.writeFileSync(dest, body);
  }
}

export class FakeNetwork implements NetworkPort {
  private listeners = new Set<(c: Connection) => void>();
  constructor(public current: Connection = 'wifi') {}
  async connection() {
    return this.current;
  }
  subscribe(l: (c: Connection) => void) {
    this.listeners.add(l);
    return () => void this.listeners.delete(l);
  }
  set(c: Connection) {
    this.current = c;
    for (const l of this.listeners) l(c);
  }
}

export class MemoryKv implements KeyValue {
  private m = new Map<string, string>();
  get = (k: string) => this.m.get(k) ?? null;
  set = (k: string, v: string) => void this.m.set(k, v);
}

export interface ServedFile {
  body: Uint8Array;
  /** Serve these bytes instead (a host serving the wrong file). */
  corrupt?: boolean;
  /** Answer 200 with the whole body, ignoring Range. */
  ignoreRange?: boolean;
  /** Fail this many requests with HTTP 503 first. */
  failFirst?: number;
  /** Cut the connection after this many body bytes, on the next request only. */
  dropOnceAfter?: number;
}

/** A local server that answers Range requests like a CDN, with injectable faults. */
export async function startRangeServer(files: Record<string, ServedFile>) {
  const log: { path: string; range: string | null; status: number }[] = [];
  const server = http.createServer((req, res) => {
    const file = files[req.url ?? ''];
    const range = req.headers.range ?? null;
    if (!file) {
      log.push({ path: req.url ?? '', range, status: 404 });
      res.writeHead(404).end();
      return;
    }
    if (file.failFirst && file.failFirst > 0) {
      file.failFirst--;
      log.push({ path: req.url ?? '', range, status: 503 });
      res.writeHead(503).end();
      return;
    }
    let body = file.body;
    if (file.corrupt) {
      body = Uint8Array.from(body);
      body[0] ^= 0xff;
    }
    let status = 200;
    let slice = body;
    const m = range && !file.ignoreRange ? /^bytes=(\d+)-(\d+)?$/.exec(range) : null;
    if (m) {
      const start = Number(m[1]);
      const end = Math.min(m[2] ? Number(m[2]) : body.length - 1, body.length - 1);
      if (start >= body.length) {
        log.push({ path: req.url ?? '', range, status: 416 });
        res.writeHead(416, { 'Content-Range': `bytes */${body.length}` }).end();
        return;
      }
      slice = body.subarray(start, end + 1);
      status = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${body.length}`);
    }
    log.push({ path: req.url ?? '', range, status });
    res.writeHead(status, { 'Content-Length': String(slice.length), 'Accept-Ranges': 'bytes' });
    if (file.dropOnceAfter !== undefined) {
      const n = file.dropOnceAfter;
      file.dropOnceAfter = undefined;
      res.write(slice.subarray(0, n));
      setTimeout(() => res.destroy(), 5);
      return;
    }
    res.end(slice);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    /** Our schema accepts https URLs only, so tests map a fake https host to this server. */
    base: `http://127.0.0.1:${port}`,
    log,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

/** Rewrites the https URLs from the manifest to the local server. */
export class LocalHttp extends NodeHttp {
  constructor(private readonly base: string) {
    super();
  }
  override downloadRange(url: string, dest: string, start: number, end: number, opts: { signal: AbortSignal; onBytes?: (n: number) => void }) {
    return super.downloadRange(url.replace(/^https:\/\/[^/]+/, this.base), dest, start, end, opts);
  }
}

export function tempRoot(label: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `scribe-packs-${label}-`));
}

export const sha256 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

export function bytesOf(n: number, seed = 7): Uint8Array {
  const out = new Uint8Array(n);
  let x = seed;
  for (let i = 0; i < n; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    out[i] = x & 255;
  }
  return out;
}
