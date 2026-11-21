/// <reference types="node" />
/** The shrink-only list rule (scripts/guards/ratchet-base.mjs; BRIEF CI-PIN section 10). No git, no network: `run` is injected. */
import { describe, expect, it } from 'vitest';
import { baseCopy, grown } from '../../../scripts/guards/ratchet-base.mjs';

const fail = () => {
  throw new Error('no');
};

describe('ratchet base copy', () => {
  it('[SEC-R10] a push event has no base and the compare is not run', () => {
    expect(baseCopy('x.txt', { env: { GITHUB_EVENT_NAME: 'push' }, run: fail })).toEqual({ kind: 'push' });
  });
  it('[SEC-R10] a pull request reads the copy on its base branch', () => {
    const seen: string[][] = [];
    const run = (a: string[]) => (seen.push(a), 'a\n');
    const r = baseCopy('x.txt', { env: { GITHUB_BASE_REF: 'develop' }, run });
    expect(r).toMatchObject({ kind: 'base', text: 'a\n' });
    expect(seen[1]).toEqual(['show', 'origin/develop:x.txt']);
  });
  it('[SEC-R10] an unfetched base is absent, and required only when RATCHET_BASE_REQUIRED is 1', () => {
    expect(baseCopy('x.txt', { env: {}, run: fail })).toMatchObject({ kind: 'absent', required: false });
    expect(baseCopy('x.txt', { env: { RATCHET_BASE_REQUIRED: '1' }, run: fail })).toMatchObject({ kind: 'absent', required: true });
  });
  it('[SEC-R10] a base that exists without the file is a new file, not an absent base', () => {
    const run = (a: string[]) => (a[0] === 'show' ? fail() : '');
    expect(baseCopy('x.txt', { env: { RATCHET_BASE_REQUIRED: '1' }, run })).toMatchObject({ kind: 'new-file' });
  });
});

describe('ratchet growth', () => {
  it('[SEC-R10] a removed line is fine and an added line is reported', () => {
    expect(grown('a\nb\n', 'a\n')).toEqual([]);
    expect(grown('a\n', 'a\nb\n')).toEqual(['b']);
  });
  it('[SEC-R10] a repeated line counts each time, and comments and blanks are ignored', () => {
    expect(grown('a\n', 'a\na\n')).toEqual(['a']);
    expect(grown('# c\na\n', '# other\n\na\n')).toEqual([]);
  });
});
