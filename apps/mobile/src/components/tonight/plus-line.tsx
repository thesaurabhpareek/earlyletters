// web: same (React Native Web) | android: same
/**
 * PlusLine (F14-REQ-040, SR-C-08): the one standing line above Speak and Type once the free letters are used and Plus
 * is off. A state on the paper, not a card, a banner, a button or a sheet: footnote in textMuted, never a count, never a
 * price, and nothing to press (F14-REQ-040: "No count, no button"; Karma ruling on #508). It wraps at every text size
 * and nothing is cut. Whether it shows is tonight-plus.logic plusLineShows.
 * In an alpha build the words are the Keep sheet's own note (plusLineFor, billing/alpha.ts): the alpha allowance is 100
 * letters, so the line can show past 100, and it must not say new letters need Plus where Plus is not part of the test.
 * No entrance: it is part of the pinned actions, which never animate in (MOTION principle 2).
 */
import { Text } from '@/components/ui/text';
import { PLUS_ALPHA, plusLineFor } from '@/lib/billing/alpha';
import { plusLine } from './tonight-plus.logic';

export function PlusLine() {
  return (
    <Text variant="footnote" tone="muted" className="text-center" testID="tonight.plusLine">
      {plusLineFor(PLUS_ALPHA, plusLine())}
    </Text>
  );
}
