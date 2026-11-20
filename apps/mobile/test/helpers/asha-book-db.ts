/// <reference types="node" />
/**
 * Writes the planned Asha book (scripts/qa/asha-book/plan.mjs) into a node:sqlite database through the app's real
 * migrations and the real entries writer (repos/entries upsert, tombstone). Fictional family only. Same plan, same
 * clock and same ids give the same file bytes. Pictures are not stored here: the store on this branch has no picture
 * column yet (NS-01 not merged), so they stay plan rows, returned as a manifest of file names and sizes (no bytes).
 */
import { ENGINE_VERSION } from '@scribe/core';
import { migrate } from '../../src/lib/db/migrations';
import * as entries from '../../src/lib/db/repos/entries';
import type { Entry, RepoContext } from '../../src/lib/db/repos';
import { planBook, RTL, type AshaItem } from '../../../../scripts/qa/asha-book/plan.mjs';
import { insertBook } from './store-fixture';
import { nodeDb } from './node-db';

export const ASHA_BOOK_ID = 'child-asha';
const AT = '2026-11-20T09:00:00.000Z';

/** A plan-order, repeatable id shaped like a UUIDv7 (the first 12 hex digits are the letter's date). */
export const letterId = (item: AshaItem) =>
  `${Date.parse(`${item.date}T00:00:00Z`).toString(16).padStart(12, '0').replace(/^(.{8})(.{4})$/, '$1-$2')}-7000-8000-${item.index.toString(16).padStart(12, '0')}`;

export function entryOf(item: AshaItem): Entry {
  return {
    id: letterId(item),
    kind: 'letter',
    occurredOn: item.date,
    capturedAt: `${item.date}T08:${String(item.index % 60).padStart(2, '0')}:00.000Z`,
    captureMode: item.kind === 'spoken' ? 'spoken' : 'typed',
    editLevel: 'clean',
    promptKey: null,
    engineVersion: ENGINE_VERSION,
    rawTranscript: item.text,
    machineEdits: [],
    finalText: item.text,
    inBook: true,
    soundsLikeMe: null,
    childId: ASHA_BOOK_ID,
    authorSignsAs: 'Mama',
    audioUri: item.audio ? `file:///Documents/asha-${item.index}.m4a` : null,
    audioDurationMs: item.audio?.ms ?? null,
    audioSha256: item.audio?.sha256 ?? null,
    audioBytes: item.audio?.bytes ?? null,
    transcriptStatus: null,
    language: item.language,
    baseDirection: RTL.has(item.language) ? 'rtl' : 'ltr',
  };
}

export interface AshaBookDb {
  ctx: RepoContext;
  plan: ReturnType<typeof planBook>;
  /** Picture rows: letter id, file name, size. No image bytes. */
  pictures: { letterId: string; file: string; aspect: string; bytes: number }[];
  close: () => void;
}

/** `path` defaults to memory; give a file path to get bytes you can hash. */
export function buildAshaBook(opts: { seed?: number; letters?: number; pictures?: number; path?: string } = {}): AshaBookDb {
  const plan = planBook(opts);
  const { db, close } = nodeDb(opts.path);
  const ctx: RepoContext = { db, now: () => AT, newId: () => 'asha-fixed-id' };
  let n = 0;
  migrate(db, { now: AT, newId: () => `asha-mig-${++n}` });
  insertBook(db, { id: ASHA_BOOK_ID, at: AT });
  db.transaction(() => {
    for (const item of plan.items) {
      entries.upsert(ctx, entryOf(item), { childId: ASHA_BOOK_ID, authorSignsAs: 'Mama' });
      if (item.deleted) entries.tombstone(ctx, letterId(item));
    }
  });
  const pictures = plan.items.filter((i) => i.picture).map((i) => ({ letterId: letterId(i), file: i.picture!.file, aspect: i.picture!.aspect, bytes: i.picture!.bytes }));
  return { ctx, plan, pictures, close };
}
