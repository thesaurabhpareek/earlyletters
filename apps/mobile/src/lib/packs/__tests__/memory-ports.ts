/// <reference types="node" />
/**
 * In-memory implementations of the pack engine's file system and HTTP ports
 * (ADR 0016 4.3). Nothing here touches the disk or a socket. On 17 Oct the
 * shared test machine's disk filled up, a real write in the "kill at remove #9"
 * case failed with ENOSPC, and the matrix reported that as an engine result
 * (`storage_error` where v2 was expected). Engine tests now keep their files on
 * a MemoryDisk, so free space on the machine cannot decide a result, and a full
 * disk is a case a test asks for (`MemoryDisk.full`).
 *
 * Behaviour follows the `PackFs` contract in `../engine.ts` and `NodeFs` in
 * `./node-ports.ts`, including the errors Node's fs throws for a missing parent
 * folder, a missing file and a folder where a file is expected. One engine test
 * runs the same update on the real disk and checks both make the same calls
 * (`recordCalls`) and leave the same files (`treeOf`).
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
  /**
   * While true the disk has no free space: making a folder or appending fails with ENOSPC, and writing a
   * file leaves it created but empty before failing, as `writeFileSync` does. Deleting and renaming still work.
   */
  full = false;
  /** Each path a write, append or new folder was refused for while `full`. */
  readonly refused: string[] = [];

  private refuse(p: string): never {
    this.refused.push(p);
    throw fsError('ENOSPC', 'write', p);
  }

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
    if (this.full) {
      this.entries.set(p, new Uint8Array(0));
      this.refuse(p);
    }
    this.entries.set(p, typeof data === 'string' ? new TextEncoder().encode(data) : Uint8Array.from(data));
  }

  /** Adds bytes to the end of a file, creating it when missing; like `appendFileSync`, its folder must exist. */
  append(p: string, data: Uint8Array): void {
    if (!this.isFolder(path.posix.dirname(p))) throw fsError('ENOENT', 'open', p);
    if (this.isFolder(p)) throw fsError('EISDIR', 'open', p);
    if (this.full) this.refuse(p);
    const have = this.file(p) ?? new Uint8Array(0);
    const out = new Uint8Array(have.length + data.length);
    out.set(have);
    out.set(data, have.length);
    this.entries.set(p, out);
  }

  /** Like `mkdirSync(p, { recursive: true })`. */
  mkdirp(p: string): void {
    if (this.isFolder(p)) return;
    if (this.entries.has(p)) throw fsError('EEXIST', 'mkdir', p);
    this.mkdirp(path.posix.dirname(p));
    if (this.full) this.refuse(p);
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
  /** Calls so far of each operation a crash plan can name. */
  readonly counts: Partial<Record<CrashPlan['op'], number>> = {};
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
    this.disk.append(to, this.disk.read(from));
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
  /** Range requests asked of this client so far. */
  requests = 0;
  constructor(
    private readonly files: Record<string, ServedFile>,
    private readonly disk: MemoryDisk,
  ) {}
  async downloadRange(url: string, dest: string, start: number, end: number, opts: { signal: AbortSignal; onBytes?: (n: number) => void }) {
    this.requests++;
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

// ---------------------------------------------------------------------------
// Checking these ports against the real disk

const CALLS = ['exists', 'isDirectory', 'fileSize', 'mkdirp', 'remove', 'rename', 'list', 'readText', 'writeText', 'appendFile', 'sha256', 'freeBytes'] as const;

/**
 * The same file system, with every call the engine can make (all but `join`) logged to `log`: its
 * arguments, with the root shown as `~`, and its result or the error it threw (the code when it has one).
 */
export function recordCalls<T extends PackFs>(target: T, log: string[]): T {
  const rel = (v: unknown): unknown => (typeof v === 'string' ? v.split(target.root).join('~') : Array.isArray(v) ? v.map(rel) : v);
  const failed = (label: string, e: unknown) => {
    const x = e as { code?: string; name?: string; message?: string };
    log.push(`${label} threw ${x.code ?? `${x.name}: ${x.message}`}`);
  };
  const wrapped = Object.create(target) as T;
  for (const name of CALLS) {
    const call = (target[name] as (...a: unknown[]) => unknown).bind(target);
    (wrapped as Record<string, unknown>)[name] = (...args: unknown[]) => {
      const label = `${name}(${args.map((a) => JSON.stringify(rel(a))).join(', ')})`;
      let out: unknown;
      try {
        out = call(...args);
      } catch (e) {
        failed(label, e);
        throw e;
      }
      if (!(out instanceof Promise)) {
        log.push(`${label} = ${JSON.stringify(rel(out))}`);
        return out;
      }
      return out.then(
        (v) => {
          log.push(`${label} = ${JSON.stringify(rel(v))}`);
          return v;
        },
        (e) => {
          failed(label, e);
          throw e;
        },
      );
    };
  }
  return wrapped;
}

/** Every folder and file under the root, the root shown as `~`, with each file's size and SHA-256. */
export async function treeOf(f: PackFs, dir = f.root): Promise<string[]> {
  const out: string[] = [];
  for (const name of f.list(dir)) {
    const p = f.join(dir, name);
    const shown = p.split(f.root).join('~');
    if (f.isDirectory(p)) out.push(`${shown}/`, ...(await treeOf(f, p)));
    else out.push(`${shown} ${f.fileSize(p)} ${await f.sha256(p)}`);
  }
  return out;
}
