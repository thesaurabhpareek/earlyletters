/**
 * Hook over `planForYou` for the Moments screen (PR 9b). Re-plans when the moments store changes (a day hidden or
 * brought back) or the inputs do. Same import rule as `for-you.ts`: only the Moments screen, behind the flag.
 */
import { useEffect, useMemo, useState } from 'react';
import { momentsStore } from './store';
import { planForYou, type ForYouInput } from './for-you';

export function useForYou(input: ForYouInput) {
  const [version, setVersion] = useState(0);
  useEffect(() => momentsStore.subscribe(() => setVersion((v) => v + 1)), []);
  // `version` is the only reason to re-read the store; the plan is derived, never stored.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => planForYou(momentsStore, input), [version, input]);
}
