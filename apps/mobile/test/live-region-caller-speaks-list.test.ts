/// <reference types="node" />
/**
 * [PER4-018, BL-1953] `callerSpeaks` is an opt-out (review A note 2 and review B note 2 on #2181): a state block whose
 * caller says its own in-place changes, and forgets the flag, says each change twice. This pin lists every file in
 * apps/mobile/src that draws a StateScreen, StateScreenView or InlineState and also says something itself, so the list
 * cannot drift silently:
 *  - SPEAKS_OWN: the callers that say the block's own in-place changes, and the speaking call that does it; each such
 *    block passes `callerSpeaks`;
 *  - SPEAKS_BESIDE: the callers that speak, but not the block's in-place changes (their blocks are said on arrival,
 *    never change in place, or are a kind that is never said), with the block kinds that reason holds for, as read in
 *    the #2181 and #2216 reviews;
 *  - any other file that draws a block and speaks fails until every block in it passes `callerSpeaks`, or the file is
 *    added to one of the two lists with its reason.
 * "Speaks" is read from the source, not from a hand list (review B finding 1 on #2216): a file speaks when it imports
 * `announce` from lib/a11y (a call, or `announce` handed to a hook such as useSaidOnChange) or calls
 * AccessibilityInfo.announceForAccessibility, or when it calls a function or hook exported by a module that does
 * (useWordsSaid, useArrival, useToast and the rest, found by the scan). lib/a11y.ts itself and state-screen.tsx (the
 * block, whose own line `callerSpeaks` turns off) are not such modules. Source is read with comments stripped.
 * Whether VoiceOver says each line once is a device check.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STATE_SPEC, type StateKind } from '../src/components/ui/state-screen.logic';
import { openingTags } from './helpers/jsx-tags';

const SRC = join(__dirname, '..', 'src');
const BLOCKS = ['InlineState', 'StateScreenView', 'StateScreen'] as const;
type Block = (typeof BLOCKS)[number];
const BLOCK_FILE = 'components/ui/state-screen.tsx';
const ANNOUNCER = 'lib/a11y.ts';

/** The callers that say the block's own in-place changes, the speaking call that says them, and the blocks in each that must pass `callerSpeaks`. */
const SPEAKS_OWN: Record<string, { blocks: readonly Block[]; through: string; why: string }> = {
  'app/review.tsx': { blocks: ['InlineState'], through: 'useWordsSaid', why: 'WordsStatus says the words card through useWordsSaid' },
  'components/onboarding/outage-screen.tsx': { blocks: ['StateScreen'], through: 'useArrival', why: 'useArrival keyed on the variant says offline turning into the outage' },
  'components/settings/open-deletion.tsx': { blocks: ['StateScreen'], through: 'announce', why: 'its own effects say the cancel and the failure line' },
};

/**
 * The callers that speak beside a block whose in-place changes they do not say, so the block keeps its own line. `kinds`
 * is every `kind="..."` the file's blocks may have for the reason to hold; `unsaid` marks a reason that rests on those
 * kinds never being said (STATE_SPEC live none).
 */
const SPEAKS_BESIDE: Record<string, { kinds: readonly StateKind[]; unsaid?: true; why: string }> = {
  'components/account/account-layer.tsx': { kinds: ['empty'], unsaid: true, why: 'kind empty, never said; useArrival says the title on arrival' },
  'components/onboarding/new-phone-screens.tsx': {
    kinds: ['loading', 'error', 'empty'],
    why: 'useArrival says each screen on arrival, each variant its own component; "Opening your book" gaining its line is the block\'s own',
  },
  'components/onboarding/region-refused-screen.tsx': { kinds: ['error'], why: 'useArrival on arrival; the block does not change in place' },
  'app/listen.tsx': { kinds: ['empty'], unsaid: true, why: 'kind empty, never said; its announce() is about playback' },
  'app/read-together.tsx': { kinds: ['empty'], unsaid: true, why: 'kind empty, never said; its announce() is about the page' },
  'app/settings/erase.tsx': { kinds: ['loading'], why: 'a fixed loading line that does not change in place; its announce() is about the erase' },
  'app/letter/[id].tsx': { kinds: ['notFound'], unsaid: true, why: 'kind notFound, never said; its announce() and toasts are about the letter page' },
  'app/settings/recently-deleted.tsx': { kinds: ['empty'], unsaid: true, why: 'kind empty, never said; its toasts are about restoring and erasing' },
};

const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : [];
  });
}

/** Says something with lib/a11y's `announce` (called or handed on) or with AccessibilityInfo directly. */
const saysDirectly = (source: string) =>
  /\bimport\s*\{[^}]*\bannounce\b[^}]*\}\s*from\s*'@\/lib\/a11y'/.test(source) || /\bannounceForAccessibility(?:WithOptions)?\(/.test(source);

/** The functions and hooks a module exports (lower-case names; components are drawn, not called). */
function exportedCalls(source: string): string[] {
  const names = [...source.matchAll(/\bexport\s+(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var)\s+([a-z]\w*)/g)].map((m) => m[1]);
  for (const m of source.matchAll(/\bexport\s*\{([^}]*)\}(?!\s*from)/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop() ?? '';
      if (/^[a-z]\w*$/.test(name)) names.push(name);
    }
  }
  return names;
}

const sources = files(SRC).map((p) => ({ rel: relative(SRC, p).split('\\').join('/'), source: code(readFileSync(p, 'utf8')) }));

/** Every call that speaks for its caller, with the module it comes from: the exports of each module that says something itself. */
const SPEAKING: ReadonlyMap<string, string> = new Map(
  sources
    .filter((f) => f.rel !== ANNOUNCER && f.rel !== BLOCK_FILE && saysDirectly(f.source))
    .flatMap((f) => exportedCalls(f.source).map((name) => [name, f.rel] as [string, string]))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
);
const calls = (source: string, name: string) => new RegExp(`\\b${name}\\(`).test(source);
const speaks = (source: string) => saysDirectly(source) || [...SPEAKING.keys()].some((name) => calls(source, name));

/** The tag passes `callerSpeaks` as true: bare, or `={true}`. */
const passesCallerSpeaks = (tag: string) => /\scallerSpeaks(?=[\s/>]|=\{true\})/.test(tag);
const kindOf = (tag: string) => /\skind="(\w+)"/.exec(tag)?.[1];

const callers = sources
  .filter((f) => f.rel !== BLOCK_FILE)
  .map((f) => ({ ...f, tags: BLOCKS.map((b) => ({ block: b, tags: openingTags(f.source, b) })).filter((t) => t.tags.length > 0) }))
  .filter((f) => f.tags.length > 0);

describe('[PER4-018][BL-1953] every state block beside a caller that speaks is accounted for', () => {
  it('[BL-1953] the scan finds the callers and the speaking hooks (it reads what it should)', () => {
    expect(callers.length).toBeGreaterThanOrEqual(10);
    // The hooks that wrap announce are found from the source, each from its own module.
    expect(SPEAKING.get('useWordsSaid')).toBe('components/capture/use-words-said.ts');
    expect(SPEAKING.get('useArrival')).toBe('lib/first-run/use-arrival.ts');
    expect(SPEAKING.get('useToast')).toBe('components/ui/toast.tsx');
    for (const rel of [...Object.keys(SPEAKS_OWN), ...Object.keys(SPEAKS_BESIDE)]) {
      const f = callers.find((c) => c.rel === rel);
      expect(f, `${rel} no longer draws a state block: take it off the list`).toBeDefined();
      expect(speaks(f!.source), `${rel} no longer speaks: take it off the list`).toBe(true);
    }
  });

  it('[BL-1953] each caller that says its own in-place changes does it through the call its reason names, and passes callerSpeaks', () => {
    for (const [rel, { blocks, through, why }] of Object.entries(SPEAKS_OWN)) {
      const f = callers.find((c) => c.rel === rel)!;
      // The entry stands on the call that says the block's changes, not on some other line the file speaks.
      expect(through === 'announce' || SPEAKING.has(through), `${rel}: ${through} is not a speaking call`).toBe(true);
      const said = through === 'announce' ? saysDirectly(f.source) && calls(f.source, 'announce') : calls(f.source, through);
      expect(said, `${rel} no longer calls ${through} (${why}): re-read the entry`).toBe(true);
      for (const block of blocks) {
        const tags = f.tags.find((t) => t.block === block)?.tags ?? [];
        expect(tags.length, `${rel} draws no ${block}`).toBeGreaterThan(0);
        for (const tag of tags) expect(passesCallerSpeaks(tag), `${rel} <${block}> (${why}) must pass callerSpeaks`).toBe(true);
      }
    }
  });

  it('[BL-1953] each caller that speaks beside its block draws only the kinds its reason holds for', () => {
    // Review B finding 2 on #2216: listen.tsx's block turned to kind="error" beside its announce() stayed green.
    for (const [rel, { kinds, unsaid, why }] of Object.entries(SPEAKS_BESIDE)) {
      if (unsaid) for (const k of kinds) expect(STATE_SPEC[k].live, `${rel}: kind ${k} is said, so "${why}" does not hold`).toBe('none');
      const f = callers.find((c) => c.rel === rel)!;
      for (const { block, tags } of f.tags) {
        for (const tag of tags) {
          const kind = kindOf(tag);
          expect(kind && (kinds as readonly string[]).includes(kind), `${rel} <${block}> kind ${kind ?? 'not a literal'} is not in [${kinds.join(', ')}] (${why}): re-read the entry`).toBe(true);
        }
      }
    }
  });

  it('[BL-1953] a new caller that speaks beside a block passes callerSpeaks, or is listed with its reason', () => {
    const unlisted = callers.filter((f) => speaks(f.source) && !(f.rel in SPEAKS_OWN) && !(f.rel in SPEAKS_BESIDE));
    const missing = unlisted.flatMap((f) =>
      f.tags.flatMap((t) => t.tags.filter((tag) => !passesCallerSpeaks(tag)).map(() => `${f.rel} <${t.block}>`)),
    );
    expect(missing, 'speaks beside a state block (announce, or a hook that wraps it) without callerSpeaks: pass it, or list the file here with why').toEqual([]);
  });

  it('[BL-1953] control: the reader tells a passed flag from a missing or false one', () => {
    expect(passesCallerSpeaks('<InlineState\n  callerSpeaks\n  kind={card.kind}>')).toBe(true);
    expect(passesCallerSpeaks('<StateScreen callerSpeaks={true} kind="error" />')).toBe(true);
    expect(passesCallerSpeaks('<StateScreen callerSpeaks={false} kind="error" />')).toBe(false);
    expect(passesCallerSpeaks('<StateScreen kind="error" onPress={() => a > b} />')).toBe(false);
    expect(openingTags('<StateScreen kind="x" primary={{ onPress: () => go() }} callerSpeaks />', 'StateScreen')[0]).toContain('callerSpeaks');
    expect(openingTags('<StateScreenView kind="x" />', 'StateScreen')).toEqual([]);
    expect(kindOf('<StateScreen kind={failure ? "error" : "empty"} />')).toBeUndefined();
  });

  it('[BL-1953] control: speaking through a hook, or handing announce on, counts as speaking', () => {
    expect(speaks('import { useWordsSaid } from "x";\nfunction W() { useWordsSaid(card); }')).toBe(true);
    expect(speaks("import { announce } from '@/lib/a11y';\nuseSaidOnChange(line, announce);")).toBe(true);
    expect(speaks("import { Platform, AccessibilityInfo } from 'react-native';\nAccessibilityInfo.announceForAccessibility(note);")).toBe(true);
    expect(speaks("function announce() { listeners.forEach((l) => l()); }\nannounce();")).toBe(false);
    expect(speaks("import { useTheme } from '@/lib/a11y';\nuseTheme();")).toBe(false);
  });
});
