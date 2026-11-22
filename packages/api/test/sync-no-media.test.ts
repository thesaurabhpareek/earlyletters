/**
 * [NX-39-R33] Sync carries no picture and nothing derived from one. Every
 * valibot schema the server contracts export (sync and family, through the
 * `@scribe/api/server` entry) is walked, and no key may name a library, a
 * local id, an asset, a place, a geohash, a moment, an occasion, a taken-at
 * time or media. Fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import * as server from '../src/server';

const BANNED = /library|local_id|asset|place|geohash|moment|occasion|taken_at|media/i;

/**
 * The prompt library is the 111 prompts (content), not a picture library: the one key that matches by name
 * only. It is exempt on its full path (schema name, then keys), never by its last key, so the same name
 * anywhere else still fails.
 */
const NOT_A_PICTURE_LIBRARY = new Set([
  'PulledRowSchema.prompt_library_version',
  'PulledBookSchema.rows.prompt_library_version',
  'GoneBookSchema.rows.prompt_library_version',
  'PullResponseSchema.books.rows.prompt_library_version',
]);

type Node = { kind?: string; type?: string; entries?: Record<string, Node>; options?: Node[]; item?: Node; items?: Node[]; wrapped?: Node; rest?: Node; pipe?: Node[]; key?: Node; value?: Node; getter?: (input: unknown) => Node };

/** Every object key reachable from a schema, as dotted paths. */
function keysOf(node: Node | undefined, path: string, out: string[], seen: Set<Node>): void {
  if (!node || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);
  if (node.entries && typeof node.entries === 'object') {
    for (const [k, child] of Object.entries(node.entries)) {
      out.push(`${path}.${k}`);
      keysOf(child, `${path}.${k}`, out, seen);
    }
  }
  if (typeof node.getter === 'function') {
    // valibot v.lazy: the schema is built on demand. `seen` stops a schema that returns itself.
    try {
      keysOf(node.getter(undefined), path, out, seen);
    } catch (e) {
      // A getter that needs real input cannot be walked. A stack overflow is a broken walk, never "no keys".
      if (e instanceof RangeError) throw e;
    }
  }
  for (const list of [node.options, node.items, node.pipe]) for (const n of list ?? []) keysOf(n, path, out, seen);
  for (const n of [node.item, node.wrapped, node.rest, node.key, node.value]) keysOf(n, path, out, seen);
}

/** Keys of one schema that break the rule, with the exemption applied to full paths only. */
function offenders(name: string, schema: Node): string[] {
  const keys: string[] = [];
  keysOf(schema, name, keys, new Set());
  return keys.filter((k) => BANNED.test(k.slice(k.indexOf('.') + 1)) && !NOT_A_PICTURE_LIBRARY.has(k));
}

const schemas = Object.entries(server).filter(([, x]) => (x as Node | null)?.kind === 'schema') as [string, Node][];

describe('[NX-39-R33] the sync payload carries no media and no derived field', () => {
  it('walks real schemas (not an empty pass), including the entry and pull shapes', () => {
    const names = schemas.map(([n]) => n);
    expect(names).toEqual(expect.arrayContaining(['EntryStateSchema', 'PulledRowSchema', 'PullResponseSchema', 'BookMetaSchema']));
    const all: string[] = [];
    for (const [n, s] of schemas) keysOf(s, n, all, new Set());
    expect(all.some((k) => k.endsWith('.raw_transcript'))).toBe(true);
  });

  it('no schema key matches a banned name', () => {
    const hits: string[] = [];
    for (const [n, s] of schemas) hits.push(...offenders(n, s));
    expect(hits).toEqual([]);
  });

  it('the one exemption is used on its real path', () => {
    const all: string[] = [];
    for (const [n, s] of schemas) keysOf(s, n, all, new Set());
    for (const path of NOT_A_PICTURE_LIBRARY) expect(all).toContain(path);
  });

  describe('the walk itself (fixture schemas)', () => {
    it('finds a banned key inside a v.lazy schema', () => {
      const lazy = v.object({ ok: v.string(), inner: v.lazy(() => v.object({ geohash: v.string() })) });
      expect(offenders('AshaLazy', lazy as unknown as Node)).toEqual(['AshaLazy.inner.geohash']);
    });

    it('survives a lazy schema that returns itself', () => {
      const self: v.GenericSchema = v.object({ name: v.string(), next: v.optional(v.lazy(() => self)) });
      const keys: string[] = [];
      keysOf(self as unknown as Node, 'AshaSelf', keys, new Set());
      expect(keys).toEqual(['AshaSelf.name', 'AshaSelf.next']);
    });

    it('skips a lazy getter that throws and still walks the rest', () => {
      const bad = v.object({ a: v.lazy(() => { throw new Error('needs input'); }), place: v.string() });
      expect(offenders('AshaThrows', bad as unknown as Node)).toEqual(['AshaThrows.place']);
    });

    it('does not exempt the same key name on another path', () => {
      const off = v.object({ prompt_library_version: v.number(), nested: v.object({ prompt_library_version: v.number() }) });
      expect(offenders('AshaOther', off as unknown as Node)).toEqual(['AshaOther.prompt_library_version', 'AshaOther.nested.prompt_library_version']);
      expect(offenders('PulledRowSchema', off as unknown as Node)).toEqual(['PulledRowSchema.nested.prompt_library_version']);
    });
  });
});
