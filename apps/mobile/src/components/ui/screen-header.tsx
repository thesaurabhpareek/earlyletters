// web: same | android: same
/**
 * ModalHeader and BackButton: the only two navigation controls a screen draws itself
 * (lib/navigation.logic.ts holds the rule).
 *
 * ModalHeader: for screens presented as a modal (Write, Review, Listening, Read together,
 * the invite and sign-in sheets). "Close" is a quiet 44 pt button in the top RIGHT corner;
 * anything that used to sit there (the recording player, the "saved on this phone" note, the
 * page counter) moves to the left. An optional title sits between, centred on nothing: it is
 * a heading for VoiceOver.
 *
 * BackButton: the chevron and "Back" of a step inside one route (onboarding), drawn like the
 * native header's back control so push screens and flow steps read the same.
 *
 * Both are Button `quiet` size sm (44 pt minimum, grows with Dynamic Type, label wraps never
 * truncates). They are silent: navigation has no haptic (MOTION 6).
 */
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

export type ModalHeaderProps = {
  onClose: () => void;
  /** Left side: a status or a secondary control (Hear it, "saved on this phone", 2 / 9). */
  leading?: ReactNode;
  /** Heading between the two (rarely needed; most modals title their content instead). */
  title?: string;
  /** Spoken after "Close" (for example where the draft is kept). */
  closeHint?: string;
  closeLabel?: string;
  /** Busy: the screen is doing something that should not be cut off (a request in flight). */
  closeDisabled?: boolean;
  className?: string;
};

export function ModalHeader({ onClose, leading, title, closeHint, closeLabel = copy.common.closeButton, closeDisabled, className }: ModalHeaderProps) {
  return (
    <View className={cn('min-h-12 flex-row items-center justify-between gap-3 px-5 pt-1', className)}>
      <View className="min-h-11 flex-1 flex-row items-center">{leading}</View>
      {title ? (
        <Text variant="headline" asHeading className="shrink text-center">
          {title}
        </Text>
      ) : null}
      <Button variant="quiet" size="sm" className="-mr-4" label={closeLabel} accessibilityHint={closeHint} disabled={closeDisabled} onPress={onClose} />
    </View>
  );
}

export function BackButton({ onPress, label = copy.common.backButton, className }: { onPress: () => void; label?: string; className?: string }) {
  return (
    <Button variant="quiet" size="sm" icon={CaretLeftIcon} label={label} className={cn('-ml-4 self-start', className)} onPress={onPress} />
  );
}
