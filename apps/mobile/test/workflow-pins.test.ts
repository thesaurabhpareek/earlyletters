/// <reference types="node" />
/**
 * SEC-R10: a third-party action is named by a full 40 character commit sha, never by a tag (a tag can move and runs
 * someone else's code with our token). The repo still holds 17 tag uses (BRIEF CI-PIN), so this is a ratchet: the
 * known ones are listed in docs/ops/action-pins-allowlist.txt, which only shrinks. The founder's patch
 * (docs/ops/proposed/workflows/ci-pins.patch) pins them and empties the list.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { baseCopy, grown, listEntries } from '../../../scripts/guards/ratchet-base.mjs';

const REPO = join(__dirname, '..', '..', '..');
const LIST = 'docs/ops/action-pins-allowlist.txt';
const SHA = /@[0-9a-f]{40}(\s|$)/;

/** `<file> | <uses line>` for every `uses:` that is not a local action and not pinned. Pure, so a fixture can prove it. */
export function unpinned(file: string, text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const m = /(?:^|\s)uses:\s*(\S+)/.exec(line);
    if (!m || m[1].startsWith('./')) continue;
    if (!SHA.test(m[1] + ' ') && !/^docker:\/\/.+@sha256:[0-9a-f]{64}$/.test(m[1])) out.push(`${file} | ${line}`);
  }
  return out;
}

function workflowFiles(): string[] {
  const out: string[] = [];
  for (const f of readdirSync(join(REPO, '.github/workflows'))) if (/\.ya?ml$/.test(f)) out.push(`.github/workflows/${f}`);
  const actions = join(REPO, '.github/actions');
  if (existsSync(actions)) for (const d of readdirSync(actions)) for (const n of ['action.yml', 'action.yaml']) if (existsSync(join(actions, d, n))) out.push(`.github/actions/${d}/${n}`);
  return out.sort();
}
const found = () => workflowFiles().flatMap((f) => unpinned(f, readFileSync(join(REPO, f), 'utf8')));
const sorted = (a: string[]) => [...a].sort();

describe('workflow action pins', () => {
  it('[SEC-R10] positive control: a tag use is reported and a pinned one is not', () => {
    expect(unpinned('f.yml', '      - uses: actions/checkout@v4')).toEqual(['f.yml | - uses: actions/checkout@v4']);
    const pinned = '- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2';
    expect(unpinned('f.yml', pinned)).toEqual([]);
    // mutant: the same line with the sha swapped for a tag is found again
    expect(unpinned('f.yml', pinned.replace(/@\S+/, '@v4'))).toHaveLength(1);
    expect(unpinned('f.yml', '- uses: ./.github/actions/setup')).toEqual([]);
  });

  it('[SEC-R10] every third-party action in .github/workflows is pinned to a full commit sha, except the listed ones', () => {
    const now = sorted(found());
    const listed = sorted(listEntries(readFileSync(join(REPO, LIST), 'utf8')));
    // not on the list and not pinned: a new tag use
    expect(grown(listed.join('\n'), now.join('\n')), 'tag use not on the list (pin it by sha)').toEqual([]);
    // on the list but already pinned or gone: the list only shrinks, so remove the line
    expect(grown(now.join('\n'), listed.join('\n')), 'listed line is already pinned (delete it from the list)').toEqual([]);
  });

  it('[SEC-R10] every pinned use keeps its version in a comment', () => {
    const bare = workflowFiles().flatMap((f) =>
      readFileSync(join(REPO, f), 'utf8')
        .split(/\r?\n/)
        .map((l, i) => ({ f, i: i + 1, l }))
        .filter(({ l }) => /\buses:\s*\S+@[0-9a-f]{40}/.test(l) && !/#\s*v\d/.test(l))
        .map(({ f: file, i }) => `${file}:${i}`),
    );
    expect(bare).toEqual([]);
  });

  it('[SEC-R10] the allowlist did not grow against the base branch', () => {
    const base = baseCopy(LIST);
    const now = readFileSync(join(REPO, LIST), 'utf8');
    if (base.kind === 'push') return void console.log('ratchet compare: not applicable on push');
    if (base.kind === 'new-file') return void console.log('ratchet compare: the list is new in this change');
    if (base.kind === 'absent') {
      if (base.required) throw new Error(`ratchet compare: base copy of ${LIST} is absent and RATCHET_BASE_REQUIRED=1`);
      return void console.log('ratchet compare: NOT ENFORCED (founder fetch step missing)');
    }
    expect(grown(base.text, now), 'lines added to the allowlist').toEqual([]);
  });
});
