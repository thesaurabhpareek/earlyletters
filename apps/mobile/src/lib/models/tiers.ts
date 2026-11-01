/**
 * Which size of model this phone runs (ADR 0001, ADR 0015, TDD 03 3.5.8 and
 * 5.2; pure, test/models-catalog.test.ts).
 *
 * - full: phones with 4 GB of RAM or more (iPhone 12 and later, SE 3; the
 *   iOS 17 minimum, D-040, already excludes most 3 GB phones). Large models
 *   (turbo, Belle Mandarin) need about 1 GB while a letter is transcribed
 *   (TDD 03 5.2, E; measured in BL-043).
 * - compact: phones under 4 GB, an unknown RAM size, or a phone where a
 *   large model failed twice for memory (the app was killed during a
 *   transcription, or the model would not load). Small models, about 400 MB
 *   resident (E). The parent can also choose it to save space (not offered
 *   in v1.0 Settings).
 *
 * iOS reports a 4 GB phone's physical memory as about 3.7e9 to 4.0e9 bytes
 * and a 3 GB phone as about 2.8e9 to 3.1e9 (U: from published device specs,
 * not measured here), so the line sits at 3.4e9.
 */
import type { Tier } from './catalog';

export const FULL_TIER_MIN_RAM_BYTES = 3.4e9;
export const MEMORY_FAILURES_BEFORE_COMPACT = 2;

export interface TierInput {
  totalMemoryBytes: number | null;
  memoryFailures: number;
  preference?: 'auto' | 'compact';
}

export function pickTier(i: TierInput): Tier {
  if (i.preference === 'compact') return 'compact';
  if (i.memoryFailures >= MEMORY_FAILURES_BEFORE_COMPACT) return 'compact';
  if (i.totalMemoryBytes == null || !Number.isFinite(i.totalMemoryBytes)) return 'compact';
  return i.totalMemoryBytes >= FULL_TIER_MIN_RAM_BYTES ? 'full' : 'compact';
}
