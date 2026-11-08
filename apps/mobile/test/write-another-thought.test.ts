/// <reference types="node" />
/**
 * "Another thought" on Write (engagement.md section 3, Option A; BL-E1; daily-home.md section 8). The draw is pure
 * and runs here against the real hand-written library; Node cannot load React Native, so the screen's use of it is
 * pinned in its source. Fixtures: the fictional family Asha only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { selectPrompt } from '@scribe/core';
import { PROMPTS } from '@scribe/content';
import { anotherThought, anotherThoughtShown, tonightPromptInput } from '../src/components/tonight/prompt.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const write = code(src('app/write.tsx'));

const TODAY = '2026-11-08';
const ASHA_BORN = '2026-03-20'; // about 7 months
const base: { birthday: string | null; today: string; daysSinceLastEntry: number | null; recentKeys: string[] } = { birthday: ASHA_BORN, today: TODAY, daysSinceLastEntry: 1, recentKeys: [] };
const keys = new Set(PROMPTS.map((p) => p.key));

/** Presses "Another thought" n times from the prompt Tonight passed in, as Write does. */
function press(n: number, start: string, a: Partial<typeof base> = {}) {
  let shown = [start];
  const seen: string[] = [start];
  for (let i = 1; i <= n; i++) {
    const r = anotherThought({ ...base, ...a, shown, press: i }, PROMPTS);
    shown = r.shown;
    seen.push(r.prompt.key);
  }
  return seen;
}

const tonightFirst = (a: Partial<typeof base> = {}) =>
  selectPrompt(tonightPromptInput({ ...base, ...a, shuffle: 0, leftKey: null }), PROMPTS).key;

describe('[BL-E1] the swap', () => {
  it('a press shows a different prompt from the hand-written library', () => {
    const start = tonightFirst();
    const [, next] = press(1, start);
    expect(next).not.toBe(start);
    expect(keys.has(next)).toBe(true);
  });

  it('never the same one twice in a row, over 20 presses', () => {
    const seen = press(20, tonightFirst());
    for (let i = 1; i < seen.length; i++) expect(seen[i], `press ${i}`).not.toBe(seen[i - 1]);
  });

  it('nothing shown in this sheet comes back until every one that fits has been shown, then it quietly starts over', () => {
    const start = tonightFirst();
    const seen = press(60, start);
    const firstRepeat = seen.findIndex((k, i) => seen.indexOf(k) !== i);
    expect(firstRepeat).toBeGreaterThan(2);
    // Up to the first repeat, every press was new.
    expect(new Set(seen.slice(0, firstRepeat)).size).toBe(firstRepeat);
    // And it never stops offering one (no "no more").
    expect(seen).toHaveLength(61);
  });

  it('is deterministic for the same day, child and presses', () => {
    expect(press(5, tonightFirst())).toEqual(press(5, tonightFirst()));
  });

  it('fits the child as Tonight does: a book before the birth stays with the before set, a born child never gets it', () => {
    const before = press(15, tonightFirst({ birthday: null }), { birthday: null });
    for (const k of before.slice(1)) expect(PROMPTS.find((p) => p.key === k)!.band, k).toBe('before');
    const born = press(15, tonightFirst());
    for (const k of born.slice(1)) expect(PROMPTS.find((p) => p.key === k)!.band, k).not.toBe('before');
  });

  it('Tonight draws exactly as before: no shown keys and no tag means the same input it always had', () => {
    const input = tonightPromptInput({ ...base, shuffle: 2, leftKey: 'x' });
    expect(input.seed).toBe(`${TODAY}:2`);
    expect(input.excludeKeys).toEqual(['x']);
    expect(tonightPromptInput({ ...base, shuffle: 0, leftKey: null }).excludeKeys).toEqual([]);
  });

  it('every prompt it can show is a curated, live library line (never written for one person)', () => {
    const live = new Set(PROMPTS.filter((p) => !p.retired).map((p) => p.key));
    for (const k of press(40, tonightFirst()).slice(1)) expect(live.has(k), k).toBe(true);
  });
});

describe('[BL-E1] when it shows', () => {
  it('only for a new letter that opened with a prompt, and only while the page is empty', () => {
    expect(anotherThoughtShown({ hasPrompt: true, continuingDraft: false, empty: true })).toBe(true);
    expect(anotherThoughtShown({ hasPrompt: true, continuingDraft: false, empty: false })).toBe(false);
    expect(anotherThoughtShown({ hasPrompt: false, continuingDraft: false, empty: true })).toBe(false);
    expect(anotherThoughtShown({ hasPrompt: true, continuingDraft: true, empty: true })).toBe(false);
  });
});

describe('[BL-E1] Write uses it as the spec says', () => {
  const swap = write.slice(write.indexOf('const swapPrompt = () =>'), write.indexOf('const keep = (inBook: boolean)'));

  it('the quiet Tonight control under the prompt: same label, icon and 44 pt size', () => {
    expect(write).toMatch(/<Button variant="quiet" size="sm" icon=\{ArrowsClockwiseIcon\} label=\{copy\.tonight\.newPromptButton\}[^>]*onPress=\{swapPrompt\}/);
    expect(write.indexOf('testID="write.prompt"')).toBeLessThan(write.indexOf('testID="write.anotherThought"'));
    expect(write.indexOf('testID="write.anotherThought"')).toBeLessThan(write.indexOf('<TextField'));
  });

  it('a press: the tap haptic, the new line said once, and focus left where it is', () => {
    expect(swap).toMatch(/haptic\('tap'\)/);
    expect(swap.match(/announce\(/g)).toHaveLength(1);
    expect(swap).not.toMatch(/\.focus\(|setAccessibilityFocus/);
  });

  it('reads the letters history on the first press only, never when Write opens', () => {
    expect(swap).toMatch(/if \(!history\.current\) \{\s*const entries = listEntriesForChild\(child\.id\)/);
    expect(write.match(/listEntriesForChild\(/g)).toHaveLength(1);
  });

  it('the letter keeps the question showing when its words are first saved', () => {
    expect(write).toMatch(/const \[promptKey, setPromptKey\] = useState<string \| null>\(params\.promptKey \?\? existing\?\.promptKey \?\? null\)/);
    expect(write).toMatch(/createDraft\(\{ childId: child\.id, captureMode: 'typed', promptKey,/);
    // Emptied back to nothing and swapped: the empty typed draft goes, so the next words keep the new question.
    expect(swap).toMatch(/if \(!existing && draftId\.current && !session\.latest\(\)\.trim\(\)\) \{\s*try \{\s*deleteDraft\(draftId\.current\);\s*draftId\.current = null;/);
  });

  it('steps aside at the first character and comes back when the page is empty, hidden but not moved', () => {
    expect(write).toMatch(/anotherThoughtShown\(\{ hasPrompt: !!prompt, continuingDraft: !!existing, empty: !text\.trim\(\) \}\)/);
    expect(write).toMatch(/style=\{anotherStyle\} pointerEvents=\{offerAnother \? 'auto' : 'none'\} accessibilityElementsHidden=\{!offerAnother\}/);
    // Always rendered for a new letter with a prompt: its space stays.
    expect(write).toMatch(/\{prompt && !existing \? \(/);
  });

  it('motion: old line out over exitMs, new in over fadeMs, the field slides; Reduce Motion swaps at once', () => {
    expect(write).toMatch(/const promptOut = motion\.reduced \? undefined : FadeOut\.duration\(tokens\.motion\.exitMs\)/);
    expect(write).toMatch(/const promptIn = motion\.reduced \? undefined : FadeIn\.duration\(tokens\.motion\.fadeMs\)\.delay\(Math\.round\(tokens\.motion\.exitMs \/ 2\)\)/);
    expect(write).toMatch(/const promptLayout = motion\.reduced \? undefined : LinearTransition/);
    expect(write).toMatch(/<Animated\.View key=\{prompt\.key\} entering=\{presses\.current === 0 \? undefined : promptIn\} exiting=\{promptOut\} layout=\{promptLayout\}>/);
  });

  it('no counter, no limit, nothing recorded', () => {
    expect(swap).not.toMatch(/track\w*\(|console\.|analytics/);
    expect(write).not.toMatch(/no more|presses\.current\s*[<>]=?\s*\d/);
  });
});
