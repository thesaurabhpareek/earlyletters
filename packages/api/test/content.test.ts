import { describe, expect, expectTypeOf, it } from 'vitest';
import type { PromptBand, PromptKind } from '@scribe/core';
import { onboardingStories, PROMPTS, STORY_VISUALS as CONTENT_STORY_VISUALS } from '@scribe/content';
import { blocksOf, parseContentBundle, PROMPT_BANDS, PROMPT_KINDS, STORY_VISUALS, textProblems, type ContentBlock } from '../src';

const bundle = (blocks: unknown[]) => ({ schemaVersion: 1, version: 2, generatedAt: '2026-10-03T12:00:00.000Z', locale: 'en', blocks });

describe('content blocks', () => {
  it('mirrors the prompt bands and kinds in @scribe/core exactly', () => {
    expectTypeOf<(typeof PROMPT_BANDS)[number]>().toEqualTypeOf<PromptBand>();
    expectTypeOf<(typeof PROMPT_KINDS)[number]>().toEqualTypeOf<PromptKind>();
  });

  it('[DECISION-16] every packaged prompt is a valid prompt block (the packaged copy is a valid fallback)', () => {
    const r = parseContentBundle(bundle(PROMPTS.filter((p) => !p.retired).map((p) => ({ type: 'prompt', id: p.key, text: p.text, band: p.band, kind: p.kind }))));
    expect(r.ok).toBe(true);
    expect(r.ok && r.skipped).toBe(0);
  });

  it('[DECISION-16] the packaged story cards are valid story blocks with the same visual list', () => {
    expect([...CONTENT_STORY_VISUALS]).toEqual([...STORY_VISUALS]);
    const r = parseContentBundle(bundle([...onboardingStories]));
    expect(r.ok && r.skipped).toBe(0);
    expect(r.ok && r.value.blocks.length).toBe(onboardingStories.length);
  });

  it('accepts each block type', () => {
    const r = parseContentBundle(
      bundle([
        { type: 'prompt', id: 'opening.any.test', text: 'What did {child} do today?', band: 'any', kind: 'opening' },
        { type: 'tip', id: 'tip.review.undo', placement: 'review', body: 'Tap any change to undo it.' },
        { type: 'story', id: 'story.1', order: 1, headline: 'Talk for a minute.', line: 'Tell your child about today.', visual: 'envelope-fold' },
        { type: 'announcement', id: 'ann.storage', title: 'More room', body: 'You can remove language packs in Settings.', action: { kind: 'route', label: 'Open Storage', route: 'settings/storage' } },
      ]),
    );
    expect(r.ok && r.value.blocks.map((b) => b.type)).toEqual(['prompt', 'tip', 'story', 'announcement']);
    expect(r.ok && r.skipped).toBe(0);
  });

  it('skips unknown types and blocks that break the content rules', () => {
    const r = parseContentBundle(
      bundle([
        { type: 'video', id: 'x', url: 'https://example.com/v.mp4' },
        { type: 'tip', id: 'a', placement: 'review', body: 'Dashes — are not allowed' },
        { type: 'tip', id: 'b', placement: 'review', body: '“Curly” quotes' },
        { type: 'tip', id: 'c', placement: 'review', body: 'Wait…' },
        { type: 'tip', id: 'd', placement: 'review', body: 'Hello {name}' },
        { type: 'tip', id: 'e', placement: 'review', body: 'Two\nlines' },
        { type: 'tip', id: 'f', placement: 'nowhere', body: 'Fine words' },
        { type: 'story', id: 'g', order: 1, headline: 'Hi', line: 'There', visual: 'https://example.com/i.png' },
        { type: 'announcement', id: 'h', title: 'T', body: 'B', action: { kind: 'url', label: 'Go', url: 'https://evil.example.com' } },
        { type: 'tip', id: 'ok', placement: 'review', body: 'Fine words for {child}.' },
      ]),
    );
    expect(r.ok && r.value.blocks.map((b) => b.id)).toEqual(['ok']);
    expect(r.ok && r.skipped).toBe(9);
  });

  it('reports text problems precisely', () => {
    expect(textProblems('Plain words.')).toEqual([]);
    expect(textProblems(' padded')).toContain('whitespace');
    expect(textProblems('A {child} and {app} and {signsAs}')).toEqual([]);
    expect(textProblems('Odd } brace')).toContain('stray_brace');
  });

  it('filters by app version and announcement window', () => {
    const r = parseContentBundle(
      bundle([
        { type: 'tip', id: 'new', placement: 'book', body: 'Only on new apps.', minAppVersion: '1.2.0' },
        { type: 'tip', id: 'all', placement: 'book', body: 'Everyone.' },
        { type: 'announcement', id: 'past', title: 'Past', body: 'Over.', endsAt: '2026-01-01T00:00:00Z' },
        { type: 'announcement', id: 'now', title: 'Now', body: 'Live.', startsAt: '2026-10-01T00:00:00Z', endsAt: '2026-11-01T00:00:00Z' },
        { type: 'announcement', id: 'later', title: 'Later', body: 'Soon.', startsAt: '2027-01-01T00:00:00Z' },
      ]),
    );
    if (!r.ok) throw new Error('fixture');
    const now = new Date('2026-10-03T12:00:00Z');
    expect(blocksOf(r.value, 'tip', '1.0.0', now).map((b) => b.id)).toEqual(['all']);
    expect(blocksOf(r.value, 'tip', '1.2.0', now).map((b) => b.id)).toEqual(['new', 'all']);
    expect(blocksOf(r.value, 'announcement', '1.0.0', now).map((b) => b.id)).toEqual(['now']);
    const tips: ContentBlock[] = blocksOf(r.value, 'tip', '1.0.0', now);
    expect(tips.every((t) => t.type === 'tip')).toBe(true);
  });

  it('drops duplicate ids within a type', () => {
    const r = parseContentBundle(bundle([{ type: 'tip', id: 'a', placement: 'book', body: 'One.' }, { type: 'tip', id: 'a', placement: 'book', body: 'Two.' }]));
    expect(r.ok && r.value.blocks.length).toBe(1);
  });
});
