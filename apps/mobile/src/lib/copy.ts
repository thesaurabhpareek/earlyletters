/**
 * Copy helper. Every word comes from @scribe/content; screens never
 * hardcode user-facing text. Placeholders are filled with renderTemplate.
 */
import { en } from '@scribe/content';
import { renderTemplate } from '@scribe/core';

export const copy = en;

export function fill(text: string, values: Record<string, string | number> = {}): string {
  return renderTemplate(text, values);
}

/** Time-of-day greeting key, per en.tonight.greeting. */
export function greetingKey(hour = new Date().getHours()): keyof typeof en.tonight.greeting {
  if (hour < 5) return 'lateNight';
  if (hour < 8) return 'earlyMorning';
  if (hour < 12) return 'morning';
  if (hour < 14) return 'midday';
  if (hour < 18) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}
