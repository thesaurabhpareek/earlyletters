/** First-run story cards (FR-07, FR-14): the data the story shows is complete and in order. */
import { describe, expect, it } from 'vitest';
import { firstRunStories, STORY_VISUALS, type StoryCard } from '@scribe/content';
import { storyCardA11yLabel, validateStoryCards } from '../src/lib/story/story-cards.logic';

describe('first-run story cards', () => {
  it('there are 3 cards and the deck validates with no issue', () => {
    expect(firstRunStories).toHaveLength(3);
    expect(validateStoryCards(firstRunStories)).toEqual([]);
  });

  it('ids are unique, orders are 1..3 in array order, every visual is a bundled one', () => {
    expect(new Set(firstRunStories.map((c) => c.id)).size).toBe(3);
    expect(firstRunStories.map((c) => c.order)).toEqual([1, 2, 3]);
    for (const c of firstRunStories) expect(STORY_VISUALS).toContain(c.visual);
  });

  it('the deck is the journey order: talk, stays in your words, voice', () => {
    expect(firstRunStories.map((c) => c.id)).toEqual(['story.talk.v1', 'story.exact.v3', 'story.voice.v1']);
  });

  it('[FR-14] every card has screen-reader text: one element with headline then line', () => {
    for (const c of firstRunStories) {
      const label = storyCardA11yLabel(c);
      expect(label.startsWith(c.headline)).toBe(true);
      expect(label.endsWith(c.line)).toBe(true);
      expect(label.trim().length).toBeGreaterThan(0);
    }
  });

  it('the first-run deck names no child, no placeholder, no count', () => {
    for (const c of firstRunStories) expect(`${c.headline} ${c.line}`).not.toMatch(/\{|\}|\d/);
  });

  describe('the validator catches what would break the story', () => {
    const base = firstRunStories[0];
    const card = (p: Partial<StoryCard>): StoryCard => ({ ...base, ...p });
    const issues = (cards: StoryCard[]) => validateStoryCards(cards).map((i) => i.code);

    it('too few or too many cards', () => {
      expect(issues([base])).toContain('count');
      expect(issues([1, 2, 3, 4, 5, 6, 7].map((n) => card({ id: `x${n}`, order: n })))).toContain('count');
    });
    it('duplicate ids, order gaps and order out of array order', () => {
      expect(issues([card({ id: 'a', order: 1 }), card({ id: 'a', order: 2 }), card({ id: 'c', order: 3 })])).toContain('duplicate-id');
      expect(issues([card({ id: 'a', order: 1 }), card({ id: 'b', order: 3 }), card({ id: 'c', order: 4 })])).toContain('order');
      expect(issues([card({ id: 'a', order: 2 }), card({ id: 'b', order: 1 }), card({ id: 'c', order: 3 })])).toContain('order');
    });
    it('a visual that is not bundled, empty words, words over the schema limits', () => {
      const three = (c: StoryCard) => [card({ id: 'a', order: 1 }), card({ id: 'b', order: 2 }), { ...c, id: 'c', order: 3 }];
      expect(issues(three(card({ visual: 'sparkle' as never })))).toContain('visual');
      expect(issues(three(card({ headline: '  ' })))).toContain('words');
      expect(issues(three(card({ line: '' })))).toContain('words');
      expect(issues(three(card({ headline: 'x'.repeat(81) })))).toContain('length');
      expect(issues(three(card({ line: 'x'.repeat(201) })))).toContain('length');
    });
  });
});
