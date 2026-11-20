/// <reference types="node" />
/**
 * A migrated store with Find's index on, and fictional Asha letters to find. Words here are made up for the tests.
 */
import { entries } from '../../src/lib/db/repos';
import type { Entry } from '../../src/lib/db/repos';
import { ensureSearchIndex, forgetSearchState } from '../../src/lib/find/lifecycle';
import { forgetSearchView, resetFindExtraSources } from '../../src/lib/find/sources';
import { fixture, letter, seedChild, type Fixture } from './store-fixture';

export interface FindFixture extends Fixture {
  /** Writes a kept letter the way the app does, and returns its id. */
  add: (over?: Partial<Entry> & { text?: string }) => string;
}

let n = 0;

export function findFixture(opts: { index?: boolean } = {}): FindFixture {
  const f = fixture();
  resetFindExtraSources();
  forgetSearchState(f.db);
  forgetSearchView(f.db);
  seedChild(f.db);
  if (opts.index !== false) ensureSearchIndex(f.db);
  const add = (over: Partial<Entry> & { text?: string } = {}) => {
    n += 1;
    const id = over.id ?? `0199a5b0-0000-7000-8000-${String(n).padStart(12, '0')}`;
    const { text, ...rest } = over;
    entries.upsert(
      f.ctx,
      letter({ id, finalText: text ?? 'Asha, you laughed at the rain today.', audioUri: null, audioSha256: null, audioBytes: null, audioDurationMs: null, captureMode: 'typed', inBook: true, ...rest }),
      { childId: null, authorSignsAs: null },
    );
    return id;
  };
  return { ...f, add };
}
