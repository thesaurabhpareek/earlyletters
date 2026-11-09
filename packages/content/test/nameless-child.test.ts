/**
 * NX-31-R3: the first book's name may stay empty, and the app then says "your child" (en.onboarding.childFallback) wherever
 * {child} stands. This renders every {child} string in the package with that fallback and fails on the ones that read
 * wrongly. A string that opens with {child} ("{child}'s book") is capitalised by fill() in apps/mobile/src/lib/copy.ts
 * (pinned by apps/mobile/test/first-run-child-name.test.ts), so this test capitalises the opening the same way.
 * Prompts that are retired are no longer offered, so they are not checked.
 */
import { describe, expect, it } from 'vitest';
import * as everything from '../src';
import { en, PROMPTS } from '../src';
import { leaves } from './support/copy-surfaces';

const FALLBACK = en.onboarding.childFallback;

type Row = { path: string; rendered: string };

/** Every {child} string in every export, deduplicated by text (features.* repeats the named exports). */
function rows(): Row[] {
  const seen = new Set<string>();
  const out: Row[] = [];
  const add = (path: string, text: string) => {
    if (!text.includes('{child}') || seen.has(text)) return;
    seen.add(text);
    let r = text.replaceAll('{child}', FALLBACK);
    if (r.startsWith(FALLBACK)) r = r.charAt(0).toUpperCase() + r.slice(1);
    out.push({ path, rendered: r });
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
    const failures = all.flatMap((r) => problems(r.rendered).map((why) => `${r.path}: ${why} => ${r.rendered}`));
    expect(failures).toEqual([]);
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
