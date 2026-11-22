import { beforeEach, describe, expect, it } from 'vitest';
import { ErrorLine } from '@/components/ui/error-line';
import { renderMarkup } from '../helpers/render-markup';
import { harness } from './harness';

beforeEach(() => {
  harness.fontScale = 1;
  harness.announced.length = 0;
});

describe('[BL-278] [COMPONENTS ErrorLine] the error line, rendered', () => {
  it('draws the words once, as one labelled element', () => {
    const html = renderMarkup(<ErrorLine message="That did not go through. Try again in a moment." />);
    expect(html.match(/That did not go through\. Try again in a moment\./g)?.length).toBeGreaterThanOrEqual(1);
    expect(html).toContain('aria-label="That did not go through. Try again in a moment."');
  });

  it('draws nothing for an empty or missing message', () => {
    expect(renderMarkup(<ErrorLine message="" />)).toBe('');
    expect(renderMarkup(<ErrorLine message={null} />)).toBe('');
  });

  it('never sets a line limit on the words, so a larger text size is free to grow the line', () => {
    harness.fontScale = 3.12;
    const html = renderMarkup(<ErrorLine message="Asha's letter is still on this phone." />);
    // react-native-web writes numberOfLines as the textOverflow and whiteSpace atomic classes.
    expect(html).not.toMatch(/r-textOverflow|r-whiteSpace|line-clamp/);
    expect(html).toContain("Asha&#x27;s letter is still on this phone.");
  });
});
