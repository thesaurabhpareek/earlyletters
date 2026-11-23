/**
 * Prompt keys are never reused for new wording (WRITING-GUIDE.md Appendix B, v1.2). A rewrite gets a new `-v2` key, the old key
 * stays in the library marked `retired`, and the library version goes up. An old entry still finds its text by key, so the
 * retired texts below are pinned word for word: a later "fix" to a retired line goes red here. The texts are copied from
 * origin/develop before library version 5. Fixtures use the fictional family Asha only.
 */
import { describe, expect, it } from 'vitest';
import { PROMPTS, PROMPT_LIBRARY_VERSION } from '../src/prompts';

const RETIRED_AT_V5: Array<{ key: string; text: string; band: string; kind: string }> = [
  { key: 'opening.any.smell', text: 'What does {child} smell like right now? Try to put it in words.', band: 'any', kind: 'opening' },
  { key: 'opening.any.window', text: 'What can you see out the window tonight?', band: 'any', kind: 'opening' },
  { key: 'opening.0-3.looks-like', text: 'Who does {child} look like today? Which feature gives it away?', band: '0-3', kind: 'opening' },
  { key: 'opening.7-9.first-food', text: 'What food did {child} try this week? What was the face?', band: '7-9', kind: 'opening' },
  { key: 'opening.10-12.birthday-wish', text: 'What do you hope year two feels like for {child}?', band: '10-12', kind: 'opening' },
  { key: 'opening.13-18.steps', text: 'Where is {child} walking to these days? What is the hurry?', band: '13-18', kind: 'opening' },
  { key: 'opening.19-24.mine', text: 'What does {child} call mine right now?', band: '19-24', kind: 'opening' },
  { key: 'opening.25-36.big-feeling', text: 'What gave {child} a big feeling today, happy or otherwise?', band: '25-36', kind: 'opening' },
  { key: 'gap.any.one-word', text: 'One word for {child} lately. Then say why.', band: 'any', kind: 'gap' },
  { key: 'gap.any.new-thing', text: 'What is something {child} does now that is new?', band: 'any', kind: 'gap' },
  { key: 'gap.any.small', text: 'Tell {child} one small thing. That is a whole letter.', band: 'any', kind: 'gap' },
  { key: 'together.7-9.babble', text: 'Talk to {child} and leave pauses. Keep the babbling answers.', band: '7-9', kind: 'together' },
  { key: 'together.37-60.tell-story', text: 'Let {child} tell you a story. You just listen and keep it.', band: '37-60', kind: 'together' },
];

const byKey = new Map(PROMPTS.map((p) => [p.key, p]));

describe('prompt library versioning', () => {
  it('is at version 5', () => {
    expect(PROMPT_LIBRARY_VERSION).toBe(5);
  });

  it('keeps keys unique', () => {
    expect(new Set(PROMPTS.map((p) => p.key)).size).toBe(PROMPTS.length);
  });

  it('keeps every retired prompt with its old text, band and kind', () => {
    for (const old of RETIRED_AT_V5) {
      const p = byKey.get(old.key);
      expect(p, old.key).toBeDefined();
      expect(p?.retired, old.key).toBe(true);
      expect(p?.text, old.key).toBe(old.text);
      expect(p?.band, old.key).toBe(old.band);
      expect(p?.kind, old.key).toBe(old.kind);
    }
  });

  it('marks nothing else retired without adding it to the pinned list', () => {
    const pinned = new Set(RETIRED_AT_V5.map((o) => o.key));
    const retired = PROMPTS.filter((p) => p.retired).map((p) => p.key);
    // A later retirement adds its old text to RETIRED_AT_V5 above, in the same change that bumps the version.
    expect(retired.filter((k) => !pinned.has(k))).toEqual([]);
  });

  it('gives every -v2 key a retired predecessor with the same band and kind', () => {
    const v2 = PROMPTS.filter((p) => p.key.endsWith('-v2'));
    expect(v2.length).toBe(RETIRED_AT_V5.length);
    for (const p of v2) {
      const old = byKey.get(p.key.replace(/-v2$/, ''));
      expect(old, p.key).toBeDefined();
      expect(old?.retired, p.key).toBe(true);
      expect(old?.band, p.key).toBe(p.band);
      expect(old?.kind, p.key).toBe(p.kind);
      expect(p.retired, p.key).toBeFalsy();
      expect(p.text, p.key).not.toBe(old?.text);
    }
  });
});
