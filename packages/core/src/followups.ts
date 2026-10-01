/**
 * Follow-up question selection: rules choose an archetype, templates phrase
 * it. Max two per entry, always skippable. (PRD v2 section 16.1)
 */
import { classify } from './safety';
import { words } from './text';

export type FollowUpKind = 'anchor' | 'you' | 'contain';

export interface FollowUp {
  kind: FollowUpKind;
  text: string;
}

const AFFECT = new Set([
  'felt', 'feel', 'feeling', 'happy', 'sad', 'proud', 'scared', 'tired', 'love', 'loved', 'cried', 'cry',
  'worried', 'relieved', 'grateful', 'angry', 'frustrated', 'nervous', 'calm', 'excited', 'heart', 'miss',
  'glad', 'afraid', 'overwhelmed', 'exhausted', 'joy',
]);

const DISTRESS = new Set(['exhausted', 'overwhelmed', 'hopeless', 'crying', 'cried', 'awful', 'terrible', 'breaking', 'drowning']);

export const MAX_FOLLOWUPS = 2;
const SHORT_ENTRY_WORDS = 25;

/**
 * Picks follow-ups for the text so far. Returns at most `MAX_FOLLOWUPS - asked`.
 * A heavy entry gets one containing question and nothing else.
 */
export function selectFollowUps(text: string, child: string, alreadyAsked: FollowUpKind[] = []): FollowUp[] {
  const remaining = MAX_FOLLOWUPS - alreadyAsked.length;
  if (remaining <= 0) return [];
  const ws = words(text);
  const distress = ws.filter((w) => DISTRESS.has(w)).length;

  if (classify(text) > 0 || distress >= 2) {
    if (alreadyAsked.includes('contain')) return [];
    return [{ kind: 'contain', text: `Do you want this in ${child}'s book, or just out of your head?` }];
  }

  const out: FollowUp[] = [];
  if (ws.length < SHORT_ENTRY_WORDS && !alreadyAsked.includes('anchor')) {
    out.push({ kind: 'anchor', text: 'What is one small detail about that moment you want to keep?' });
  }
  if (!ws.some((w) => AFFECT.has(w)) && !alreadyAsked.includes('you')) {
    out.push({ kind: 'you', text: 'What did you feel, watching that?' });
  }
  return out.slice(0, remaining);
}
