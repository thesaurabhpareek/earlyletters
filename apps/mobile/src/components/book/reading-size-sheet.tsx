// web: later | android: same code
/**
 * Reading Size (DESIGN_LANGUAGE 12, Letter reading view): Standard, Large, Large print,
 * on top of Dynamic Type. Apple Books "Themes & Settings": a small sheet over the page,
 * each option previewed at its own size, the letter behind changing live.
 * Radio semantics and the selection haptic come from ChoiceGroup.
 */
import { tokens } from '@scribe/design-tokens';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';
import type { ReadingSize } from '@/components/child/child-store';

export const READING_SIZES: ReadingSize[] = ['standard', 'large', 'largePrint'];

interface Props {
  visible: boolean;
  value: ReadingSize;
  onChange: (v: ReadingSize) => void;
  onClose: () => void;
}

export function ReadingSizeSheet({ visible, value, onChange, onClose }: Props) {
  return (
    <Sheet open={visible} onClose={onClose} title={copy.reader.readingSizeTitle}>
      <ChoiceGroup
        label={copy.reader.readingSizeA11y}
        layout="list"
        value={value}
        onChange={onChange}
        options={READING_SIZES.map((size) => ({
          value: size,
          label: copy.reader.sizes[size],
          render: () => (
            <Text variant="letterBody" scale={(18 / 20) * tokens.readingScale[size]}>
              {copy.reader.sizes[size]}
            </Text>
          ),
        }))}
      />
    </Sheet>
  );
}
