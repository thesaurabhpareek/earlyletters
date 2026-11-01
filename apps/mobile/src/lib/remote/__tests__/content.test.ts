/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import { parseContentBundle, type ContentBundle } from '@scribe/api';
import { onboardingStories, PROMPTS } from '@scribe/content';
import { liveAnnouncements, promptLibrary, storyCards, tipsFor, type ContentContext } from '../content.logic';

const now = new Date('2026-10-03T12:00:00Z');
const bundle = (blocks: unknown[]): ContentBundle => {
  const r = parseContentBundle({ schemaVersion: 1, version: 4, generatedAt: '2026-10-03T00:00:00.000Z', locale: 'en', blocks });
  if (!r.ok) throw new Error('fixture');
  return r.value;
};
const ctx = (server: ContentBundle | null, killed = false): ContentContext => ({ server, serverContentKilled: killed, appVersion: '1.0.0', now });
const promptBlocks = PROMPTS.filter((p) => !p.retired).map((p) => ({ type: 'prompt', id: p.key, text: p.text, band: p.band, kind: p.kind }));

describe('prompts', () => {
  it('[DECISION-16] uses the packaged library until a server copy exists', () => {
    expect(promptLibrary(ctx(null), PROMPTS).source).toBe('packaged');
  });

  it('uses the server library when it covers every kind and age band', () => {
    const server = bundle([...promptBlocks, { type: 'prompt', id: 'opening.any.new-one', text: 'What new thing did {child} notice today?', band: 'any', kind: 'opening' }]);
    const r = promptLibrary(ctx(server), PROMPTS);
    expect(r.source).toBe('server');
    expect(r.prompts.some((p) => p.key === 'opening.any.new-one')).toBe(true);
  });

  it('falls back to the packaged library when the server library has a gap', () => {
    const partial = bundle(promptBlocks.filter((b) => b.kind !== 'hard'));
    expect(promptLibrary(ctx(partial), PROMPTS).source).toBe('packaged');
  });

  it('[P3 critics S2] a server library from before the pre-birth set (library v2, no `before` block) is not used: the packaged library is', () => {
    // The bundle a phone may already have: today's prompts minus the `before` blocks, otherwise complete and valid.
    const v2 = bundle(promptBlocks.filter((b) => b.band !== 'before'));
    expect(promptBlocks.some((b) => b.band === 'before')).toBe(true);
    const r = promptLibrary(ctx(v2), PROMPTS);
    expect(r.source).toBe('packaged');
    // A book before the birth therefore still has its set, and no age-band prompt stands in for it.
    expect(r.prompts.filter((p) => p.band === 'before').map((p) => p.key)).toEqual(PROMPTS.filter((p) => p.band === 'before').map((p) => p.key));
    // The same bundle with the `before` blocks is used.
    expect(promptLibrary(ctx(bundle(promptBlocks)), PROMPTS).source).toBe('server');
  });

  it('ignores server content when the kill switch is on', () => {
    expect(promptLibrary(ctx(bundle(promptBlocks), true), PROMPTS).source).toBe('packaged');
  });
});

describe('story cards', () => {
  const serverStories = [1, 2, 3, 4].map((order) => ({ type: 'story', id: `story.server-${order}.v1`, order, headline: `Card ${order}.`, line: 'A line.', visual: 'moon' }));

  it('falls back to the packaged cards, in order', () => {
    const r = storyCards(ctx(null), onboardingStories, 'four');
    expect(r.source).toBe('packaged');
    expect(r.cards.map((c) => c.order)).toEqual([1, 2, 3, 4]);
  });

  it('uses a complete server set and applies the intro variant (A-REQ-011)', () => {
    const server = bundle(serverStories);
    expect(storyCards(ctx(server), onboardingStories, 'four').cards.map((c) => c.id)).toEqual(serverStories.map((s) => s.id));
    expect(storyCards(ctx(server), onboardingStories, 'three').cards.map((c) => c.order)).toEqual([1, 2, 4]);
    expect(storyCards(ctx(server), onboardingStories, 'none').cards.map((c) => c.order)).toEqual([4]);
  });

  it('never shows a server set with a gap', () => {
    const gappy = bundle(serverStories.filter((s) => s.order !== 2));
    expect(storyCards(ctx(gappy), onboardingStories, 'four').source).toBe('packaged');
  });
});

describe('tips and announcements', () => {
  it('shows tips for one placement, and live, undismissed announcements', () => {
    const server = bundle([
      { type: 'tip', id: 'tip.review.undo', placement: 'review', body: 'Tap a change to undo it.' },
      { type: 'tip', id: 'tip.book.share', placement: 'book', body: 'Long press a letter to share it.' },
      { type: 'announcement', id: 'ann.a', title: 'A', body: 'Body A.' },
      { type: 'announcement', id: 'ann.b', title: 'B', body: 'Body B.', dismissible: false },
    ]);
    expect(tipsFor(ctx(server), 'review').map((t) => t.id)).toEqual(['tip.review.undo']);
    expect(tipsFor(ctx(null), 'review')).toEqual([]);
    expect(liveAnnouncements(ctx(server), new Set(['ann.a', 'ann.b'])).map((a) => a.id)).toEqual(['ann.b']);
    expect(liveAnnouncements(ctx(server, true), new Set())).toEqual([]);
  });
});
