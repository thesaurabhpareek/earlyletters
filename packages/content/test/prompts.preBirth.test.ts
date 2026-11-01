/**
 * The pre-birth prompts and how Tonight uses the library (P3 critics' pass of 28 Oct 2026, S2 and S4).
 *
 * S2: a book whose child is not born yet (a due date, no birthday) is offered the `before` prompts (eight today) and
 * nothing else: not the 0 to 3 month prompts about hands and the first day home, and not the any-age openings, which assume a
 * child who is here. A born child is never offered a `before` prompt.
 * S4: a press of "Another thought" never shows the prompt that was on screen.
 *
 * The rules are run here over the real library; the same rules over small fictional ones are in
 * packages/core/test/prompts.selection.test.ts. Fixtures use the fictional family Asha only.
 */
import { selectPrompt, type Prompt, type SelectInput } from '@scribe/core';
import { describe, expect, it } from 'vitest';
import { PROMPTS } from '../src';

const BEFORE = PROMPTS.filter((p) => p.band === 'before');
const base: SelectInput = { ageMonths: 5, daysSinceLastEntry: 1, hardStretch: false, role: 'parent', together: false, recentKeys: [], seed: '2026-10-28' };
const render = (p: Prompt) => p.text.replace(/\{child\}/g, 'Asha');

/**
 * A statement would put words in the person's mouth ("Tell {child} how excited you are."). A question leaves the answer
 * to them, and "Tell {child}." only points at who the letter is for. True when any sentence is neither.
 */
function fillsInWhatToSay(text: string): boolean {
  const sentences = text.match(/[^.?!]*[.?!]+/g) ?? [];
  if (sentences.join('') !== text) return true; // text that does not end in a sentence mark
  return sentences.some((raw) => {
    const s = raw.trim();
    return !(/^[^?]+\?$/.test(s) || s === 'Tell {child}.');
  });
}

/**
 * What a prompt before a birth must not assume. F13-REQ-008 bans due, weeks left, countdown, labour and delivery; these
 * add the other presumptions: a pregnancy (adoption, surrogacy, a wait after a loss), a partner, a clinic, a bump, a
 * nursery, a home being changed, a plan, a count.
 */
const PRESUMES =
  /\b(pregnan\w*|expect(?:ing|ant|ed)?|partner|husband|wife|spouse|mother|father|mum|mom|dad|mama|papa|parents?|doctors?|hospital|midwi\w*|clinic|nurses?|bump|kick\w*|scans?|ultrasound|trimester|labou?r|deliver\w*|due|countdown|left|to go|baby|babies|nursery|crib|cot|shower|registry|chang\w*|make room|prepar\w*|set up|how many|how much|how long)\b/i;

/** Presumes that people already address the child (an adoption, a surrogacy, a family that does not, a wait after a loss). */
const ADDRESSES = /\b(?:talks?|talking|speaks?|speaking|sings?|singing|reads?|reading|plays?|playing)\s+(?:to|with)\s+\{child\}/i;
const presumesAnything = (text: string): boolean => PRESUMES.test(text) || ADDRESSES.test(text) || weekOutsideThese(text);

/** "week" and "weeks" only in the one form that names no count: "these weeks". */
const weekOutsideThese = (text: string): boolean => /\bweeks?\b/i.test(text.replace(/\bthese weeks\b/gi, ''));

describe('[S2] the pre-birth set: openings that assume no birth', () => {
  it('is at least eight openings in the before band, with stable keys of their own', () => {
    // A floor, not a cap: the set may grow, and the next content addition must not be blocked by this test.
    expect(BEFORE.length).toBeGreaterThanOrEqual(8);
    for (const p of BEFORE) {
      expect(p.kind, p.key).toBe('opening');
      expect(p.key, p.key).toMatch(/^opening\.before\.[a-z-]+$/);
      expect(p.retired, p.key).toBeUndefined();
    }
    expect(new Set(BEFORE.map((p) => p.key)).size).toBe(BEFORE.length);
  });

  it('every one is a question or an invitation addressed to the person, in the app\'s own voice', () => {
    for (const p of BEFORE) {
      expect(p.text, p.key).toMatch(/[?.]$/);
      expect(p.text.length, p.key).toBeLessThanOrEqual(100);
      // no placeholder but the child's name; no gendered word for the child (also in rules.test.ts)
      expect([...p.text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((k) => k !== 'child'), p.key).toEqual([]);
    }
  });

  it('assume no birth: nothing about hands, feeds, sleep, visitors, the first day home or the birth itself', () => {
    const bornOnly = /\b(born|birth|newborn|arriv\w*|meets?|met|hands?|fingers?|toes?|cry\w*|feed\w*|nurs\w*|diapers?|baths?|smil\w*|laugh\w*|first day|came home|home from|visitors?|lullab\w*|asleep|sleep\w*|crib|cot|holds?|held|hugs?)\b/i;
    for (const p of BEFORE) expect(p.text, p.key).not.toMatch(bornOnly);
  });

  it('name no hour of the day, so none is out of place under a morning greeting', () => {
    for (const p of BEFORE) expect(p.text, p.key).not.toMatch(/\b(tonight|right now|morning|night|nights|bedtime|evening|midnight|afternoon|dawn|dusk)\b/i);
  });

  it('count nothing and press on nothing: no number, no weeks to go, no due date, no "soon"', () => {
    for (const p of BEFORE) {
      expect(p.text, p.key).not.toMatch(/\d/);
      expect(p.text, p.key).not.toMatch(/\b(due|soon|almost|any day|countdown|left|to go|until|before long|nearly|ready|prepared|late|early)\b/i);
    }
  });

  it('say nothing about what the person should feel, and use no fear, guilt or loss language', () => {
    const feeling = /\b(excit\w*|nervous|scared|afraid|worr\w*|anxious|thrill\w*|joy\w*|can'?t wait|looking forward|dream\w*|feel\w*|feeling|happy|proud|overwhelm\w*|grateful|blessed|should|must|need to|have to|ought)\b/i;
    const loss = /\b(lose|lost|loss|miss\w*|fear\w*|danger|risk|gone|goodbye|ending|never|wasted|regret\w*|too late|behind)\b/i;
    for (const p of BEFORE) {
      expect(p.text, p.key).not.toMatch(feeling);
      expect(p.text, p.key).not.toMatch(loss);
    }
  });

  it('never fill in what to say: every sentence is a question, or exactly "Tell {child}."', () => {
    for (const p of BEFORE) expect(fillsInWhatToSay(p.text), p.key).toBe(false);
  });

  it('presume nothing about who is expecting, how, or what the home, the body or the people around are doing', () => {
    for (const p of BEFORE) {
      expect(p.text, p.key).not.toMatch(PRESUMES);
      expect(p.text, p.key).not.toMatch(ADDRESSES);
      expect(weekOutsideThese(p.text), p.key).toBe(false);
      expect(presumesAnything(p.text), p.key).toBe(false);
    }
  });

  it('the checks above catch the likely slips, so a pass means something', () => {
    for (const slip of [
      'What is changing in your home to make room for {child}?',
      'How many weeks are left?',
      'Weeks to go, and how do you feel?',
      'What did the doctor say at the scan?',
      'How is the pregnancy going?',
      'What did {child} kick today?',
      'Tell {child} about the hospital bag.',
      'How is your partner?',
      'Where is the nursery?',
      'When is {child} due?',
      'What is the countdown like?',
      'Tell {child} about the labour.',
      'Who talks to {child} these days? What do they say?',
      'What do you sing to {child}?',
      'Who has been reading to {child}?',
    ]) {
      expect(presumesAnything(slip), slip).toBe(true);
    }
    for (const statement of ['Tell {child} how excited you are.', 'Say hello to {child}.', 'You are ready for {child}.', 'Tell {child}. Then say why.', 'What is one thing you hope for?!']) {
      expect(fillsInWhatToSay(statement), statement).toBe(true);
    }
    for (const fine of ['Where are you today, and what is around you? Tell {child}.', 'What does your home sound like these days?']) {
      expect(fillsInWhatToSay(fine), fine).toBe(false);
      expect(presumesAnything(fine), fine).toBe(false);
    }
  });

  it('read well with the fictional name filled in, and never imply that anyone but the person writes', () => {
    for (const p of BEFORE) {
      expect(render(p), p.key).not.toMatch(/[{}]/);
      expect(p.text, p.key).not.toMatch(/\b(we|our|ai|assistant|generate\w*|suggest\w*|write\w* for)\b/i);
    }
  });

  it('cover the weeks now, the name, what is hoped for and the house', () => {
    const text = BEFORE.map((p) => p.text).join(' ');
    expect(text).toMatch(/these weeks/);
    expect(text).toMatch(/\bname\b/);
    expect(text).toMatch(/\bhope\b/);
    expect(text).toMatch(/\bhome\b/);
  });
});

describe('[S2] Tonight\'s selection over the real library', () => {
  const preBirth: SelectInput = { ...base, ageMonths: 0, beforeBirth: true };

  it('a book before the birth sees only the before set, every night of a year, in every kind of night', () => {
    const kinds: Partial<SelectInput>[] = [{}, { daysSinceLastEntry: null }, { daysSinceLastEntry: 9 }, { hardStretch: true }, { together: true }, { role: 'contributor', daysSinceLastEntry: 9 }];
    const used = new Set<string>();
    for (const k of kinds) {
      for (let d = 0; d < 365; d++) {
        const p = selectPrompt({ ...preBirth, ...k, seed: `2026-${d}` }, PROMPTS);
        expect(p.band, `${JSON.stringify(k)} ${p.key}`).toBe('before');
        used.add(p.key);
      }
    }
    expect([...used].sort()).toEqual(BEFORE.map((p) => p.key).sort());
  });

  it('none of the newborn prompts the review found ("Describe Asha\'s hands", "the first day home") and no any-age opening', () => {
    const seen = new Set<string>();
    for (let d = 0; d < 365; d++) {
      for (const daysSinceLastEntry of [null, 9]) seen.add(selectPrompt({ ...preBirth, daysSinceLastEntry, seed: `s${d}` }, PROMPTS).key);
    }
    for (const key of seen) {
      expect(key).not.toMatch(/^opening\.0-3\./);
      expect(key).not.toMatch(/^opening\.any\./);
      expect(key).not.toMatch(/^gap\./);
    }
    const texts = [...seen].map((k) => PROMPTS.find((p) => p.key === k)!.text).join(' | ');
    expect(texts).not.toMatch(/hands|first day home|look like today|face do|came to meet|calms/i);
  });

  it('a born child, at any age and on any kind of night, is never offered a before prompt', () => {
    for (let ageMonths = 0; ageMonths <= 80; ageMonths += 1) {
      for (const k of [{}, { daysSinceLastEntry: 9 }, { hardStretch: true }, { together: true }, { role: 'contributor' as const }]) {
        for (let d = 0; d < 6; d++) expect(selectPrompt({ ...base, ageMonths, ...k, seed: `s${d}` }, PROMPTS).band).not.toBe('before');
      }
    }
  });

  it('adding the before set did not change what any born child is offered: the library without it picks the same', () => {
    const without = PROMPTS.filter((p) => p.band !== 'before');
    for (const ageMonths of [0, 3, 4, 8, 11, 15, 22, 30, 45, 70]) {
      for (let d = 0; d < 40; d++) {
        const input = { ...base, ageMonths, seed: `s${d}`, recentKeys: d % 3 ? [] : ['opening.any.know'] };
        expect(selectPrompt(input, PROMPTS).key).toBe(selectPrompt(input, without).key);
        expect(selectPrompt({ ...input, daysSinceLastEntry: 9 }, PROMPTS).key).toBe(selectPrompt({ ...input, daysSinceLastEntry: 9 }, without).key);
      }
    }
  });
});

describe('[S4] "Another thought" over the real library', () => {
  /** n presses: each leaves the prompt that was on screen out of the next draw. */
  const press = (input: SelectInput, n: number, exclude: boolean): string[] => {
    let shown = selectPrompt(input, PROMPTS).key;
    const seen = [shown];
    for (let i = 1; i <= n; i++) {
      shown = selectPrompt({ ...input, seed: `${input.seed}:${i}`, excludeKeys: exclude ? [shown] : [] }, PROMPTS).key;
      seen.push(shown);
    }
    return seen;
  };
  const repeats = (keys: string[]) => keys.filter((k, i) => i > 0 && k === keys[i - 1]).length;

  it('60 days, 12 presses a day, every age band, openings and gap nights, and the book before the birth: no immediate repeat', () => {
    let pressed = 0;
    for (const ageMonths of [0, 2, 5, 8, 11, 16, 22, 30, 50, 70]) {
      for (const k of [{ daysSinceLastEntry: 1 }, { daysSinceLastEntry: 9 }, { daysSinceLastEntry: null }, { ageMonths: 0, beforeBirth: true, daysSinceLastEntry: 9 }]) {
        for (let day = 0; day < 60; day++) {
          const keys = press({ ...base, ageMonths, ...k, seed: `2026-10-${day}` }, 12, true);
          expect(repeats(keys), `${ageMonths} ${JSON.stringify(k)} day ${day}: ${keys.join(' ')}`).toBe(0);
          pressed += 12;
        }
      }
    }
    expect(pressed).toBe(10 * 4 * 60 * 12);
  });

  it('the review\'s case: back after 5 or more days away, the gap pool of 7 repeated about one press in seven; now none does', () => {
    expect(PROMPTS.filter((p) => p.kind === 'gap' && p.band === 'any')).toHaveLength(7);
    let total = 0;
    let before = 0;
    let after = 0;
    for (let day = 0; day < 60; day++) {
      const input = { ...base, daysSinceLastEntry: 9, seed: `2026-10-${day}` };
      before += repeats(press(input, 12, false));
      after += repeats(press(input, 12, true));
      total += 12;
    }
    expect(before / total).toBeGreaterThan(0.08);
    expect(after).toBe(0);
  });

  it('a press on a gap night stays a gap prompt: the pool of 7 is never widened while 3 or more are left', () => {
    for (let day = 0; day < 60; day++) {
      for (const key of press({ ...base, daysSinceLastEntry: 9, seed: `d${day}` }, 12, true)) expect(key).toMatch(/^gap\./);
    }
  });
});
