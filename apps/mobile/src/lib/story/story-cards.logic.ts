/**
 * Validation of the story cards the first-run intro will show, over `firstRunStories` from packages/content.
 * Limits match the server schema (StoryBlockSchema: headline 80, line 200). No words live here.
 */
import { STORY_VISUALS, type StoryCard } from '@scribe/content';

export type StoryCardIssueCode = 'count' | 'duplicate-id' | 'order' | 'visual' | 'words' | 'length';
export interface StoryCardIssue {
  code: StoryCardIssueCode;
  id?: string;
}

export const STORY_MIN_CARDS = 3;
export const STORY_MAX_CARDS = 6;
export const HEADLINE_MAX = 80;
export const LINE_MAX = 200;

export function validateStoryCards(cards: readonly StoryCard[]): StoryCardIssue[] {
  const out: StoryCardIssue[] = [];
  if (cards.length < STORY_MIN_CARDS || cards.length > STORY_MAX_CARDS) out.push({ code: 'count' });
  const seen = new Set<string>();
  cards.forEach((c, i) => {
    if (seen.has(c.id)) out.push({ code: 'duplicate-id', id: c.id });
    seen.add(c.id);
    if (c.order !== i + 1) out.push({ code: 'order', id: c.id });
    if (!(STORY_VISUALS as readonly string[]).includes(c.visual)) out.push({ code: 'visual', id: c.id });
    if (!c.headline.trim() || !c.line.trim()) out.push({ code: 'words', id: c.id });
    if (c.headline.length > HEADLINE_MAX || c.line.length > LINE_MAX) out.push({ code: 'length', id: c.id });
  });
  return out;
}

/** One screen-reader element per card: the headline, then the line. */
export function storyCardA11yLabel(card: StoryCard): string {
  return `${card.headline} ${card.line}`;
}
