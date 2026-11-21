/// <reference types="node" />
/**
 * A migrated store with Find's index on (unless `index: false`), and fictional Asha letters to find. Words here are made up for the tests. From #798's
 * test/helpers/find-fixture.ts; it lives beside the Find tests (not in helpers/) so BL-952 stays inside its claim.
 * Not a test file: vitest collects only *.test.ts.
 */
import { entries } from '../src/lib/db/repos';
import type { Entry } from '../src/lib/db/repos';
import { ensureSearchIndex, forgetSearchState, reindexLetter, setIndexableBooks } from '../src/lib/find/lifecycle';
import { forgetSearchView, resetFindExtraSources } from '../src/lib/find/sources';
import { fixture, letter, seedChild, type Fixture } from './helpers/store-fixture';

export interface FindFixture extends Fixture {
  /** Writes a kept letter the way the app does, and returns its id. */
  add: (over?: Partial<Entry> & { text?: string }) => string;
}

let n = 0;

export function findFixture(opts: { index?: boolean } = {}): FindFixture {
  const f = fixture();
  resetFindExtraSources();
  setIndexableBooks(null);
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
    reindexLetter(f.db, id); // what the repo hook does once the store is wired (BL-952 slice 7); a no-op twice
    return id;
  };
  return { ...f, add };
}
