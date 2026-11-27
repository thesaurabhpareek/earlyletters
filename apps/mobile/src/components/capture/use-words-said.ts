/**
 * What VoiceOver is told about Review's words card (TDD 09 V1, BL-399), moved out of app/review.tsx's WordsStatus
 * unchanged so a test can run it beside the card (BL-1953). VoiceOver ignores live regions on iOS, so the state is said
 * aloud: the card's own title (never the letter's words) once Review has dissolved in (VoiceOver's focus lands on
 * "Hear it", not on the card), again on each change of state, and the longer-than-usual line when it appears. A title
 * that changes within a state (the part counter while words are written down) is not said: the card's InlineState
 * passes `callerSpeaks`, so it says nothing of its own either.
 */
import { useEffect, useRef } from 'react';
import { tokens } from '@scribe/design-tokens';
import type { WordsCard } from '@/components/capture/words-state.logic';
import { announce } from '@/lib/a11y';

export function useWordsSaid(card: WordsCard): void {
  const said = useRef<{ state: string; later: boolean } | null>(null);
  const title = useRef(card.title);
  title.current = card.title;
  const first = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (first.current) clearTimeout(first.current);
    },
    [],
  );
  useEffect(() => {
    const now = { state: card.state, later: card.state === 'writing' && card.primary === 'keep' };
    const before = said.current;
    said.current = now;
    if (!before) {
      first.current = setTimeout(() => {
        first.current = null;
        announce(title.current);
      }, tokens.motion.route.dissolveMs);
      return;
    }
    if (before.state !== now.state) {
      if (first.current) clearTimeout(first.current);
      first.current = null;
      announce(card.title);
    } else if (!before.later && now.later) announce(card.body ?? card.title);
  }, [card.state, card.primary, card.quiet, card.title]);
}
