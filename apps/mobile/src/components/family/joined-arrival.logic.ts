/**
 * The second parent's first Book (EXPERIENCE_PASS_2026-10 S59, 5.8 row 12), pure so it is tested in Node
 * (test/join-sheet.test.ts). The Book's lamp keeps the tabs' shared light (persistKey "tabs") like every tab, so the
 * next tab settles from it; for this one arrival the tabs' light is first set to unlit, so the Book's lamp comes up
 * from 0 to its 0.6 over arriveMs instead of settling from the last room's level. Reduce Motion still lights it at
 * once (planLampMount). Called by app/(tabs)/book.tsx when it takes the join sheet's one-shot mark.
 */
import { lampMemory, resolveLamp, type LampMemory } from '@/components/ui/lamp.logic';

export function startJoinedArrival(now: number = Date.now()): number {
  const book = resolveLamp({ scene: 'book' });
  const kept = lampMemory.get('tabs');
  const unlitFrom: LampMemory | undefined = kept ?? (book ? { light: { anchor: book.anchor, core: book.core, tail: book.tail }, level: 0 } : undefined);
  lampMemory.set('tabs', null, unlitFrom);
  return now;
}
