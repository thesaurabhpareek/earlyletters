import { beforeEach, describe, expect, it } from 'vitest';
import { Button, ButtonRow, IconButton } from '@/components/ui/button';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { ListRow } from '@/components/ui/list-row';
import { renderMarkup } from '../helpers/render-markup';
import { harness } from './harness';

/**
 * BL-269: AX5 (accessibility text size) truncation and labels, on the BL-278 component harness.
 * The harness renders static markup through react-dom/server with react-native-web. So these tests prove STRUCTURE:
 * the whole text is in the markup, no line limit is written, the accessible label is what we promise. They do NOT
 * prove live-region announcements, VoiceOver focus order, stacking (className does not reach the markup here) or
 * on-device scroll; those stay on the device plan (docs/qa/DEVICE_TEST_PLAN.md, FT-39).
 */
const AX5 = 3.12; // the Dynamic Type accessibility-5 scale the design tokens use
const NO_LINE_LIMIT = /r-textOverflow|r-whiteSpace|r-WebkitLineClamp|line-clamp|-webkit-box/;
const NoIcon = () => null;

beforeEach(() => {
  harness.fontScale = AX5;
  harness.announced.length = 0;
});

const LONG_TITLE = 'Keep it word for word, even when the sentence runs long and long and long';
const LONG_SUBTITLE = 'Asha said this in her own order, and the whole line is kept exactly as she said it.';

describe('[BL-269] [AX5 ListRow] truncation and labels (static markup; not announcements, not on-device scroll)', () => {
  it('keeps a long title, subtitle and value whole, with no line limit, at AX5', () => {
    const html = renderMarkup(<ListRow title={LONG_TITLE} subtitle={LONG_SUBTITLE} value="Sounds like me" onPress={() => {}} />);
    expect(html).toContain(LONG_TITLE);
    expect(html).toContain(LONG_SUBTITLE);
    expect(html).toContain('>Sounds like me<');
    expect(html).not.toMatch(NO_LINE_LIMIT);
  });

  it('names the row as title, subtitle, value, then the word a tap does', () => {
    const html = renderMarkup(<ListRow title="Reading size" subtitle="How big the words are" value="Large" actionWord="Change" onPress={() => {}} />);
    expect(html).toContain('aria-label="Reading size, How big the words are, Large, Change"');
    expect(html).toContain('role="button"');
  });

  it('gives a row nothing can press a label with no action word', () => {
    const html = renderMarkup(<ListRow title="Storage" value="12 MB" actionWord="Open" />);
    expect(html).toContain('aria-label="Storage, 12 MB"');
    expect(html).not.toContain('Open"');
  });
});

describe('[BL-269] [AX5 ChoiceGroup] two-up choices: labels and no truncation (static markup; stacking is on the device plan)', () => {
  const options = [
    { value: 'sounds', label: 'Sounds like me' },
    { value: 'not', label: 'Not quite' },
  ];

  it('names the group and each choice, and keeps every label whole with no line limit at AX5', () => {
    const html = renderMarkup(<ChoiceGroup label="Does this sound like Asha" options={options} value="sounds" onChange={() => {}} />);
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Does this sound like Asha"');
    expect(html.match(/role="radio"/g)).toHaveLength(2);
    for (const o of options) {
      expect(html).toContain(`aria-label="${o.label}"`);
      expect(html).toContain(`>${o.label}<`);
    }
    expect(html).not.toMatch(NO_LINE_LIMIT);
  });

  it('keeps a long list choice whole at AX5', () => {
    const html = renderMarkup(
      <ChoiceGroup layout="list" label="Spoken language" options={[{ value: 'a', label: LONG_TITLE }, { value: 'b', label: 'Hindi' }]} value="b" onChange={() => {}} />,
    );
    expect(html).toContain(LONG_TITLE);
    expect(html).not.toMatch(NO_LINE_LIMIT);
  });
});

describe('[BL-269] [AX5 Button] labels and no truncation (static markup; not focus order)', () => {
  it('keeps a long button label whole and labelled at AX5', () => {
    const label = "Add to Asha's book and keep every word exactly as it was said";
    const html = renderMarkup(<Button label={label} />);
    expect(html).toContain('role="button"');
    expect(html).toContain(label.replace("'", '&#x27;'));
    expect(html).not.toMatch(NO_LINE_LIMIT);
  });

  it('draws both buttons of a two-up row, each whole, at AX5', () => {
    const html = renderMarkup(
      <ButtonRow>
        <Button label="Birthday" />
        <Button label="Not here yet" />
      </ButtonRow>,
    );
    expect(html.match(/role="button"/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Birthday"');
    expect(html).toContain('aria-label="Not here yet"');
    expect(html).not.toMatch(NO_LINE_LIMIT);
  });

  it('gives an icon-only control the label VoiceOver reads', () => {
    const html = renderMarkup(<IconButton icon={NoIcon as never} label="Back" />);
    expect(html).toContain('aria-label="Back"');
    expect(html).toContain('role="button"');
  });
});
