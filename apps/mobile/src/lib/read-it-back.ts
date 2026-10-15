/**
 * "Words are ready. Read it back." (D-086). When a letter's words arrive after it was saved, they arrive exactly
 * as said, and the letter page asks the parent to read them. The flag is a list of letter ids in one setting
 * (never any words), cleared when the parent taps Read it back.
 */
import { deleteSetting, getSetting, setSetting } from './store';
import { parseIds, withId, withoutId } from './read-it-back.logic';

const KEY = 'words.readItBack';

const read = () => parseIds(getSetting(KEY));

export function isReadItBack(id: string): boolean {
  return read().includes(id);
}

export function flagReadItBack(id: string): void {
  setSetting(KEY, JSON.stringify(withId(read(), id)));
}

export function clearReadItBack(id: string): void {
  const next = withoutId(read(), id);
  if (next.length === 0) deleteSetting(KEY);
  else setSetting(KEY, JSON.stringify(next));
}
