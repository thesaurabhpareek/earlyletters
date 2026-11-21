// web: same (there is no keyboard event, so the cover always shows) | android: same
/**
 * The heading of a step that names a book, with the small cover (EXPERIENCE_PASS_2026-10 S05, S06, S47): used by
 * the first-run name step, the first-run signature step and Add a child, so the three never drift apart.
 *
 * Where the cover goes is one pure rule, components/book/cover-place.logic.ts:
 *   beside   the default: the heading takes the width the cover leaves, the cover is at the top right.
 *   below    accessibility text sizes: the heading takes the whole row and the cover sits under it, so the title
 *            reads in lines and not a word a line, and the next field is still on the first screen.
 *   hidden   the keyboard is up and leaves under 480 pt free: the name field stays in view.
 *
 * The cover is decorative here (no accessibilityLabel): the same name is real, scalable text in the field and the
 * heading. The cover fades in (fadeMs) when it arrives; it never animates per letter (that is BookCover's).
 */
import * as React from 'react';
import { Keyboard, Platform, View, useWindowDimensions, type Text as RNText } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { coverPlace, type CoverPlace } from '@/components/book/cover-place.logic';
import { Text } from '@/components/ui/text';
import { useIsAccessibilitySize } from '@/lib/a11y';

/** How tall the keyboard is right now (0 when it is down). */
function useKeyboardHeight(): number {
  const [height, setHeight] = React.useState(0);
  React.useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

/** Where the cover goes right now: beside the heading, under it at accessibility sizes, or away under the keyboard. */
export function useCoverPlace(): CoverPlace {
  const keyboardHeight = useKeyboardHeight();
  const { height: windowHeight } = useWindowDimensions();
  const accessibilitySize = useIsAccessibilitySize();
  return coverPlace({ windowHeight, keyboardHeight, accessibilitySize });
}

export function CoverHeading({ title, headingRef, place, children }: { title: string; headingRef: React.Ref<RNText>; place: CoverPlace; children: React.ReactNode }) {
  const cover =
    place === 'hidden' ? null : (
      <Animated.View entering={FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never)} className={place === 'below' ? 'self-start' : undefined}>
        {children}
      </Animated.View>
    );
  const heading = (
    <Text ref={headingRef} variant="title1" asHeading={1} className={place === 'below' ? undefined : 'flex-1'}>
      {title}
    </Text>
  );
  if (place === 'below') {
    return (
      <View className="gap-4">
        {heading}
        {cover}
      </View>
    );
  }
  return (
    <View className="flex-row items-start gap-4">
      {heading}
      {cover}
    </View>
  );
}
