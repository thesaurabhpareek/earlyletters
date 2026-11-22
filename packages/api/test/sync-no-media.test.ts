/**
 * [NX-39-R33] Sync carries no picture and nothing derived from one. Every
 * valibot schema the server contracts export (sync and family, through the
 * `@scribe/api/server` entry) is walked, and no key may name a library, a
 * local id, an asset, a place, a geohash, a moment, an occasion, a taken-at
 * time or media. Fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import * as server from '../src/server';

const BANNED = /library|local_id|asset|place|geohash|moment|occasion|taken_at|media/i;

/** The prompt library is the 111 prompts (content), not a picture library: the one key that matches by name only. */
const NOT_A_PICTURE_LIBRARY = new Set(['prompt_library_version']);

type Node = { kind?: string; type?: string; entries?: Record<string, Node>; options?: Node[]; item?: Node; items?: Node[]; wrapped?: Node; rest?: Node; pipe?: Node[]; key?: Node; value?: Node };

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
  for (const list of [node.options, node.items, node.pipe]) for (const n of list ?? []) keysOf(n, path, out, seen);
  for (const n of [node.item, node.wrapped, node.rest, node.key, node.value]) keysOf(n, path, out, seen);
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
    for (const [n, s] of schemas) {
      const keys: string[] = [];
      keysOf(s, n, keys, new Set());
      hits.push(...keys.filter((k) => BANNED.test(k.slice(k.indexOf('.') + 1)) && !NOT_A_PICTURE_LIBRARY.has(k.slice(k.lastIndexOf('.') + 1))));
    }
    expect(hits).toEqual([]);
  });
});
