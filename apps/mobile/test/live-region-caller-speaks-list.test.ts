/// <reference types="node" />
/**
 * [PER4-018, BL-1953] `callerSpeaks` is an opt-out (review A note 2 and review B note 2 on #2181): a state block whose
 * caller says its own in-place changes, and forgets the flag, says each change twice. This pin lists every file in
 * apps/mobile/src that draws a StateScreen, StateScreenView or InlineState and also says something itself (`announce(`
 * or `useArrival(`), so the list cannot drift silently:
 *  - SPEAKS_OWN: the callers that say the block's own in-place changes; each such block passes `callerSpeaks`;
 *  - SPEAKS_BESIDE: the callers that speak, but not the block's in-place changes (their blocks are said on arrival,
 *    never change in place, or are a kind that is never said), as read in the #2181 reviews;
 *  - any other file that draws a block and speaks fails until every block in it passes `callerSpeaks`, or the file is
 *    added to one of the two lists with its reason.
 * Source is read with comments stripped. Whether VoiceOver says each line once is a device check.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const BLOCKS = ['InlineState', 'StateScreenView', 'StateScreen'] as const;
type Block = (typeof BLOCKS)[number];

/** The callers that say the block's own in-place changes, and the blocks in each that must pass `callerSpeaks`. */
const SPEAKS_OWN: Record<string, { blocks: readonly Block[]; why: string }> = {
  'app/review.tsx': { blocks: ['InlineState'], why: 'WordsStatus says the words card through useWordsSaid' },
  'components/onboarding/outage-screen.tsx': { blocks: ['StateScreen'], why: 'useArrival keyed on the variant says offline turning into the outage' },
  'components/settings/open-deletion.tsx': { blocks: ['StateScreen'], why: 'its own effects say the cancel and the failure line' },
};

/** The callers that speak beside a block whose in-place changes they do not say, so the block keeps its own line. */
const SPEAKS_BESIDE: Record<string, string> = {
  'components/account/account-layer.tsx': 'kind empty, never said; useArrival says the title on arrival',
  'components/onboarding/new-phone-screens.tsx': 'useArrival says each screen on arrival; "Opening your book" gaining its line is the block\'s own',
  'components/onboarding/region-refused-screen.tsx': 'useArrival on arrival; the block does not change in place',
  'app/listen.tsx': 'kind empty, never said; its announce() is about playback',
  'app/read-together.tsx': 'notFound or empty, never said; its announce() is about the page',
  'app/settings/erase.tsx': 'a fixed loading line that does not change in place; its announce() is about the erase',
  'app/letter/[id].tsx': 'kind notFound, never said; its announce() is about the letter page',
};

const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.tsx?$/.test(name) ? [p] : [];
  });
}

/** Each `<Block ...>` opening tag in the source, read to its closing `>` outside braces and strings. */
function openingTags(source: string, block: Block): string[] {
  const tags: string[] = [];
  const re = new RegExp(`<${block}(?![\\w.])`, 'g');
  for (let m = re.exec(source); m; m = re.exec(source)) {
    let depth = 0;
    let quote: string | null = null;
    let i = m.index + m[0].length;
    for (; i < source.length; i++) {
      const ch = source[i];
      if (quote) {
        if (ch === quote && source[i - 1] !== '\\') quote = null;
      } else if (ch === '"' || ch === "'" || ch === '`') quote = ch;
      else if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0) break;
    }
    tags.push(source.slice(m.index, i + 1));
  }
  return tags;
}

/** The tag passes `callerSpeaks` as true: bare, or `={true}`. */
const passesCallerSpeaks = (tag: string) => /\scallerSpeaks(?=[\s/>]|=\{true\})/.test(tag);
const speaks = (source: string) => /\b(announce|useArrival)\(/.test(source);

const callers = files(SRC)
  .map((p) => ({ rel: relative(SRC, p).split('\\').join('/'), source: code(readFileSync(p, 'utf8')) }))
  .filter((f) => f.rel !== 'components/ui/state-screen.tsx')
  .map((f) => ({ ...f, tags: BLOCKS.map((b) => ({ block: b, tags: openingTags(f.source, b) })).filter((t) => t.tags.length > 0) }))
  .filter((f) => f.tags.length > 0);

describe('[PER4-018][BL-1953] every state block beside a caller that speaks is accounted for', () => {
  it('[BL-1953] the scan finds the callers (it reads the blocks it should)', () => {
    expect(callers.length).toBeGreaterThanOrEqual(10);
    for (const rel of [...Object.keys(SPEAKS_OWN), ...Object.keys(SPEAKS_BESIDE)]) {
      const f = callers.find((c) => c.rel === rel);
      expect(f, `${rel} no longer draws a state block: take it off the list`).toBeDefined();
      expect(speaks(f!.source), `${rel} no longer speaks: take it off the list`).toBe(true);
    }
  });

  it('[BL-1953] each caller that says its own in-place changes passes callerSpeaks on its block', () => {
    for (const [rel, { blocks, why }] of Object.entries(SPEAKS_OWN)) {
      const f = callers.find((c) => c.rel === rel)!;
      for (const block of blocks) {
        const tags = f.tags.find((t) => t.block === block)?.tags ?? [];
        expect(tags.length, `${rel} draws no ${block}`).toBeGreaterThan(0);
        for (const tag of tags) expect(passesCallerSpeaks(tag), `${rel} <${block}> (${why}) must pass callerSpeaks`).toBe(true);
      }
    }
  });

  it('[BL-1953] a new caller that speaks beside a block passes callerSpeaks, or is listed with its reason', () => {
    const unlisted = callers.filter((f) => speaks(f.source) && !(f.rel in SPEAKS_OWN) && !(f.rel in SPEAKS_BESIDE));
    const missing = unlisted.flatMap((f) =>
      f.tags.flatMap((t) => t.tags.filter((tag) => !passesCallerSpeaks(tag)).map(() => `${f.rel} <${t.block}>`)),
    );
    expect(missing, 'calls announce( or useArrival( beside a state block without callerSpeaks: pass it, or list the file here with why').toEqual([]);
  });

  it('[BL-1953] control: the reader tells a passed flag from a missing or false one', () => {
    expect(passesCallerSpeaks('<InlineState\n  callerSpeaks\n  kind={card.kind}>')).toBe(true);
    expect(passesCallerSpeaks('<StateScreen callerSpeaks={true} kind="error" />')).toBe(true);
    expect(passesCallerSpeaks('<StateScreen callerSpeaks={false} kind="error" />')).toBe(false);
    expect(passesCallerSpeaks('<StateScreen kind="error" onPress={() => a > b} />')).toBe(false);
    expect(openingTags('<StateScreen kind="x" primary={{ onPress: () => go() }} callerSpeaks />', 'StateScreen')[0]).toContain('callerSpeaks');
    expect(openingTags('<StateScreenView kind="x" />', 'StateScreen')).toEqual([]);
  });
});
