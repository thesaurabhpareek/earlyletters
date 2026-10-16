/**
 * Safety tiers (packages/core/src/safety.ts; PRD v2 18.2, LEGAL-REQ-015) and the
 * follow-up picker that reads them. One case per pattern, so a pattern that is
 * edited or removed is noticed. Every phrase is fiction about the Asha family;
 * nothing here is logged, and the classifier never touches the words.
 */
import { describe, expect, it } from 'vitest';
import { classify, MAX_FOLLOWUPS, SAFETY_COPY, selectFollowUps } from '../src';

const TIER2 = [
  'I keep thinking about hurting myself',
  'some nights I want to end it all',
  'I wanted to die last night',
  'I dont want to wake up tomorrow',
  'they would all be better off without me',
  'I had suicidal thoughts again',
  'I am scared I will shake the baby',
  'she is not really my baby, that is how it feels',
  'the voices told me to leave her',
  'I cant keep the baby safe',
];

const TIER1 = [
  'what if I dropped Asha on the stairs',
  'an intrusive thought came in the bath',
  'scary thoughts at three in the morning',
  "I don't feel bonded to her yet",
  'I am a terrible mother some days',
  "I'm failing her",
  'so much rage tonight over nothing',
  "I can't do this anymore, not today",
];

const TIER0 = [
  'Asha laughed at the rain today.',
  'I could kill for a coffee after that night.',
  'the hurt knee healed by the weekend',
  'we will shake the rattle for her and she grins',
  'my baby is not really sleeping yet',
  'Nani sang and nobody wanted to leave',
  'she pointed at the moon and said bau',
  '',
];

describe('classify: deterministic patterns, no text ever leaves', () => {
  it.each(TIER2.map((t) => [t]))('[LEGAL-REQ-015] tier 2: "%s"', (text) => {
    expect(classify(text)).toBe(2);
  });

  it.each(TIER1.map((t) => [t]))('tier 1: "%s"', (text) => {
    expect(classify(text)).toBe(1);
  });

  it.each(TIER0.map((t) => [t]))('tier 0: "%s"', (text) => {
    expect(classify(text)).toBe(0);
  });

  it('is case-insensitive and reads across punctuation and line breaks', () => {
    expect(classify('WHAT IF I DROPPED HER')).toBe(1);
    expect(classify('Some nights.\nI want to die.\nThen morning comes.')).toBe(2);
  });

  it('tier 2 wins when a text carries both', () => {
    expect(classify('I am a terrible mother and I want to die')).toBe(2);
  });

  it('[PRD 18.2] ambiguity resolves upward: a word that only resembles risk still flags', () => {
    expect(classify('a suicide prevention leaflet came with the post')).toBe(2);
  });

  it('never throws on unusual input', () => {
    for (const s of ['आशा हँसी', 'bau bau 🐣', '\u0000', 'x'.repeat(10_000)]) expect(() => classify(s), s).not.toThrow();
    expect(classify('x'.repeat(10_000))).toBe(0);
  });
});

describe('SAFETY_COPY: fixed words, never generated', () => {
  it('is non-empty, plain and names the emergency number', () => {
    for (const [key, text] of Object.entries(SAFETY_COPY)) {
      expect(text.length, key).toBeGreaterThan(20);
      expect(text, key).not.toMatch(/[—–‘’“”…]|\p{Extended_Pictographic}/u);
    }
    expect(SAFETY_COPY.tier2Emergency).toContain('911');
  });
});

describe('selectFollowUps reads the tiers (PRD v2 16.1)', () => {
  it('a heavy entry gets one containing question and nothing else, whatever its length', () => {
    const f = selectFollowUps(`${TIER1[0]} and we walked and walked and the dog came and she laughed and I cried a little and then dinner`, 'Asha');
    expect(f).toEqual([{ kind: 'contain', text: "Do you want this in Asha's book, or just out of your head?" }]);
    expect(selectFollowUps(TIER2[2], 'Asha')).toHaveLength(1);
  });

  it('two distress words make an entry heavy without a tier; one does not', () => {
    expect(selectFollowUps('It was awful and hopeless.', 'Asha').map((f) => f.kind)).toEqual(['contain']);
    expect(selectFollowUps('It was awful.', 'Asha').map((f) => f.kind)).toEqual(['anchor', 'you']);
  });

  it('the containing question is asked once; after it nothing more is asked', () => {
    expect(selectFollowUps(TIER1[0], 'Asha', ['contain'])).toEqual([]);
    expect(selectFollowUps(TIER1[0], 'Asha', ['anchor'])).toHaveLength(1);
  });

  it('a long entry skips the anchor; an entry with feeling words skips the "you" question', () => {
    const long = 'Asha ' + 'walked to the gate and back '.repeat(6);
    expect(selectFollowUps(long, 'Asha').map((f) => f.kind)).toEqual(['you']);
    expect(selectFollowUps('She was so proud.', 'Asha').map((f) => f.kind)).toEqual(['anchor']);
    expect(selectFollowUps(long + ' I felt so proud.', 'Asha')).toEqual([]);
  });

  it(`never returns more than MAX_FOLLOWUPS (${MAX_FOLLOWUPS}) minus what was asked`, () => {
    expect(selectFollowUps('She walked.', 'Asha', ['you']).map((f) => f.kind)).toEqual(['anchor']);
    expect(selectFollowUps('She walked.', 'Asha', ['anchor', 'you'])).toEqual([]);
    expect(selectFollowUps('She walked.', 'Asha', ['anchor', 'you', 'contain'])).toEqual([]);
  });
});
