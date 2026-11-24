/**
 * In-memory `PackFs` for the web build (BL-2174). `expo-file-system` throws on web, so the pack manager gets an empty
 * phone that forgets everything on reload. Behaves like the contract in engine.ts: no error for a missing path on
 * `remove` and `list`, `rename` refuses an existing target. It never downloads or hashes: `sha256` and `appendFile`
 * are not reachable because no manifest exists on web.
 */
import type { PackFs } from './engine';

export class WebPackFs implements PackFs {
  private readonly files = new Map<string, string>();
  private readonly dirs = new Set<string>();

  constructor(readonly root: string) {}

  join(...parts: string[]): string {
    return parts.map((p, i) => (i === 0 ? p.replace(/\/+$/, '') : p.replace(/^\/+|\/+$/g, ''))).join('/');
  }
  exists(path: string): boolean {
    return this.files.has(path) || this.dirs.has(path);
  }
  isDirectory(path: string): boolean {
    return this.dirs.has(path);
  }
  fileSize(path: string): number | null {
    const t = this.files.get(path);
    return t === undefined ? null : t.length;
  }
  mkdirp(path: string): void {
    this.dirs.add(path);
  }
  remove(path: string): void {
    this.files.delete(path);
    this.dirs.delete(path);
    for (const k of [...this.files.keys()]) if (k.startsWith(`${path}/`)) this.files.delete(k);
    for (const k of [...this.dirs]) if (k.startsWith(`${path}/`)) this.dirs.delete(k);
  }
  rename(from: string, to: string): void {
    if (this.exists(to)) throw new Error('target_exists');
    const t = this.files.get(from);
    if (t !== undefined) {
      this.files.delete(from);
      this.files.set(to, t);
    } else if (this.dirs.delete(from)) {
      this.dirs.add(to);
    }
  }
  list(dir: string): string[] {
    const names = new Set<string>();
    for (const k of [...this.files.keys(), ...this.dirs]) {
      if (k.startsWith(`${dir}/`)) names.add(k.slice(dir.length + 1).split('/')[0]);
    }
    return [...names].sort();
  }
  readText(path: string): string | null {
    return this.files.get(path) ?? null;
  }
  writeText(path: string, text: string): void {
    this.files.set(path, text);
  }
  async appendFile(): Promise<void> {
    throw new Error('not_available_on_web');
  }
  async sha256(): Promise<string> {
    throw new Error('not_available_on_web');
  }
  freeBytes(): number | null {
    return null;
  }
}
