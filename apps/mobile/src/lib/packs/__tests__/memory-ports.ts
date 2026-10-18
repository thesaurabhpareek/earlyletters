/// <reference types="node" />
/**
 * In-memory implementations of the pack engine's file system and HTTP ports,
 * for the interrupted-install matrix (ADR 0016 4.3). Nothing here touches the
 * disk or a socket, so the one kill a case plans is the only fault it can
 * meet. On 17 Oct the shared test machine's disk filled up, a real write in the
 * "kill at remove #9" case failed with ENOSPC, and the matrix reported that as
 * an engine result (`storage_error` where v2 was expected).
 *
 * Behaviour follows the `PackFs` contract in `../engine.ts` and `NodeFs` in
 * `./node-ports.ts`, including the errors Node's fs throws for a missing parent
 * folder, a missing file and a folder where a file is expected.
 */
import { createHash } from 'node:crypto';
import * as path from 'node:path';
import type { PackFs, PackHttp } from '../engine';
import { CrashError, type CrashPlan, type ServedFile } from './node-ports';

const FOLDER = 'folder';
type Entry = Uint8Array | typeof FOLDER;

function fsError(code: string, op: string, p: string): Error {
  return Object.assign(new Error(`${code}: ${op} '${p}'`), { code });
}

/** One phone's storage. Every MemoryFs over it (one per app launch) sees the same files. */
export class MemoryDisk {
  private readonly entries = new Map<string, Entry>([['/', FOLDER]]);

  has(p: string): boolean {
    return this.entries.has(p);
  }

  isFolder(p: string): boolean {
    return this.entries.get(p) === FOLDER;
  }

  /** The file's bytes, or null when missing or a folder. */
  file(p: string): Uint8Array | null {
    const e = this.entries.get(p);
    return e === undefined || e === FOLDER ? null : e;
  }

  /** The file's bytes; throws like `readFileSync` when it is missing or a folder. */
  read(p: string): Uint8Array {
    const e = this.entries.get(p);
    if (e === undefined) throw fsError('ENOENT', 'open', p);
    if (e === FOLDER) throw fsError('EISDIR', 'read', p);
    return e;
  }

  /** Creates or replaces a file; like `writeFileSync`, its folder must exist. */
  write(p: string, data: Uint8Array | string): void {
    if (!this.isFolder(path.posix.dirname(p))) throw fsError('ENOENT', 'open', p);
    if (this.isFolder(p)) throw fsError('EISDIR', 'open', p);
    this.entries.set(p, typeof data === 'string' ? new TextEncoder().encode(data) : Uint8Array.from(data));
  }

  /** Like `mkdirSync(p, { recursive: true })`. */
  mkdirp(p: string): void {
    if (this.isFolder(p)) return;
    if (this.entries.has(p)) throw fsError('EEXIST', 'mkdir', p);
    this.mkdirp(path.posix.dirname(p));
    this.entries.set(p, FOLDER);
  }

  /** Removes a file or a folder and everything in it; nothing happens when missing. */
  remove(p: string): void {
    for (const [k] of this.under(p)) this.entries.delete(k);
  }

  /** Moves a file or a folder and everything in it, in one step. Like `renameSync`, the target's folder must exist. */
  rename(from: string, to: string): void {
    if (!this.entries.has(from)) throw fsError('ENOENT', 'rename', from);
    if (!this.isFolder(path.posix.dirname(to))) throw fsError('ENOENT', 'rename', to);
    const moved = this.under(from);
    for (const [k] of moved) this.entries.delete(k);
    for (const [k, e] of moved) this.entries.set(to + k.slice(from.length), e);
  }

  /** Names in a folder, sorted; [] when missing or a file. */
  list(dir: string): string[] {
    if (!this.isFolder(dir)) return [];
    const prefix = dir === '/' ? '/' : `${dir}/`;
    return [...this.entries.keys()]
      .filter((k) => k !== dir && k.startsWith(prefix) && !k.slice(prefix.length).includes('/'))
      .map((k) => k.slice(prefix.length))
      .sort();
  }

  private under(p: string): [string, Entry][] {
    return [...this.entries].filter(([k]) => k === p || k.startsWith(`${p}/`));
  }
}

/** `NodeFs` over a MemoryDisk, with the same crash injection. */
export class MemoryFs implements PackFs {
  private counts: Record<string, number> = {};
  constructor(
    readonly disk: MemoryDisk,
    readonly root: string,
    private crash: CrashPlan | null = null,
    private free: number | null = null,
  ) {
    disk.mkdirp(root);
  }
  /** The same rule as NodeFs: the nth call of the planned operation throws before it does anything. */
  private tick(op: CrashPlan['op']) {
    this.counts[op] = (this.counts[op] ?? 0) + 1;
    if (this.crash && this.crash.op === op && this.counts[op] === this.crash.nth) throw new CrashError(`crash at ${op} #${this.crash.nth}`);
  }
  join = (...parts: string[]) => path.posix.join(...parts);
  exists = (p: string) => this.disk.has(p);
  isDirectory = (p: string) => this.disk.isFolder(p);
  fileSize = (p: string) => this.disk.file(p)?.length ?? null;
  mkdirp = (p: string) => this.disk.mkdirp(p);
  remove = (p: string) => {
    this.tick('remove');
    this.disk.remove(p);
  };
  rename = (from: string, to: string) => {
    this.tick('rename');
    if (this.disk.has(to)) throw new Error('target exists');
    this.disk.rename(from, to);
  };
  list = (dir: string) => this.disk.list(dir);
  readText = (p: string) => (this.disk.has(p) ? new TextDecoder().decode(this.disk.read(p)) : null);
  writeText = (p: string, text: string) => {
    this.tick('writeText');
    this.disk.write(p, text);
  };
  appendFile = async (from: string, to: string) => {
    this.tick('appendFile');
    const add = this.disk.read(from);
    const have = this.disk.file(to) ?? new Uint8Array(0);
    const out = new Uint8Array(have.length + add.length);
    out.set(have);
    out.set(add, have.length);
    this.disk.write(to, out);
  };
  sha256 = async (p: string) => createHash('sha256').update(this.disk.read(p)).digest('hex');
  freeBytes = () => this.free;
}

/**
 * Answers Range requests from `files` the way the local server does and writes the bytes into a
 * MemoryDisk. No socket. Plain files only: faults (`corrupt`, `failFirst` and so on) belong to the
 * local server, which the other engine tests use.
 */
export class MemoryHttp implements PackHttp {
  constructor(
    private readonly files: Record<string, ServedFile>,
    private readonly disk: MemoryDisk,
  ) {}
  async downloadRange(url: string, dest: string, start: number, end: number, opts: { signal: AbortSignal; onBytes?: (n: number) => void }) {
    if (opts.signal.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    const file = this.files[new URL(url).pathname];
    if (!file) throw new Error('status 404');
    if (file.corrupt || file.ignoreRange || file.failFirst || file.dropOnceAfter !== undefined) throw new Error('MemoryHttp serves plain files only');
    if (start >= file.body.length) throw new Error('status 416');
    const slice = file.body.subarray(start, Math.min(end, file.body.length - 1) + 1);
    opts.onBytes?.(slice.length);
    this.disk.write(dest, slice);
  }
}
