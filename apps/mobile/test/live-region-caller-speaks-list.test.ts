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
 * AccessibilityInfo.announceForAccessibility, or when it calls a function or hook exported by a module that speaks
 * (useWordsSaid, useArrival, useToast and the rest, found by the scan). That is built to a fixpoint (review B finding 1
 * on 0c5e013c2): a module that speaks only through such a call speaks too, so its exports are speaking calls, and so on
 * until no new name is found; a wrapper hook around useToast or useArrival is a speaker however many hops deep.
 * NOT_SPEAKING lists the exports of speaking modules that are read and found to say nothing for their caller
 * (useColors and the like), so a call to one alone is not speaking. lib/a11y.ts itself and state-screen.tsx (the
 * block, whose own line `callerSpeaks` turns off) are not speaking modules. Source is read with comments stripped.
 * Known gaps, which no unlisted caller has today: a namespace import (`import * as a11y`, then `a11y.announce(...)`) and
 * an aliased import (`useWordsSaid as useSaid`) are not seen (the tree has neither), and a speaking component drawn as
 * JSX is not counted, since only lower-case calls are read. Two files draw one beside a block today (app/settings/erase.tsx
 * draws ErrorLine, components/onboarding/new-phone-screens.tsx draws RevocationWaitLine), and both are already under
 * SPEAKS_BESIDE for their other speech.
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

type Source = { rel: string; source: string };
const sources: Source[] = files(SRC).map((p) => ({ rel: relative(SRC, p).split('\\').join('/'), source: code(readFileSync(p, 'utf8')) }));

/**
 * The exports of speaking modules that say nothing for their caller, as read in the source: a call to one alone does
 * not make a file speak, and a module that calls only these does not speak either. A hand list: a name here that
 * later starts to speak is not caught, so re-read its entry when its module changes.
 */
const NOT_SPEAKING: Record<string, { from: string; why: string }> = {
  useColors: { from: 'lib/auth/ui.tsx', why: 'returns the theme colours' },
  useCloseSheet: { from: 'lib/auth/ui.tsx', why: 'returns the handler that closes the sign-in sheet' },
  escapeHandler: { from: 'lib/auth/ui.tsx', why: "picks the sheet's Close handler" },
  useSchemeSafely: { from: 'components/resilience/plain-screen.tsx', why: 'reads the colour scheme' },
  usePhoneAbility: { from: 'components/settings/help-fallback.tsx', why: 'probes whether the phone can place a call' },
  useHelpLink: { from: 'components/settings/help-fallback.tsx', why: 'opens a help link; the fallback sheet it hands back says only its own "copied" line' },
};

const calls = (source: string, name: string) => new RegExp(`\\b${name}\\(`).test(source);

/**
 * Every call that speaks for its caller, with the module it comes from, built to a fixpoint: a module speaks when it
 * says something directly or calls a name already found, and then each of its exports (bar NOT_SPEAKING) is found;
 * repeated until a pass finds no new speaking module.
 */
function speakingCalls(all: readonly Source[], notSpeaking: ReadonlySet<string> = new Set(Object.keys(NOT_SPEAKING))): Map<string, string> {
  const found = new Map<string, string>();
  const speaking = new Set<string>();
  for (let grew = true; grew; ) {
    grew = false;
    for (const f of all) {
      if (f.rel === ANNOUNCER || f.rel === BLOCK_FILE || speaking.has(f.rel)) continue;
      if (!saysDirectly(f.source) && ![...found.keys()].some((name) => calls(f.source, name))) continue;
      speaking.add(f.rel);
      grew = true;
      for (const name of exportedCalls(f.source)) if (!notSpeaking.has(name) && !found.has(name)) found.set(name, f.rel);
    }
  }
  return new Map([...found].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/** What makes a source speak under `speaking`: `announce` (or AccessibilityInfo) and the speaking calls it makes. */
const speechOf = (source: string, speaking: ReadonlyMap<string, string>) => [
  ...(saysDirectly(source) ? ['announce'] : []),
  ...[...speaking].filter(([name]) => calls(source, name)).map(([name, from]) => `${name} from ${from}`),
];
const speaksWith = (source: string, speaking: ReadonlyMap<string, string>) => speechOf(source, speaking).length > 0;

const SPEAKING: ReadonlyMap<string, string> = speakingCalls(sources);
const speaks = (source: string) => speaksWith(source, SPEAKING);

/** The tag passes `callerSpeaks` as true: bare, or `={true}`. */
const passesCallerSpeaks = (tag: string) => /\scallerSpeaks(?=[\s/>]|=\{true\})/.test(tag);
const kindOf = (tag: string) => /\skind="(\w+)"/.exec(tag)?.[1];

/** The files that draw a state block, with each block's opening tags. */
const blockCallers = (all: readonly Source[]) =>
  all
    .filter((f) => f.rel !== BLOCK_FILE)
    .map((f) => ({ ...f, tags: BLOCKS.map((b) => ({ block: b, tags: openingTags(f.source, b) })).filter((t) => t.tags.length > 0) }))
    .filter((f) => f.tags.length > 0);
const callers = blockCallers(sources);

/** Each unflagged block in a file that speaks and is on neither list, with what the scan read as its speech. */
function unflaggedBesideSpeech(all: readonly Source[]): string[] {
  const speaking = speakingCalls(all);
  return blockCallers(all)
    .filter((f) => speaksWith(f.source, speaking) && !(f.rel in SPEAKS_OWN) && !(f.rel in SPEAKS_BESIDE))
    .flatMap((f) =>
      f.tags.flatMap((t) => t.tags.filter((tag) => !passesCallerSpeaks(tag)).map(() => `${f.rel} <${t.block}> speaks through ${speechOf(f.source, speaking).join(', ')}`)),
    );
}

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
      expect(speaks(f!.source), `${rel} no longer speaks by the scan: take it off the list only if it says nothing; if it speaks through a call the scan cannot see (the header's gaps), fix the scan`).toBe(true);
    }
    // NOT_SPEAKING stays true to the tree: each name is still an export of a module that otherwise counts as speaking.
    const unnarrowed = speakingCalls(sources, new Set());
    for (const [name, { from }] of Object.entries(NOT_SPEAKING)) {
      const actual = unnarrowed.get(name);
      const advice =
        actual === undefined
          ? `NOT_SPEAKING ${name} is no longer an export of any speaking module (listed from ${from}): take it off`
          : `NOT_SPEAKING ${name} is exported by the speaking ${actual}, not ${from}: read it in ${actual} and correct its from (or take it off if it speaks there)`;
      expect(actual, advice).toBe(from);
      expect(SPEAKING.has(name), `${name} is in NOT_SPEAKING`).toBe(false);
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
    expect(
      unflaggedBesideSpeech(sources),
      'speaks beside a state block without callerSpeaks. First check that the named call says something for this file: if it says nothing, add it to NOT_SPEAKING with why; ' +
        "if it says the block's own in-place changes, pass callerSpeaks; if it says something else, list the file under SPEAKS_BESIDE with why",
    ).toEqual([]);
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

  it('[BL-1953] control: a hook that wraps a speaking hook speaks, however many hops deep', () => {
    const world: Source[] = [
      { rel: 'lib/zz/speaker.ts', source: "import { announce } from '@/lib/a11y';\nexport function useSpeak(line: string) { announce(line); }" },
      { rel: 'lib/zz/wrap.ts', source: "import { useSpeak } from './speaker';\nexport const useWrap = (line: string) => useSpeak(line);" },
      { rel: 'lib/zz/wrap-twice.ts', source: "import { useWrap } from './wrap';\nexport function useWrapTwice() { useWrap('saved'); }" },
      { rel: 'lib/zz/quiet.ts', source: "import { announce } from '@/lib/a11y';\nexport const useColors = () => ({});\nexport function useLoud() { announce('x'); }" },
      { rel: 'lib/zz/ink.ts', source: "import { useColors } from './quiet';\nexport const useInk = () => useColors();" },
    ];
    // Given out of dependency order (each wrapper before the module it calls), so a single pass cannot find the chain
    // and the fixpoint has to repeat (review A finding 1 and review B finding 1 on 273f4a30b).
    const speaking = speakingCalls([...world].reverse());
    expect(speaking.get('useSpeak')).toBe('lib/zz/speaker.ts');
    expect(speaking.get('useWrap')).toBe('lib/zz/wrap.ts');
    expect(speaking.get('useWrapTwice')).toBe('lib/zz/wrap-twice.ts');
    expect(speaksWith('function S() { useWrapTwice(); }', speaking)).toBe(true);
    // A NOT_SPEAKING name neither speaks nor carries speech to a module that only calls it.
    expect(speaking.has('useColors')).toBe(false);
    expect(speaking.has('useInk')).toBe(false);
    expect(speaksWith('function S() { useInk(); }', speaking)).toBe(false);
    expect(speakingCalls([...world].reverse(), new Set()).get('useInk')).toBe('lib/zz/ink.ts');
  });

  it('[BL-1953] control: a new screen that speaks through a wrapper around useToast, beside a bare block, is caught (review B M1 on #2216)', () => {
    const say: Source = { rel: 'lib/zz-say.ts', source: "import { useToast } from '@/components/ui/toast';\nexport function useSaySaved() { return useToast(); }" };
    const screen = (flag: string): Source => ({
      rel: 'app/zz-saved.tsx',
      source: `import { useSaySaved } from '@/lib/zz-say';\nexport default function Saved() {\n  const say = useSaySaved();\n  say.show('Saved');\n  return <InlineState${flag} kind="error" title="x" />;\n}`,
    });
    const tree = unflaggedBesideSpeech(sources); // empty while the tree is green; kept so this control fails only on its own case
    expect(unflaggedBesideSpeech([...sources, say, screen('')])).toEqual([...tree, 'app/zz-saved.tsx <InlineState> speaks through useSaySaved from lib/zz-say.ts']);
    expect(unflaggedBesideSpeech([...sources, say, screen(' callerSpeaks')])).toEqual(tree);
    // The same screen with only a call that says nothing is not told to pass callerSpeaks.
    const quiet: Source = { rel: 'app/zz-quiet.tsx', source: "import { useColors } from '@/lib/auth/ui';\nexport default function Q() {\n  useColors();\n  return <StateScreen kind=\"empty\" title=\"x\" />;\n}" };
    expect(unflaggedBesideSpeech([...sources, quiet])).toEqual(tree);
  });

  it('[BL-1953] control: a listed caller that moves its speaking call into a one-line wrapper still speaks (review B M2 on #2216)', () => {
    // outage-screen.tsx as it would read with its useArrival(block, title, variant) moved into a sibling wrapper hook.
    const rel = 'components/onboarding/outage-screen.tsx';
    const moved: Source = {
      rel,
      source: "import { useOutageArrival } from './outage-arrival';\nexport function OutageScreen() {\n  useOutageArrival(block, title, variant);\n  return <StateScreen callerSpeaks kind=\"error\" title={title} />;\n}",
    };
    const wrapper: Source = {
      rel: 'components/onboarding/outage-arrival.ts',
      source: "import { useArrival } from '@/lib/first-run/use-arrival';\nexport const useOutageArrival = (block: unknown, title: string, variant: unknown) => useArrival(block as never, title, variant);",
    };
    // The wrapper sits where files() reads it, just before outage-screen.tsx and so before lib/first-run/use-arrival.ts:
    // it is found only on a second pass, as it would be on disk.
    const world = sources.flatMap((f) => (f.rel === rel ? [wrapper, moved] : [f]));
    const at = (r: string) => world.findIndex((f) => f.rel === r);
    expect(at(wrapper.rel)).toBeGreaterThanOrEqual(0);
    expect(at(wrapper.rel)).toBeLessThan(at('lib/first-run/use-arrival.ts'));
    const speaking = speakingCalls(world);
    // What the list tests read for an entry naming `through: 'useOutageArrival'`: a speaking call, called, and the file speaks.
    expect(speaking.get('useOutageArrival')).toBe('components/onboarding/outage-arrival.ts');
    expect(calls(moved.source, 'useOutageArrival')).toBe(true);
    expect(speaksWith(moved.source, speaking)).toBe(true);
    expect(unflaggedBesideSpeech(world)).toEqual(unflaggedBesideSpeech(sources));
  });
});
