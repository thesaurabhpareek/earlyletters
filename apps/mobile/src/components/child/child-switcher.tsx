// android: same (ui/sheet is @gorhom/bottom-sheet on both platforms)
/**
 * "For Asha" with a chevron atop the Book (PRD B F2.2). A second child's book is
 * three taps away or fewer. The picker is the app's one `Sheet` with a radio list
 * (ChoiceGroup "list"), so it looks, moves and reads like Reading Size and Whose book.
 * The eyebrow uses the Text `caps` style: VoiceOver hears "For Asha", not letters.
 */
import { router } from 'expo-router';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { Button } from '@/components/ui/button';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { ordinalOf, track } from '@/lib/analytics/track';
import { copy, fill } from '@/lib/copy';
import { useChildren } from './use-children';

export function ChildSwitcher() {
  const { c } = useTheme();
  const { children, active, select } = useChildren();
  const [open, setOpen] = useState(false);
  const s = copy.children.switcher;
  if (!active) return null;

  const close = () => setOpen(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={fill(s.label, { child: active.name })}
        accessibilityHint={s.hint}
        hitSlop={8}
        className="min-h-11 flex-row items-center gap-1 self-start">
        <Text variant="caption" caps tone="muted" style={{ letterSpacing: 1 }}>
          {fill(s.label, { child: active.name })}
        </Text>
        <CaretDownIcon size={14} color={c.textMuted} weight="bold" />
      </Pressable>

      <Sheet open={open} onClose={close} title={s.title}>
        <ChoiceGroup
          label={s.title}
          layout="list"
          className="-mx-4"
          value={active.id}
          options={children.map((ch) => ({ value: ch.id, label: fill(copy.book.title, { child: ch.name }) }))}
          onChange={(id) => {
            select(id);
            track('child_switched', { child_ordinal: ordinalOf(id), surface: 'book' });
          }}
          onSelect={close}
        />
        <Button
          variant="quiet"
          className="self-start px-0"
          onPress={() => {
            close();
            router.push('/settings/children/new');
          }}>
          <PlusIcon size={20} color={c.accent} weight="bold" />
          <Text>{s.addButton}</Text>
        </Button>
      </Sheet>
    </>
  );
}
