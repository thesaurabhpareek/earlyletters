/**
 * Settings, Appearance (EXPERIENCE_PASS_2026-10 S45, package P6): the reading sample, pure so
 * test/settings-p6b.test.ts runs it in Node. app/settings/appearance.tsx draws it.
 *
 * The sample in the letter face is the person's own words, never a sentence the app wrote (VOICE: the app's own words
 * never sit in the letter's type): the first line of their newest letter in the book. Never a private letter, never
 * the other parent's, never a quiet-day mark or a letter still waiting for its words. With none yet, the glyph
 * specimen "Aa" (`reader.previewEmpty`) at each size.
 */
import type { Entry } from '@/lib/store';

export type SampleEntry = Pick<Entry, 'kind' | 'inBook' | 'finalText' | 'transcriptStatus' | 'authorId'>;

/** Entries newest first (store.listEntriesForChild's order); `isOwn` is child-store's isOwnEntry. */
export function appearanceSample<E extends SampleEntry>(entries: readonly E[], isOwn: (e: E) => boolean): string | null {
  for (const e of entries) {
    if (e.kind === 'not_much' || !e.inBook || e.transcriptStatus === 'waiting' || !isOwn(e)) continue;
    const first = e.finalText
      .split(/\n+/)
      .map((l) => l.trim())
      .find((l) => l.length > 0);
    if (first) return first;
  }
  return null;
}
