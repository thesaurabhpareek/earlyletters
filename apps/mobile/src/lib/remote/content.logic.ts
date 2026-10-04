/**
 * Which words the app shows: the server's content blocks when a valid signed
 * bundle has them, the packaged copy in @scribe/content otherwise (ADR 0016,
 * decision 16). Pure, tested in Node.
 *
 * Fallback is per slot and all-or-nothing within a slot: the server's prompt
 * library replaces the packaged one only if it covers every kind and age band
 * the packaged one covers; the server's story cards replace the packaged set
 * only as a complete run 1..n. A half-delivered or half-valid bundle can
 * therefore never leave a screen empty or with a gap.
 */
import {
  blocksOf,
  type AnnouncementBlock,
  type ContentBundle,
  type IntroVariant,
  type StoryBlock,
  type TipBlock,
} from '@scribe/api';
import type { Prompt } from '@scribe/core';

export type StoryCardLike = Pick<StoryBlock, 'id' | 'order' | 'headline' | 'line' | 'visual'> & { type: 'story' };

export interface ContentContext {
  /** The verified server bundle, or null. */
  server: Pick<ContentBundle, 'blocks'> | null;
  /** Remote config kill switch `serverContent`. */
  serverContentKilled: boolean;
  appVersion: string;
  now: Date;
}

const usable = (c: ContentContext) => (c.serverContentKilled ? null : c.server);

function coverage(prompts: readonly Pick<Prompt, 'kind' | 'band'>[]): Set<string> {
  return new Set(prompts.map((p) => `${p.kind}:${p.band}`));
}

/** The prompt library to pass to `selectPrompt` (@scribe/core). */
export function promptLibrary(ctx: ContentContext, packaged: readonly Prompt[]): { prompts: readonly Prompt[]; source: 'server' | 'packaged' } {
  const server = usable(ctx);
  const live = packaged.filter((p) => !p.retired);
  if (!server) return { prompts: live, source: 'packaged' };
  const blocks = blocksOf(server, 'prompt', ctx.appVersion, ctx.now);
  if (blocks.length === 0) return { prompts: live, source: 'packaged' };
  const fromServer: Prompt[] = blocks.map((b) => ({ key: b.id, text: b.text, band: b.band, kind: b.kind }));
  const have = coverage(fromServer);
  for (const need of coverage(live)) if (!have.has(need)) return { prompts: live, source: 'packaged' };
  return { prompts: fromServer, source: 'server' };
}

/** Onboarding story cards in order, after the intro variant (A-REQ-011). */
export function storyCards(
  ctx: ContentContext,
  packaged: readonly StoryCardLike[],
  variant: IntroVariant,
): { cards: StoryCardLike[]; source: 'server' | 'packaged' } {
  const server = usable(ctx);
  let cards: StoryCardLike[] = [...packaged].sort((a, b) => a.order - b.order);
  let source: 'server' | 'packaged' = 'packaged';
  if (server) {
    const fromServer = blocksOf(server, 'story', ctx.appVersion, ctx.now).sort((a, b) => a.order - b.order);
    const complete = fromServer.length > 0 && fromServer.every((b, i) => b.order === i + 1);
    if (complete) {
      cards = fromServer.map((b) => ({ type: 'story', id: b.id, order: b.order, headline: b.headline, line: b.line, visual: b.visual }));
      source = 'server';
    }
  }
  if (cards.length === 0) return { cards, source };
  if (variant === 'none') return { cards: [cards[cards.length - 1]], source };
  if (variant === 'three' && cards.length >= 4) return { cards: cards.filter((c) => c.order !== 3), source };
  return { cards, source };
}

/** Tips for one placement. There is no packaged tip set: no server tips means no tip. */
export function tipsFor(ctx: ContentContext, placement: TipBlock['placement']): TipBlock[] {
  const server = usable(ctx);
  return server ? blocksOf(server, 'tip', ctx.appVersion, ctx.now).filter((t) => t.placement === placement) : [];
}

/** Live announcements the person has not dismissed, newest list order. */
export function liveAnnouncements(ctx: ContentContext, dismissed: ReadonlySet<string>): AnnouncementBlock[] {
  const server = usable(ctx);
  if (!server) return [];
  return blocksOf(server, 'announcement', ctx.appVersion, ctx.now).filter((a) => !(a.dismissible && dismissed.has(a.id)));
}
