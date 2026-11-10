// web: same (design preview) | android: same code
/**
 * Co-parent sharing, coming soon (founder decision, 3 Oct 2026). v1.0 ships on
 * this phone only, so writing a book together arrives in a later update. This is
 * the one presentation for the Family tab and every invite entry point
 * (lib/family/entry.logic.ts): calm, warm, never a dead end or an error.
 *
 * Pattern: one line drawing, a serif heading and one plain line, and no action
 * (founder, 8 Nov 2026: rewrite B of proposals/family-soon-content.md). No badge,
 * points or footer: a page for a feature nobody can use yet says "not yet" once.
 *
 * - No "Tell me when it's here" (SET-08, 31 Oct 2026): its confirmation promised a note "here" when the
 *   update arrives, and no build keeps that promise yet (the arrival card ships with co-parent sharing, a
 *   later 1.0.x under D-121). The button returns with that card. A day already stored on a phone
 *   (lib/family/coming-soon.logic.ts) is kept for it. One content-free event (coparent_soon_opened) counts
 *   how often the screen is seen; nothing else leaves the phone.
 * - Remote config `flags.familyTeaser = 'quiet'` keeps the drawing and heading and swaps
 *   the line for a plain one about this phone. It cannot turn sharing on.
 *
 * Accessibility: the drawing is decorative; headings in reading order (Family,
 * then the title), then the line. Text scales with Dynamic Type
 * (display and title caps from tokens only). Reduce Motion: the drawing is shown
 * complete and does not breathe.
 * Motion: the drawing draws once and breathes while focused (MOTION 5h, 5j);
 * controls never animate in (MOTION principle 2).
 */
import { useIsFocused } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Breathe } from '@/components/motion/breathe';
import { LineArt } from '@/components/ui/line-art';
import { ModalHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { copy, fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';
import { track } from '@/lib/analytics/track';
import { serverFeaturesEnabled } from '@/lib/capabilities';
import { useRemoteConfig } from '@/lib/remote';

export type CoParentSoonProps = {
  /** 'screen': the Family tab (large "Family" title). 'sheet': an invite route, with Close. */
  presentation: 'screen' | 'sheet';
  /** The open book's name; null before there is a book. */
  childName: string | null;
  onClose?: () => void;
};

export function CoParentSoon({ presentation, childName, onClose }: CoParentSoonProps) {
  const focused = useIsFocused();
  const { familyTeaser } = useRemoteConfig().flags;
  const s = familyCopy.soon;
  const child = childName?.trim() || s.childFallback;
  // Server features on means a store build (an alpha build shows the real flow instead, entry.logic inviteDestination):
  // its own words (BL-882), because the quiet variant says every letter stays on this phone.
  const store = serverFeaturesEnabled();
  const quiet = !store && familyTeaser === 'quiet';
  const sheet = presentation === 'sheet';

  // Content-free count of how often the teaser is seen. The tab stays mounted, so this fires each time it comes into focus.
  useEffect(() => {
    if (focused) track('coparent_soon_opened', { surface: sheet ? 'sheet' : 'tab' });
  }, [focused, sheet]);

  const body = (
    <ScrollView
      contentContainerClassName={sheet ? 'px-6 pb-8 pt-4' : 'px-5 pb-14 pt-4'}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}>
      {!sheet && (
        <Text variant="display" asHeading={1}>
          {copy.family.title}
        </Text>
      )}

      <View className={sheet ? 'items-center gap-5' : 'mt-4 items-center gap-5'}>
        <Breathe paused={!focused}>
          <LineArt name="together" width={232} />
        </Breathe>
        <Text variant="title1" asHeading={sheet ? 1 : 2} className="text-center">
          {fill(store ? s.storeBuild.title : quiet ? s.quiet.title : s.title, { child })}
        </Text>
        <Text variant="body" tone="muted" className="max-w-[340px] text-center">
          {fill(store ? s.storeBuild.lead : quiet ? s.quiet.body : s.lead, { child })}
        </Text>
      </View>
    </ScrollView>
  );

  if (!sheet) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background">
        {body}
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* The modal idiom: Close, top right (lib/navigation.logic.ts). */}
      {onClose ? <ModalHeader onClose={onClose} closeLabel={s.close} /> : null}
      {body}
    </SafeAreaView>
  );
}
