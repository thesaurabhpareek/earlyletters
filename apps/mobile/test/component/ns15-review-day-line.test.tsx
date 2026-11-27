/**
 * Review's day line (NS-15-R1, NS-15-R7), rendered: for the author a button with the spoken day as its label and a
 * visible calendar mark (react-native-web does not write the hint, so it is pinned in ns15-letter-another-day.test.ts);
 * without a press (a letter already kept) plain text, not a button.
 * Fictional family "Asha" only.
 */
import { describe, expect, it, vi } from 'vitest';
import { ReviewDayLine } from '@/components/capture/review-day-line';
import { renderMarkup } from '../helpers/render-markup';

vi.mock('phosphor-react-native/src/icons/CalendarBlank', () => ({ CalendarBlankIcon: () => <i data-mark="calendar" /> }));

const DAY = { text: 'Tuesday, 20 May 2026', spoken: 'Tuesday, 20 May 2026, 2 months and 1 week', hint: 'Change the date' };

describe('[NS-15-R1] the author can set the day a letter is about', () => {
  it('the dateline is a button named by its spoken day, with a visible mark', () => {
    const html = renderMarkup(<ReviewDayLine {...DAY} onPress={() => {}} />);
    expect(html).toContain('role="button"');
    expect(html).toContain(`aria-label="${DAY.spoken}"`);
    expect(html).toContain('Tuesday, 20 May 2026');
    expect(html).toContain('data-mark="calendar"');
  });
});

describe('[NS-15-R7] only the author moves a letter', () => {
  it('with no press it is the day as plain text: no button and no mark', () => {
    const html = renderMarkup(<ReviewDayLine {...DAY} />);
    expect(html).not.toContain('role="button"');
    expect(html).not.toContain('data-mark="calendar"');
    expect(html).toContain('Tuesday, 20 May 2026');
  });
});
