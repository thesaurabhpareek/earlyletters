/**
 * NX-31-R3: the first book's name may stay empty, and the app then says "your child" (en.onboarding.childFallback) wherever
 * {child} stands. This renders every {child} string in the package through the app's own fill() (apps/mobile/src/lib/copy.ts)
 * with a blank name and fails on the ones that read wrongly. The test does not capitalise or substitute anything itself: a
 * string that opens with {child} ("{child}'s book") reads "Your child's book" only if fill() capitalises it (NX-36 S14, S16;
 * pinned also by apps/mobile/test/first-run-child-name.test.ts), so taking that capital out of fill() fails this test too.
 * Prompts that are retired are no longer offered, so they are not checked.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import * as everything from '../src';
import { PROMPTS } from '../src';
import { leaves } from './support/copy-surfaces';

type Fill = (text: string, values?: Record<string, string | number>) => string;
type Row = { path: string; rendered: string };

// The app's fill(), loaded the way claims-capabilities.test.ts loads app code: content does not depend on the app.
let fill: Fill;
beforeAll(async () => {
  ({ fill } = await import('../../../apps/mobile/src/lib/copy'));
});

const APP_SRC = fileURLToPath(new URL('../../../apps/mobile/src/', import.meta.url));

/** True when any file under apps/mobile/src mentions `needle`, that is, when a screen could show the key. */
function appMentions(needle: string): boolean {
  const files = readdirSync(APP_SRC, { recursive: true, encoding: 'utf8' }).filter((f) => /\.tsx?$/.test(f));
  return files.some((f) => readFileSync(APP_SRC + f, 'utf8').includes(needle));
}

/**
 * Words that are written but that no screen shows yet, and that read wrongly with a blank name. They are left as they
 * were: changing words nothing shows costs a word approval for no one's benefit. Each is skipped only while nothing in
 * apps/mobile/src mentions its key; the day a screen does, the skip ends, this test fails, and the sentence is fixed first.
 */
const NOT_SHOWN_YET: Record<string, { needle: string; why: string }> = {
  'en.onboarding.nameCheck.title': { needle: 'nameCheck', why: 'the name check card (F07) is not built' },
  'en.settings.plan.familySharingHelp': { needle: 'familySharingHelp', why: 'the Plus screen reads billingCopy.plan, not en.settings.plan' },
};

/** The rows that are skipped: those in NOT_SHOWN_YET whose key no screen mentions. */
function skipped(): Set<string> {
  return new Set(Object.entries(NOT_SHOWN_YET).filter(([, v]) => !appMentions(v.needle)).map(([path]) => path));
}

/** Every {child} string in every export, deduplicated by text (features.* repeats the named exports). */
function rows(): Row[] {
  const seen = new Set<string>();
  const out: Row[] = [];
  const add = (path: string, text: string) => {
    if (!text.includes('{child}') || seen.has(text)) return;
    seen.add(text);
    out.push({ path, rendered: fill(text, { child: '' }) });
  };
  for (const [name, value] of Object.entries(everything)) {
    if (typeof value === 'function' || name === 'PROMPTS') continue;
    for (const l of leaves(value)) add(`${name}.${l.path}`, l.text);
  }
  for (const p of PROMPTS) if (!p.retired) add(`PROMPTS.${p.key}`, p.text);
  return out;
}

function problems(s: string): string[] {
  const found: string[] = [];
  const bad = (re: RegExp, why: string) => re.test(s) && found.push(why);
  bad(/Dear your child/i, 'Dear your child');
  bad(/Happy birthday,? your child/i, 'Happy birthday, your child');
  bad(/your child's name/i, "your child's name");
  bad(/(^|[.?!:] )your child\b/, 'lowercase "your child" opens a sentence');
  bad(/\b(the|a|an) your child\b/i, '"the your child"');
  bad(/\bname your child\b/i, '"name your child"');
  bad(/your child.*\byour child\b.*\byour child\b/i, 'three of "your child" in one string');
  // Spoken to: "your child," opening a string, a greeting before it, or ", your child" closing a sentence.
  // Naming the child as the object of a sentence ("Letters to your child, Year 1") is fine.
  bad(/^your child,/i, '"your child," as a vocative');
  bad(/\b(Dear|Hi|Hello|Hey|Welcome|Goodnight|Good night|Sleep well|Thank you)\b[^.?!]*\byour child\b/i, 'a greeting to "your child"');
  bad(/, your child[.!?]?$/i, '", your child" as a vocative');
  return found;
}

describe('[NX-31-R3] a blank child name', () => {
  it('[NX-31-R3] no string reads wrongly when the child\'s name is blank', () => {
    const all = rows();
    expect(all.length).toBeGreaterThan(100); // the scan found the strings
    const skip = skipped();
    const failures = all.filter((r) => !skip.has(r.path)).flatMap((r) => problems(r.rendered).map((why) => `${r.path}: ${why} => ${r.rendered}`));
    expect(failures).toEqual([]);
  });

  it('[NX-31-R3] the words nothing shows yet are the only ones skipped, and they still read wrongly (so the skip is needed)', () => {
    const byPath = new Map(rows().map((r) => [r.path, r.rendered]));
    for (const [path, { needle, why }] of Object.entries(NOT_SHOWN_YET)) {
      expect(byPath.has(path), `${path} is no longer a {child} string: remove it from NOT_SHOWN_YET`).toBe(true);
      expect(problems(byPath.get(path)!), `${path} now reads well: remove it from NOT_SHOWN_YET`).not.toEqual([]);
      expect(appMentions(needle), `${path} is now read by a screen (${why} no longer holds): fix its sentence`).toBe(false);
    }
  });

  it('[NX-31-R3] the strings that open with {child} reach the screen with a capital, from the app\'s fill()', () => {
    const all = rows();
    const rendered = all.map((r) => r.rendered);
    expect(rendered).toContain("Your child's book"); // en.book.title, the Book tab (NX-36 S14)
    expect(rendered).toContain("Your child's book will be deleted."); // Delete account (NX-36 S16)
    const opening = all.filter((r) => /^your child\b/i.test(r.rendered));
    expect(opening.length).toBeGreaterThan(10);
    for (const r of opening) expect(r.rendered.charAt(0), `${r.path}: ${r.rendered}`).toBe('Y');
  });

  it('[NX-31-R3] the checks catch the known bad readings', () => {
    expect(problems('Dear your child,')).not.toEqual([]);
    expect(problems('Happy birthday, your child')).not.toEqual([]);
    expect(problems("Say your child's name three times")).not.toEqual([]);
    expect(problems('Hello, your child')).not.toEqual([]);
    expect(problems('Letters to your child, Year 1')).toEqual([]);
    expect(problems("Your child's book")).toEqual([]);
    expect(problems('Talk for a minute. your child will hear it')).not.toEqual([]);
  });
});
